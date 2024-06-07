import { getMax as max } from '@fethcat/shared/helpers'
import { Movie } from '@fethcat/shared/mongo'
import { movieSchema } from '@fethcat/shared/types'
import { Request, Response } from 'express'
import Fuse from 'fuse.js'
import { z } from 'zod'
import { _compare, _exists, _in, formatDates, formatSort } from '../helpers/mongo.js'
import { actorList, directorList, pollList } from '../services.js'
import { booleanSchema, paginationSchema } from '../types.js'

const schemas = {
  getMovies: z
    .object({
      actors: z.string().optional(),
      categories: z.string().optional(),
      countries: z.string().optional(),
      dateRelease: z.string().optional(),
      dateReleaseOrder: z.enum(['gte', 'lte', 'gte,lte']).optional(),
      directors: z.string().optional(),
      duration: z.string().optional(),
      durationOrder: z.enum(['gte', 'lte', 'gte,lte']).optional(),
      genres: z.string().optional(),
      genresSource: z.enum(['senscritique', 'tmdb']).optional(),
      pageSize: z.string().optional(),
      popularity: z.string().optional(),
      popularityOrder: z.enum(['gte', 'lte', 'gte,lte']).optional(),
      rating: z.string().optional(),
      ratingCount: z.string().optional(),
      ratingCountOrder: z.enum(['gte', 'lte', 'gte,lte']).optional(),
      ratingOrder: z.enum(['gte', 'lte', 'gte,lte']).optional(),
      random: booleanSchema,
      released: booleanSchema,
      sortOrder: z.enum(['asc', 'desc']).optional(),
      sortValue: z.string().default('tmdb.popularity'),
      polls: z.string().optional(),
      providers: booleanSchema,
    })
    .merge(paginationSchema),
  getDirectors: z.object({ pageSize: z.coerce.number().default(500) }),
  getActors: z.object({ pageSize: z.coerce.number().default(500) }),
  getPolls: z.object({ pageSize: z.coerce.number().default(50) }),
  searchDirector: z.object({ search: z.string() }),
  searchActor: z.object({ search: z.string() }),
  searchPoll: z.object({ search: z.string() }),
  updateMovie: z.object({ movie: movieSchema.omit({ updatedAt: true }) }),
  getGenres: z.object({ source: z.enum(['senscritique', 'tmdb']).default('senscritique') }),
  movieId: z
    .object({ id: z.string() })
    .refine(({ id }) => !isNaN(Number(id)), 'Invalid Id')
    .transform(({ id }) => ({ id: Number(id) })),
  getMax: z.object({ property: z.enum(['tmdb.popularity', 'senscritique.stats.ratingCount']) }),
  searchMovie: z.object({ search: z.string() }),
}

export async function getMovies(req: Request, res: Response) {
  const { success, failure } = req.logger.action('get_movies')
  try {
    const {
      actors,
      categories,
      countries,
      dateRelease,
      dateReleaseOrder,
      directors,
      duration,
      durationOrder,
      genres,
      genresSource,
      pageIndex,
      pageSize,
      popularity,
      popularityOrder,
      random,
      rating,
      ratingCount,
      ratingCountOrder,
      ratingOrder,
      released,
      sortOrder,
      sortValue,
      providers,
      polls,
    } = schemas.getMovies.parse(req.query)

    const formattedDates = formatDates(dateRelease, dateReleaseOrder)
    const filters = {
      ..._in('senscritique.directors', directors),
      ..._in('senscritique.actors.actor', actors),
      ..._in('senscritique.polls', polls),
      ..._in('senscritique.category', categories),
      ..._in('senscritique.countries', countries),
      ..._in(genresSource === 'tmdb' ? 'tmdb.genres' : 'senscritique.genresInfos', genres),
      ..._compare('senscritique.dateRelease', formattedDates, dateReleaseOrder),
      ..._compare('senscritique.rating', rating, ratingOrder),
      ..._compare('senscritique.stats.ratingCount', ratingCount, ratingCountOrder),
      ..._compare('popularity', popularity, popularityOrder),
      ..._compare('senscritique.duration', duration, durationOrder),
      ..._exists('providers.0', providers),
      released,
    }

    const total = await Movie.countDocuments({ ...filters })

    if (pageIndex * pageSize > total) {
      res.json({ movies: [], total })
      success()
      return
    }

    const sort = formatSort(sortValue, sortOrder)

    const movies = await Movie.find(filters)
      .sort(sort)
      .skip(random ? Math.floor(Math.random() * total) : pageIndex * pageSize)
      .limit(random ? 1 : pageSize)

    res.json({ movies, total })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

export async function getMovie(req: Request, res: Response) {
  const { success, failure } = req.logger.action('get_movie')
  try {
    const { id } = schemas.movieId.parse(req.params)
    const movie = await Movie.findOne({ id })
    res.json({ movie })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

export async function updateMovie(req: Request, res: Response) {
  const { success, failure } = req.logger.action('update_movie')
  try {
    const { id } = schemas.movieId.parse(req.params)
    const { movie } = schemas.updateMovie.parse(req.body)
    await Movie.findOneAndUpdate({ id }, movie)
    res.sendStatus(200)
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

export async function getDirectors(req: Request, res: Response) {
  const { success, failure } = req.logger.action('get_directors')
  try {
    const { pageSize } = schemas.getDirectors.parse(req.query)
    const directors = await directorList.getConfig()
    const slicedList = directors.slice(0, pageSize)
    const sortedList = slicedList.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

    res.json({ directors: sortedList })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

export async function getActors(req: Request, res: Response) {
  const { success, failure } = req.logger.action('get_actors')
  try {
    const { pageSize } = schemas.getActors.parse(req.query)
    const actors = await actorList.getConfig()
    const slicedList = actors.slice(0, pageSize)
    const sortedList = slicedList.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

    res.json({ actors: sortedList })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

export async function getPolls(req: Request, res: Response) {
  const { success, failure } = req.logger.action('get_polls')
  try {
    const { pageSize } = schemas.getPolls.parse(req.query)
    const polls = await pollList.getConfig()
    const slicedList = polls.slice(0, pageSize)
    const sortedList = slicedList.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

    res.json({ polls: sortedList })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

export async function searchMovie(req: Request, res: Response) {
  const { success, failure } = req.logger.action('get_movie_list')
  try {
    const { search } = schemas.searchMovie.parse(req.query)
    const list = await Movie.find(
      { $text: { $search: search } },
      { projection: { _id: 0, score: { $meta: 'textScore' } } },
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)

    res.json({ list })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

export async function searchDirectors(req: Request, res: Response) {
  const { success, failure } = req.logger.action('search_directors')
  try {
    const { search } = schemas.searchDirector.parse(req.query)
    req.logger.addMeta({ search })
    const directors = await directorList.getConfig()

    const fuseOptions = { includeScore: true, threshold: 1.0 }
    const directorFuse = new Fuse(directors, { keys: ['name'], ...fuseOptions })
    const directorScore = directorFuse.search(search)

    const list = directorScore.slice(0, 10).map((scores) => scores.item)
    res.json({ list })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

export async function searchActors(req: Request, res: Response) {
  const { success, failure } = req.logger.action('search_actors')
  try {
    const { search } = schemas.searchActor.parse(req.query)
    req.logger.addMeta({ search })
    const actors = await actorList.getConfig()

    const fuseOptions = { includeScore: true, threshold: 1.0 }
    const actorFuse = new Fuse(actors, { keys: ['name'], ...fuseOptions })
    const actorScore = actorFuse.search(search)

    const list = actorScore.slice(0, 10).map((scores) => scores.item)
    res.json({ list })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

export async function searchPolls(req: Request, res: Response) {
  const { success, failure } = req.logger.action('search_polls')
  try {
    const { search } = schemas.searchPoll.parse(req.query)
    req.logger.addMeta({ search })
    const polls = await pollList.getConfig()

    const fuseOptions = { includeScore: true, threshold: 1.0 }
    const pollFuse = new Fuse(polls, { keys: ['name'], ...fuseOptions })
    const pollScore = pollFuse.search(search)

    const list = pollScore.slice(0, 10).map((scores) => scores.item)
    res.json({ list })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

export async function getGenres(req: Request, res: Response) {
  const { success, failure } = req.logger.action('get_genres')
  try {
    const { source } = schemas.getGenres.parse(req.query)
    const query = source === 'senscritique' ? 'senscritique.genresInfos' : 'tmdb.genres'

    const genres = (await Movie.distinct(query)).filter(Boolean)

    res.json({ genres })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

export async function getCategories(req: Request, res: Response) {
  const { success, failure } = req.logger.action('get_categories')
  try {
    const categories = await Movie.distinct('senscritique.category')
    res.json({ categories })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

export async function getCountries(req: Request, res: Response) {
  const { success, failure } = req.logger.action('get_countries')
  try {
    const countries = await Movie.distinct('senscritique.countries', { countries: { $nin: ['', null] } }).collation({
      locale: 'fr',
    })
    res.json({ countries })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}

export async function getMax(req: Request, res: Response) {
  const { success, failure } = req.logger.action('get_max')
  try {
    const { property } = schemas.getMax.parse(req.params)
    const result = await max(Movie, property)
    res.json({ max: result })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}
