import { Logger } from '@fethcat/logger'
import { connect } from '@fethcat/shared/mongo'
import cors from 'cors'
import express, { json, urlencoded } from 'express'
import helmet from 'helmet'
import { Server } from 'http'
import { limiter } from './middlewares/limiter.js'
import { logger } from './middlewares/logger.js'
import { router } from './router.js'
import { actorList, directorList, movieList, pollList, radarr } from './services.js'
import { Message, settings } from './settings.js'

const { instanceId, logs, metadata } = settings
export class App {
  logger = Logger.create<Message>(instanceId, logs, metadata)

  constructor() {}

  async run(dbUri: string): Promise<void> {
    const { success, failure } = this.logger.action('app_start')
    try {
      await this.initRadarrConfig()
      await this.initDb(dbUri)
      await this.initMoviesConfigs()
      const server = await this.startServer()
      process.on('SIGTERM', this.exit.bind(this, server))
      success()
    } catch (error) {
      failure(error)
      process.exit(1)
    }
  }

  private async initDb(dbUri: string) {
    const { success, failure } = this.logger.action('connect_db')
    try {
      await connect(dbUri, { dbName: settings.mongo.dbName })
      success()
    } catch (error) {
      failure(error)
      throw error
    }
  }

  private async initRadarrConfig() {
    radarr.on('fetch-error', (error) => {
      this.logger.error('radarr_fetch_config_failure', { error })
    })
    const { success, failure } = this.logger.action('radarr_init_config')
    try {
      const config = await radarr.getConfig()
      success({ config })
    } catch (error) {
      throw failure(error)
    }
  }

  private async initMoviesConfigs() {
    movieList.on('fetch-error', (error) => {
      this.logger.error('movies_fetch_config_failure', { error })
    })
    actorList.on('fetch-error', (error) => {
      this.logger.error('directors_fetch_config_failure', { error })
    })
    directorList.on('fetch-error', (error) => {
      this.logger.error('directors_fetch_config_failure', { error })
    })
    pollList.on('fetch-error', (error) => {
      this.logger.error('directors_fetch_config_failure', { error })
    })
    const { success, failure } = this.logger.action('movies_init_config')
    try {
      await movieList.getConfig()
      await actorList.getConfig()
      await directorList.getConfig()
      await pollList.getConfig()
      success()
    } catch (error) {
      throw failure(error)
    }
  }

  private async startServer() {
    const { success, failure } = this.logger.action('start_server')
    try {
      const app = express()
      app.use(helmet())
      app.use(limiter)
      app.use(json())
      app.use(urlencoded({ extended: true }))
      app.use(cors({ origin: settings.cors.origin }))
      app.use(logger)
      app.use('/api', router())
      const server = app.listen(metadata.port)
      await new Promise<void>((resolve) => server.on('listening', resolve))
      success()
      return server
    } catch (error) {
      throw failure(error)
    }
  }

  private async exit(server: Server) {
    await new Promise((resolve) => {
      server.on('close', resolve)
      server.close()
    })
    this.logger.info('app_stop')
  }
}
