import { ConfigService } from '@fethcat/config'
import { movieList } from '../services.js'

type IActor = { name: string; _id: string; maxRating: number; maxRatingCount: number }

export class ActorService extends ConfigService<IActor[]> {
  constructor(interval: number) {
    super(interval)
  }

  async fetch(): Promise<IActor[]> {
    try {
      const movies = await movieList.getConfig()
      const actors: Record<string, Omit<IActor, '_id'>> = {}
      for (const movie of movies) {
        movie.senscritique.actors.forEach(({ actor }) => {
          const { _id, name } = actor
          if (!actors[_id]) {
            actors[_id] = {
              name,
              maxRating: movie.senscritique.rating || 0,
              maxRatingCount: movie.senscritique.stats.ratingCount,
            }
          } else {
            actors[_id].maxRating = Math.max(actors[_id].maxRating, movie.senscritique.rating || 0)
            actors[_id].maxRatingCount = Math.max(actors[_id].maxRatingCount, movie.senscritique.stats.ratingCount)
          }
        })
      }

      const list: IActor[] = []

      for (const [_id, value] of Object.entries(actors)) {
        list.push({ _id, ...value })
      }
      return list.sort((a, b) => b.maxRatingCount - a.maxRatingCount || b.maxRating - a.maxRating)
    } catch (error) {
      throw new Error('Failed to load actors config')
    }
  }
}
