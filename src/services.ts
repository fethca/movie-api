import { ActorService } from './services/actors.js'
import { DirectorService } from './services/directors.js'
import { MovieService } from './services/movies.js'
import { PollService } from './services/polls.js'
import { RadarrService } from './services/radarr.js'
import { settings } from './settings.js'

export const radarr = new RadarrService(settings.radarr.refreshConfig)
export const movieList = new MovieService(settings.config.interval, { autoRefresh: true })
export const directorList = new DirectorService(settings.config.interval, { autoRefresh: true })
export const actorList = new ActorService(settings.config.interval, { autoRefresh: true })
export const pollList = new PollService(settings.config.interval, { autoRefresh: true })
