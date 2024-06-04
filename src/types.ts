import { z } from 'zod'
import { settings } from './settings.js'

export const booleanSchema = z
  .string()
  .toLowerCase()
  .transform((x) => x === 'true')
  .pipe(z.boolean())
  .optional()

const { pagination } = settings

export const paginationSchema = z.object({
  pageIndex: z.string().default('0').transform(Number),
  pageSize: z.string().default(pagination.pageSize.toString()).transform(Number),
})
