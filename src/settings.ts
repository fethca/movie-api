import { extractPackageJson } from '@fethcat/shared/helpers'
import { redisValidators, validateEnv } from '@fethcat/validator'
import { randomBytes } from 'crypto'
import { bool, num, str } from 'envalid'
import mongoose, { QueryOptions } from 'mongoose'

const { name, version } = extractPackageJson()

const env = validateEnv({
  ...redisValidators,
  PORT: num({ default: 3000 }),
  LOG_SILENT: bool({ default: false }),
  CORS_ORIGIN: str(),
  RADARR_URL: str(),
  RADARR_KEY: str(),
  SC_URL: str(),
  DB_NAME: str(),
  DB_URL: str(),
  CRON_INTERVAL: num({ default: 3600 }),
  RADARR_CONFIG_REFRESH_INTERVAL: num({ default: 900000 }),
  PAGE_SIZE: num({ default: 500 }),
})

const instanceId = randomBytes(16).toString('hex')

export const settings = {
  instanceId,
  metadata: { app: name, version, port: env.PORT, env: env.APP_STAGE },
  logs: {
    silent: env.LOG_SILENT,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
  cron: {
    interval: env.CRON_INTERVAL * 1000,
  },
  radarr: {
    url: env.RADARR_URL,
    key: env.RADARR_KEY,
    refreshConfig: env.RADARR_CONFIG_REFRESH_INTERVAL,
  },
  senscritique: {
    url: env.SC_URL,
  },
  mongo: {
    dbName: env.DB_NAME,
    url: env.DB_URL,
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    keyPrefix: `${name}:`,
    cacheDuration: env.REDIS_CACHE_DURATION,
  },
  pagination: {
    pageSize: env.PAGE_SIZE,
  },
}

const messages = [
  'actors_fetch_config_failure',
  'connect_db',
  'directors_fetch_config_failure',
  'movies_fetch_config_failure',
  'movies_init_config',
  'flaresolverr_data',
  'format_movie',
  'get_last_cloudflare_date',
  'get_lyrics',
  'handle_cloudflare',
  'init_store',
  'no_stored_date',
  'polls_fetch_config_failure',
  'process_movie',
  'puppeteer_browser_disconnected',
  'puppeteer_create_page',
  'puppeteer_run_browser',
  'puppeteer_stop_browser',
  'radarr_fetch_config_failure',
  'radarr_init_config',
  'redis_init_store',
  'reset_stored_date',
  'scrappe',
  'sens_critique_parse',
  'sens_critique_process_movie',
  'sens_critique_scrappe',
  'set_last_cloudflare_date',
  'start_cron',
  'start_server',
  'tmdb_match',
] as const

export type Message = (typeof messages)[number]

const Query_setOptions = mongoose.Query.prototype.setOptions
mongoose.Query.prototype.setOptions = function (options: QueryOptions, overwrite?: boolean) {
  return Query_setOptions.call(this, { ...options, lean: true }, overwrite)
}
mongoose.set('strictQuery', true)
