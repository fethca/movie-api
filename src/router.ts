import { Router } from 'express'
import {
  getActors,
  getCategories,
  getCountries,
  getDirectors,
  getGenres,
  getMax,
  getMovie,
  getMovies,
  getPolls,
  searchActors,
  searchDirectors,
  searchMovie,
  searchPolls,
  updateMovie,
} from './controllers/movies.js'
import { getTMDB } from './controllers/radarr.js'
import { getStatus } from './controllers/status.js'

export function router(): Router {
  const router = Router()

  router.get('/status', getStatus)

  router.get('/movies', getMovies)
  router.put('/movies/:id', updateMovie)
  router.get('/movies/:id', getMovie)
  router.get('/movies/max/:property', getMax)
  router.get('/directors', getDirectors)
  router.get('/actors', getActors)
  router.get('/polls', getPolls)
  router.get('/directors/search', searchDirectors)
  router.get('/actors/search', searchActors)
  router.get('/polls/search', searchPolls)
  router.get('/categories', getCategories)
  router.get('/countries', getCountries)
  router.get('/genres', getGenres)
  router.get('/list', searchMovie)
  router.get('/tmdb', getTMDB)

  return router
}
