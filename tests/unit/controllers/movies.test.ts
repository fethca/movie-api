import { Movie } from '@fethcat/shared/mongo'
import { Request } from 'express'
import { getMovie, getMovies, updateMovie } from '../../../src/controllers/movies.js'
import { mockReqRes } from '../../mock.js'

const senscritique = {
  actors: [],
  category: 'Film',
  countries: [],
  dateRelease: '2024-03-21',
  dateReleaseOriginal: '2024-03-21',
  directors: [],
  duration: 6840,
  frenchReleaseDate: '2024-03-21',
  genresInfos: [],
  id: 1,
  originalTitle: 'Unfound',
  pictures: { backdrops: [], posters: [], screenshots: [] },
  polls: [],
  popularity: 0,
  rating: 5,
  slug: 'unfound',
  stats: { ratingCount: 0, wishCount: 0, recommendCount: 0, reviewCount: 0 },
  synopsis: '',
  title: 'Unfound',
  yearOfProduction: 2022,
}

const tmdb = {
  cleanTitle: 'found',
  genres: [],
  images: [],
  imdbId: 'tt1',
  originalLanguage: { id: 1, name: 'English' },
  originalTitle: 'Found',
  popularity: 1,
  ratings: {},
  runtime: 0,
  searchQuery: 42,
  sortTitle: 'found',
  studio: 'studio',
  title: 'Found',
  tmdbId: 42,
  year: 2022,
}

const opsDatas = { lastJobDate: 1000, lastUpdateDate: 1000, unfound: true }

describe('getMovies', () => {
  beforeEach(() => {
    vi.spyOn(Movie, 'countDocuments').mockResolvedValue(1 as never)
    const query = { sort: vi.fn(), skip: vi.fn(), limit: vi.fn().mockResolvedValue([]) }
    query.sort.mockReturnValue(query)
    query.skip.mockReturnValue(query)
    vi.spyOn(Movie, 'find').mockReturnValue(query as never)
  })

  it('should only return unfound movies when unfound is true', async () => {
    const { req, res } = mockReqRes({ query: { unfound: 'true' } } as unknown as Request)
    await getMovies(req, res)
    expect(Movie.find).toHaveBeenCalledWith({ 'opsDatas.unfound': true, edition: { $ne: true } })
  })

  it('should not filter on unfound when unfound is false', async () => {
    const { req, res } = mockReqRes({ query: { unfound: 'false' } } as unknown as Request)
    await getMovies(req, res)
    expect(Movie.find).toHaveBeenCalledWith({ edition: { $ne: true } })
  })
})

describe('updateMovie', () => {
  beforeEach(() => {
    vi.spyOn(Movie, 'findOneAndUpdate').mockResolvedValue(null)
  })

  function request(movie: object) {
    const { req, res } = mockReqRes({ params: { id: '1' }, body: { movie } } as unknown as Request)
    res.sendStatus = vi.fn()
    return { req, res }
  }

  it('should mark the movie as found and queue it for the next scrapper run when a tmdb match is given', async () => {
    const { req, res } = request({ id: 1, senscritique, tmdb, opsDatas })
    await updateMovie(req, res)
    expect(Movie.findOneAndUpdate).toHaveBeenCalledWith(
      { id: 1 },
      expect.objectContaining({ opsDatas: { lastJobDate: 0, lastUpdateDate: 1000, unfound: false } }),
    )
  })

  it('should keep the movie unfound when it has no tmdb match', async () => {
    const { req, res } = request({ id: 1, senscritique, opsDatas })
    await updateMovie(req, res)
    expect(Movie.findOneAndUpdate).toHaveBeenCalledWith(
      { id: 1 },
      expect.objectContaining({ opsDatas: { lastJobDate: 0, lastUpdateDate: 1000, unfound: true } }),
    )
  })
})

describe('getMovie', () => {
  it('should return the other editions sharing its tmdb id as versions', async () => {
    const versions = [{ id: 2 }]
    vi.spyOn(Movie, 'findOne').mockResolvedValue({ id: 1, tmdb: { tmdbId: 42 } })
    vi.spyOn(Movie, 'find').mockResolvedValue(versions)
    const { req, res } = mockReqRes({ params: { id: '1' } } as unknown as Request)

    await getMovie(req, res)

    expect(Movie.find).toHaveBeenCalledWith({ 'tmdb.tmdbId': 42, id: { $ne: 1 } })
    expect(res.json).toHaveBeenCalledWith({ movie: { id: 1, tmdb: { tmdbId: 42 } }, versions })
  })

  it('should return no versions for a movie without tmdb match', async () => {
    vi.spyOn(Movie, 'findOne').mockResolvedValue({ id: 1 })
    const { req, res } = mockReqRes({ params: { id: '1' } } as unknown as Request)

    await getMovie(req, res)

    expect(res.json).toHaveBeenCalledWith({ movie: { id: 1 }, versions: [] })
  })
})
