import { tmdbSchemaFormat } from '@fethcat/shared/types'
import { Request, Response } from 'express'
import { z } from 'zod'
import { radarr } from '../services.js'

const schema = { getTMDB: z.object({ search: z.string() }) }

export async function getTMDB(req: Request, res: Response) {
  const { success, failure } = req.logger.action('get_TMDB')
  try {
    const { search } = schema.getTMDB.parse(req.query)
    if (!search) res.sendStatus(404)
    const data = await radarr.tmdbLookup(search)
    const tmdb = z.array(tmdbSchemaFormat).parse(data)
    res.json({ tmdb })
    success()
  } catch (error) {
    res.status(500).send(failure(error).message)
  }
}
