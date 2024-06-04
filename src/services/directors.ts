import { ConfigService } from '@fethcat/config'
import { movieList } from '../services.js'

type IDirector = { name: string; _id: string; maxRating: number; maxRatingCount: number }

export class DirectorService extends ConfigService<IDirector[]> {
  constructor(interval: number) {
    super(interval)
  }

  async fetch(): Promise<IDirector[]> {
    try {
      const movies = await movieList.getConfig()
      const directors: Record<string, Omit<IDirector, '_id'>> = {}
      for (const movie of movies) {
        movie.senscritique.directors.forEach((director) => {
          const { _id, name } = director
          if (!directors[_id]) {
            directors[_id] = {
              name,
              maxRating: movie.senscritique.rating || 0,
              maxRatingCount: movie.senscritique.stats.ratingCount,
            }
          } else {
            directors[_id].maxRating = Math.max(directors[_id].maxRating, movie.senscritique.rating || 0)
            directors[_id].maxRatingCount = Math.max(
              directors[_id].maxRatingCount,
              movie.senscritique.stats.ratingCount,
            )
          }
        })
      }

      const list: IDirector[] = []

      for (const [_id, value] of Object.entries(directors)) {
        list.push({ _id, ...value })
      }
      return list.sort((a, b) => b.maxRatingCount - a.maxRatingCount || b.maxRating - a.maxRating)
    } catch (error) {
      throw new Error('Failed to load directors config')
    }
  }
}
