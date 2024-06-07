import { ConfigService } from '@fethcat/config'
import { movieList } from '../services.js'

type IPoll = { name: string; id: number; maxRating: number; maxRatingCount: number }

export class PollService extends ConfigService<IPoll[]> {
  constructor(interval: number) {
    super(interval)
  }

  async fetch(): Promise<IPoll[]> {
    try {
      const movies = await movieList.getConfig()
      const polls: Record<string, Omit<IPoll, 'id'>> = {}
      for (const movie of movies) {
        movie.senscritique.polls?.forEach((poll) => {
          const { id, name } = poll
          if (!polls[id]) {
            polls[id] = {
              name,
              maxRating: movie.senscritique.rating || 0,
              maxRatingCount: movie.senscritique.stats.ratingCount,
            }
          } else {
            polls[id].maxRating = Math.max(polls[id].maxRating, movie.senscritique.rating || 0)
            polls[id].maxRatingCount = Math.max(polls[id].maxRatingCount, movie.senscritique.stats.ratingCount)
          }
        })
      }

      const list: IPoll[] = []

      for (const [id, value] of Object.entries(polls)) {
        list.push({ id: Number(id), ...value })
      }
      return list.sort((a, b) => b.maxRatingCount - a.maxRatingCount || b.maxRating - a.maxRating)
    } catch (error) {
      throw new Error('Failed to load polls config')
    }
  }
}
