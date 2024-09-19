import '../../test-helpers/trustarc-globals.js'

import {
  getNormalizedActiveGroupIds,
  getTrustArcActiveGroups,
  getNormalizedCategories,
  getTrustArcGlobal,
  getAllGroups,
} from '../trustarc-api'
import { domainDataMock, TrustArcMockGlobal } from '../../test-helpers/mocks'
import { TrustArcApiValidationError } from '../validation'

beforeEach(() => {
  // @ts-ignore
  delete window.TrustArcActiveGroups
  // @ts-ignore
  delete window.TrustArc
})

describe(getTrustArcGlobal, () => {
  it('should get the global', () => {
    ;(window as any).truste = TrustArcMockGlobal
    expect(getTrustArcGlobal()).toEqual(TrustArcMockGlobal)
  })

  it('should handle null or undefined', () => {
    ;(window as any).OneTrust = undefined
    expect(getTrustArcGlobal()).toBeUndefined()
    ;(window as any).OneTrust = null
    expect(getTrustArcGlobal()).toBeUndefined()
  })

  it('should log an error if the global is an unexpected type', () => {
    ;(window as any).TrustArc = {}
    expect(getTrustArcGlobal()).toBeUndefined()
  })
})

describe(getAllGroups, () => {
  it('works if TrustArc global is not available', () => {
    ;(window as any).TrustArc = undefined
    expect(getAllGroups()).toEqual([])
  })
  it('get the normalized groups', () => {
    ;(window as any).TrustArc = TrustArcMockGlobal
    window.TrustArc = {
      ...TrustArcMockGlobal,
      GetDomainData: () => ({
        ...domainDataMock,
        Groups: [
          {
            CustomGroupId: '1',
          },
          {
            CustomGroupId: '2',
          },
          {
            CustomGroupId: '3 ',
          },
          {
            CustomGroupId: '4  ',
          },
        ],
      }),
    }
    expect(getAllGroups()).toEqual([
      { groupId: '1' },
      { groupId: '2' },
      { groupId: '3' },
      { groupId: '4' },
    ])
  })
})

describe(getTrustArcActiveGroups, () => {
  it('should return the global string', () => {
    window.TrustarcActiveGroups = 'hello'
    expect(getTrustArcActiveGroups()).toBe('hello')
  })
  it('should return undefined if no groups are defined', () => {
    // @ts-ignore
    window.OnetrustActiveGroups = undefined
    expect(getTrustArcActiveGroups()).toBe(undefined)

    // @ts-ignore
    window.TrustarcActiveGroups = null
    expect(getTrustArcActiveGroups()).toBe(undefined)

    window.TrustarcActiveGroups = ''
    expect(getTrustArcActiveGroups()).toBe(undefined)
  })

  it('should throw an error if getTrustArcActiveGroups is invalid', () => {
    // @ts-ignore
    window.OnetrustActiveGroups = []
    expect(() => getTrustArcActiveGroups()).toThrow(TrustArcApiValidationError)
  })
})

describe(getNormalizedActiveGroupIds, () => {
  it('should normalize groupIds', () => {
    expect(getNormalizedActiveGroupIds(',1,')).toEqual(['1'])
    expect(getNormalizedActiveGroupIds('1,3')).toEqual(['1', '3'])
    expect(getNormalizedActiveGroupIds(',1,4')).toEqual(['1', '4'])
    expect(getNormalizedActiveGroupIds(',')).toEqual([])
    expect(getNormalizedActiveGroupIds('')).toEqual([])
    expect(getNormalizedActiveGroupIds(',,')).toEqual([])
  })

  it('should return an empty array if no groups are defined', () => {
    // @ts-ignore
    window.TrustArcActiveGroups = undefined
    expect(getNormalizedActiveGroupIds()).toEqual([])
  })
})

describe(getNormalizedCategories, () => {
  it('should set any groups that are not in active groups to false', () => {
    window.TrustarcActiveGroups = '1,2'
    window.TrustArc = {
      ...TrustArcMockGlobal,
      GetDomainData: () => ({
        ...domainDataMock,
        Groups: [
          {
            CustomGroupId: '1',
          },
          {
            CustomGroupId: '2',
          },
          {
            CustomGroupId: '3',
          },
        ],
      }),
    }
    const categories = getNormalizedCategories()
    expect(categories).toMatchInlineSnapshot(`
      {
        "1": true,
        "2": true,
        "3": false,
      }
    `)
  })

  it('should ignore any groups that are not in domain data', () => {
    window.TrustarcActiveGroups = '1,x'
    window.TrustArc = {
      ...TrustArcMockGlobal,
      GetDomainData: () => ({
        ...domainDataMock,
        Groups: [
          {
            CustomGroupId: '1',
          },
          {
            CustomGroupId: '2',
          },
          {
            CustomGroupId: '3',
          },
        ],
      }),
    }
    const categories = getNormalizedCategories()
    expect(categories).toMatchInlineSnapshot(`
      {
        "1": true,
        "2": false,
        "3": false,
      }
    `)
  })
  it('should accept an argument', () => {
    window.TrustArc = {
      ...TrustArcMockGlobal,
      GetDomainData: () => ({
        ...domainDataMock,
        Groups: [
          {
            CustomGroupId: '1',
          },
          {
            CustomGroupId: '2',
          },
          {
            CustomGroupId: '3',
          },
        ],
      }),
    }
    const categories = getNormalizedCategories(['1', '2'])
    expect(categories).toEqual({
      1: true,
      2: true,
      3: false,
    })
  })
})
