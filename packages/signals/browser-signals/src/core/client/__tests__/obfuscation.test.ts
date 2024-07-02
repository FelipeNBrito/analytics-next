import { obfuscateJsonValues } from '../obfuscation'

describe('obfuscateJsonValues', () => {
  it('should obfuscate string values in an object', () => {
    const obj = { name: 'John Doe', age: '30' }
    const expected = { name: 'XXXXX', age: 'XXXXX' }
    expect(obfuscateJsonValues(obj)).toEqual(expected)
  })

  it('should obfuscate string values in a nested object', () => {
    const obj = { user: { name: 'Jane Doe', age: '25' }, active: true }
    const expected = {
      user: { name: 'XXXXX', age: 'XXXXX' },
      active: false,
    }
    expect(obfuscateJsonValues(obj, 1)).toEqual(expected)
  })

  it('should obfuscate string values in an array', () => {
    const arr = ['John Doe', '30']
    const expected = ['XXXXX', 'XXXXX']
    expect(obfuscateJsonValues(arr)).toEqual(expected)
  })

  it('should handle mixed types in an array', () => {
    const arr = ['Jane Doe', 25, { email: 'jane@example.com' }]
    const expected = ['XXXXX', 999, { email: 'XXXXX' }]
    expect(obfuscateJsonValues(arr, 1)).toEqual(expected)
  })

  it('should not obfuscate if depth is not reached', () => {
    const obj = { a: 'A', l2: { b: 'B', l3: { c: 'C', l4: { d: 'D' } } } }
    const expected = {
      a: 'A',
      l2: { b: 'B', l3: { c: 'XXXXX', l4: { d: 'XXXXX' } } },
    }
    expect(obfuscateJsonValues(obj, 3)).toEqual(expected)
  })

  it('should obfuscate null and undefined values correctly', () => {
    const obj = {
      key1: null,
      key2: undefined,
      key3: false,
      key4: 0,
      key5: '',
    }
    const expected = {
      key1: null,
      key2: null, // Note: undefined values are also obfuscated to '__null'
      key3: false,
      key4: 999,
      key5: 'XXXXX',
    }
    expect(obfuscateJsonValues(obj)).toEqual(expected)
  })
})
