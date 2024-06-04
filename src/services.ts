import { ActorService } from './services/actors.js'
import { DirectorService } from './services/directors.js'
import { MovieService } from './services/movies.js'
import { PollService } from './services/polls.js'
import { RadarrService } from './services/radarr.js'
import { settings } from './settings.js'

export const radarr = new RadarrService(settings.radarr.refreshConfig)
export const directorList = new DirectorService(43200000) //12h
export const actorList = new ActorService(43200000)
export const pollList = new PollService(43200000)
export const movieList = new MovieService(43200000)
