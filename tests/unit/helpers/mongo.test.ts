import { formatSort, toMinutes } from '../../../src/helpers/mongo.js'

describe('formatSort', () => {
  it('should sort by the given value then by _id to break ties', () => {
    const sort = formatSort('tmdb.popularity', 'asc')
    expect(sort).toEqual({ 'tmdb.popularity': 'asc', _id: 'asc' })
    expect(Object.keys(sort)).toEqual(['tmdb.popularity', '_id'])
  })

  it('should sort by _id only when _id is the sort value', () => {
    expect(formatSort('_id', 'desc')).toEqual({ _id: 'desc' })
  })
})

describe('toMinutes', () => {
  it('should convert each second value to minutes', () => {
    expect(toMinutes('3600,5430')).toBe('60,91')
  })

  it('should return nothing without values', () => {
    expect(toMinutes()).toBeUndefined()
  })
})
