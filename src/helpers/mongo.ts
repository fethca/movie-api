const defaultInOptions = { toNumber: false }

export function _is(name: string, value?: string | boolean) {
  return value && { [name]: value }
}

export function _in(name: string, value = '', options = defaultInOptions) {
  const values = formatIn(value, options)
  return values.length && { [name]: { $in: values } }
}

export function _nin(name: string, value = '', options = defaultInOptions) {
  const values = formatIn(value, options)
  return values.length && { [name]: { $nin: values } }
}

export function formatIn(value = '', options = defaultInOptions) {
  let values: string[] | number[] = value.split(',').filter(Boolean)
  if (options.toNumber) values = values.map((value) => Number(value))
  return values
}

export function _exists(name: string, value?: boolean) {
  return value !== undefined && { [name]: { $exists: value } }
}

export function _startsWith(name: string, value = '') {
  return value && { [name]: { $regex: new RegExp(`^${value}`) } }
}

export function _compare(name: string, value = '', order: 'gte' | 'lte' | 'gte,lte' = 'gte') {
  if (!value) return
  const operators = order.split(',')
  const values = value.split(',')
  const result = { [name]: {} }
  let index = 0
  for (const operator of operators) {
    const value = isNaN(Number(values[index])) ? values[index] : Number(values[index])
    result[name] = { ...result[name], [`$${operator}`]: value }
    index++
  }
  return result
}

export function formatSort(sortValue?: string, sortOrder?: 'asc' | 'desc') {
  return sortValue ? { [sortValue]: sortOrder || 'desc' } : {}
}

export function formatDates(dateRelease = '', order: 'gte' | 'lte' | 'gte,lte' = 'gte') {
  if (!dateRelease) return
  const dates = dateRelease.split(',')
  const formattedDates = dates.map((date, index) => {
    if (dates.length === 1 && order === 'gte') return `${date}-01-01`
    if (dates.length === 1 && order === 'lte') return `${date}-12-31`
    else return index === 0 ? `${date}-01-01` : `${date}-12-31`
  })
  return formattedDates.toString()
}
