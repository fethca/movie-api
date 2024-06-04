import { ConfigService } from '@fethcat/config'
import { movieList } from '../services.js'

type IPoll = { name: string; _id: string; maxRating: number; maxRatingCount: number }

export class PollService extends ConfigService<IPoll[]> {
  constructor(interval: number) {
    super(interval)
  }

  async fetch(): Promise<IPoll[]> {
    try {
      const movies = await movieList.getConfig()
      const polls: Record<string, Omit<IPoll, '_id'>> = {}
      for (const movie of movies) {
        movie.senscritique.polls?.forEach((poll) => {
          const { _id, name } = poll
          if (!polls[_id]) {
            polls[_id] = {
              name,
              maxRating: movie.senscritique.rating || 0,
              maxRatingCount: movie.senscritique.stats.ratingCount,
            }
          } else {
            polls[_id].maxRating = Math.max(polls[_id].maxRating, movie.senscritique.rating || 0)
            polls[_id].maxRatingCount = Math.max(polls[_id].maxRatingCount, movie.senscritique.stats.ratingCount)
          }
        })
      }

      const list: IPoll[] = []

      for (const [_id, value] of Object.entries(polls)) {
        list.push({ _id, ...value })
      }
      return list.sort((a, b) => b.maxRatingCount - a.maxRatingCount || b.maxRating - a.maxRating)
    } catch (error) {
      throw new Error('Failed to load polls config')
    }
  }
}
