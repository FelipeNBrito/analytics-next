import {
  createInstrumentationSignal,
  createInteractionSignal,
  createNetworkSignal,
} from '../../../types'
import { redactJsonValues, redactSignalData } from '../redact'

describe(redactJsonValues, () => {
  it('should redact string values in an object', () => {
    const obj = { name: 'John Doe', age: '30' }
    const expected = { name: 'XXX', age: 'XXX' }
    expect(redactJsonValues(obj)).toEqual(expected)
  })

  it('should redact string values in a nested object', () => {
    const obj = { user: { name: 'Jane Doe', age: '25' }, active: true }
    const expected = {
      user: { name: 'XXX', age: 'XXX' },
      active: true,
    }
    expect(redactJsonValues(obj, 1)).toEqual(expected)
  })
  it('should not redact null or undefined values', () => {
    const obj = { name: 'John Doe', age: null, email: undefined }
    const expected = { name: 'XXX', age: null, email: undefined }
    expect(redactJsonValues(obj)).toEqual(expected)
  })

  it('should redact bigint values', () => {
    const obj = { name: 'John Doe', age: BigInt(30) }
    const expected = { name: 'XXX', age: 999 }
    expect(redactJsonValues(obj)).toEqual(expected)
  })

  it('should redact boolean values by setting them to true', () => {
    const obj = { name: 'John Doe', active: false }
    const expected = { name: 'XXX', active: true }
    expect(redactJsonValues(obj)).toEqual(expected)
  })

  it('should redact string values in an array', () => {
    const arr = ['John Doe', '30']
    const expected = ['XXX', 'XXX']
    expect(redactJsonValues(arr)).toEqual(expected)
  })

  it('should handle mixed types in an array', () => {
    const arr = ['Jane Doe', 25, { email: 'jane@example.com' }]
    const expected = ['XXX', 999, { email: 'XXX' }]
    expect(redactJsonValues(arr, 1)).toEqual(expected)
  })

  it('should not redact if depth is not reached', () => {
    const obj = { a: 'A', l2: { b: 'B', l3: { c: 'C', l4: { d: 'D' } } } }
    const expected = {
      a: 'A',
      l2: { b: 'B', l3: { c: 'XXX', l4: { d: 'XXX' } } },
    }
    expect(redactJsonValues(obj, 3)).toEqual(expected)
  })
})

describe(redactSignalData, () => {
  it('should return the signal as is if the type is "instrumentation"', () => {
    const signal = createInstrumentationSignal({
      foo: 123,
    } as any)
    expect(redactSignalData(signal)).toEqual(signal)
  })

  it('should return the signal as is if the type is "userDefined"', () => {
    const signal = { type: 'userDefined', data: { value: 'secret' } } as const
    expect(redactSignalData(signal)).toEqual(signal)
  })

  it('should redact the value in the "target" property if the type is "interaction"', () => {
    const signal = createInteractionSignal({
      eventType: 'change',
      target: { value: 'secret' },
    })
    const expected = createInteractionSignal({
      eventType: 'change',
      target: { value: 'XXX' },
    })
    expect(redactSignalData(signal)).toEqual(expected)
  })

  it('should redact the values in the "data" property if the type is "network"', () => {
    const signal = createNetworkSignal({
      action: 'Request',
      method: 'post',
      url: 'http://foo.com',
      data: { name: 'John Doe', age: 30 },
    })
    const expected = createNetworkSignal({
      ...signal.data,
      data: { name: 'XXX', age: 999 },
    })
    expect(redactSignalData(signal)).toEqual(expected)
  })
})
