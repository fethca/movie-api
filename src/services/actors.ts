import { ConfigService } from '@fethcat/config'
import { movieList } from '../services.js'

type IActor = { name: string; id: number; maxRating: number; maxRatingCount: number }

export class ActorService extends ConfigService<IActor[]> {
  constructor(interval: number, options?: { autoRefresh: boolean }) {
    super(interval, options)
  }

  async fetch(): Promise<IActor[]> {
    try {
      const movies = await movieList.getConfig()
      const actors: Record<string, Omit<IActor, 'id'>> = {}
      for (const movie of movies) {
        movie.senscritique.actors.forEach(({ actor }) => {
          const { id, name } = actor
          if (!actors[id]) {
            actors[id] = {
              name,
              maxRating: movie.senscritique.rating || 0,
              maxRatingCount: movie.senscritique.stats.ratingCount,
            }
          } else {
            actors[id].maxRating = Math.max(actors[id].maxRating, movie.senscritique.rating || 0)
            actors[id].maxRatingCount = Math.max(actors[id].maxRatingCount, movie.senscritique.stats.ratingCount)
          }
        })
      }

      const list: IActor[] = []

      for (const [id, value] of Object.entries(actors)) {
        list.push({ id: Number(id), ...value })
      }
      return list.sort((a, b) => b.maxRatingCount - a.maxRatingCount || b.maxRating - a.maxRating)
    } catch (error) {
      throw new Error('Failed to load actors config')
    }
  }
}
