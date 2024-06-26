import { ConfigService } from '@fethcat/config'
import { Movie } from '@fethcat/shared/mongo'
import { IMovie } from '@fethcat/shared/types'

export class MovieService extends ConfigService<IMovie[]> {
  constructor(interval: number, options?: { autoRefresh: boolean }) {
    super(interval, options)
  }

  async fetch(): Promise<IMovie[]> {
    try {
      const movies = await Movie.find({})
      return movies
    } catch (error) {
      throw new Error('Failed to load movie config')
    }
  }
}
