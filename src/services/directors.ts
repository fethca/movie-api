import { ConfigService } from '@fethcat/config'
import { movieList } from '../services.js'

type IDirector = { name: string; id: number; maxRating: number; maxRatingCount: number }

export class DirectorService extends ConfigService<IDirector[]> {
  constructor(interval: number) {
    super(interval)
  }

  async fetch(): Promise<IDirector[]> {
    try {
      const movies = await movieList.getConfig()
      const directors: Record<string, Omit<IDirector, 'id'>> = {}
      for (const movie of movies) {
        movie.senscritique.directors.forEach((director) => {
          const { id, name } = director
          if (!directors[id]) {
            directors[id] = {
              name,
              maxRating: movie.senscritique.rating || 0,
              maxRatingCount: movie.senscritique.stats.ratingCount,
            }
          } else {
            directors[id].maxRating = Math.max(directors[id].maxRating, movie.senscritique.rating || 0)
            directors[id].maxRatingCount = Math.max(directors[id].maxRatingCount, movie.senscritique.stats.ratingCount)
          }
        })
      }

      const list: IDirector[] = []

      for (const [id, value] of Object.entries(directors)) {
        list.push({ id: Number(id), ...value })
      }
      return list.sort((a, b) => b.maxRatingCount - a.maxRatingCount || b.maxRating - a.maxRating)
    } catch (error) {
      throw new Error('Failed to load directors config')
    }
  }
}
