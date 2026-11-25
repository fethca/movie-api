import { formatSort } from '../../../src/helpers/mongo.js'

describe('formatSort', () => {
  it('should add _id as a tie-breaker after the sort value', () => {
    const sort = formatSort('tmdb.popularity', 'asc')
    expect(sort).toEqual({ 'tmdb.popularity': 'asc', _id: 'asc' })
    expect(Object.keys(sort)).toEqual(['tmdb.popularity', '_id'])
  })

  it('should default to desc order on both keys', () => {
    expect(formatSort('senscritique.rating')).toEqual({ 'senscritique.rating': 'desc', _id: 'desc' })
  })

  it('should not duplicate _id when sorting by _id', () => {
    expect(formatSort('_id', 'asc')).toEqual({ _id: 'asc' })
  })

  it('should still sort by _id when no sort value is given', () => {
    expect(formatSort()).toEqual({ _id: 'desc' })
  })
})
