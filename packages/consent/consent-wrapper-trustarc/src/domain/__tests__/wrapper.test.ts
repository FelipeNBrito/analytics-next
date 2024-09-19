import * as ConsentTools from '@segment/analytics-consent-tools'
import * as TrustArcAPI from '../../lib/trustarc-api'
import { sleep } from '@internal/test-helpers'
import { withTrustArc } from '../wrapper'

import {
  TrustArcMockGlobal,
  analyticsMock,
  domainDataMock,
  domainGroupMock,
} from '../../test-helpers/mocks'

const getNormalizedActiveGroupIds = jest.spyOn(
  TrustArcAPI,
  'getNormalizedActiveGroupIds'
)

const createWrapperSpyHelper = {
  _spy: jest.spyOn(ConsentTools, 'createWrapper'),
  get shouldLoadWrapper() {
    return createWrapperSpyHelper._spy.mock.lastCall![0].shouldLoadWrapper!
  },
  get shouldLoadSegment() {
    return createWrapperSpyHelper._spy.mock.lastCall![0].shouldLoadSegment!
  },
  get getCategories() {
    return createWrapperSpyHelper._spy.mock.lastCall![0].getCategories!
  },
  get registerOnConsentChanged() {
    return createWrapperSpyHelper._spy.mock.lastCall![0]
      .registerOnConsentChanged!
  },
}

jest
  .spyOn(TrustArcAPI, 'getTrustArcGlobal')
  .mockImplementation(() => TrustArcMockGlobal)

/**
 * These tests are not meant to be comprehensive, but they should cover the most important cases.
 * We should prefer unit tests for most functionality (see lib/__tests__)
 */
describe('High level "integration" tests', () => {
  let checkResolveWhen = () => {}
  beforeEach(() => {
    /**
     * Typically, resolveWhen triggers when a predicate is true. We can manually 'check' so we don't have to use timeouts.
     */
    jest.spyOn(ConsentTools, 'resolveWhen').mockImplementation(async (fn) => {
      return new Promise((_resolve, _reject) => {
        checkResolveWhen = () => {
          fn() ? _resolve() : _reject('predicate failed.')
        }
      })
    })
  })

  describe('shouldLoadSegment', () => {
    describe('consent model', () => {
      it('should support opt-in', async () => {
        withTrustArc(analyticsMock)

        getNormalizedActiveGroupIds.mockImplementation(() => [
          domainGroupMock.StrictlyNeccessary.CustomGroupId,
        ])

        TrustArcMockGlobal.GetDomainData.mockReturnValue({
          ...domainDataMock,
          ConsentModel: {
            Name: TrustArcAPI.TaConsentModel.optIn,
          },
        })
        TrustArcMockGlobal.IsAlertBoxClosed.mockReturnValueOnce(true)

        const load = jest.fn()
        const shouldLoadSegP = createWrapperSpyHelper.shouldLoadSegment({
          load,
        } as any)
        checkResolveWhen()
        await shouldLoadSegP
        expect(load).toHaveBeenCalledWith({ consentModel: 'opt-in' })
      })

      it('should not wait for alert box to be closed if opt-out', async () => {
        withTrustArc(analyticsMock)

        TrustArcMockGlobal.IsAlertBoxClosed.mockReturnValue(false)

        TrustArcMockGlobal.GetDomainData.mockReturnValue({
          ...domainDataMock,
          ConsentModel: {
            Name: TrustArcAPI.TaConsentModel.optOut,
          },
        })
        const load = jest.fn()
        void createWrapperSpyHelper.shouldLoadSegment({
          load,
        } as any)
        expect(load).toHaveBeenCalledWith({ consentModel: 'opt-out' })
      })

      it('should default to opt-out consent model if OneTrust.ConsentModel.Name is unrecognized', async () => {
        withTrustArc(analyticsMock)

        TrustArcMockGlobal.GetDomainData.mockReturnValue({
          ...domainDataMock,
          ConsentModel: {
            Name: 'foo' as any,
          },
        })
        TrustArcMockGlobal.IsAlertBoxClosed.mockReturnValueOnce(true)

        const load = jest.fn()
        void createWrapperSpyHelper.shouldLoadSegment({
          load,
        } as any)
        expect(load).toHaveBeenCalledWith({ consentModel: 'opt-out' })
      })
      it('should support a configuration that overrides the consent model', async () => {
        withTrustArc(analyticsMock, { consentModel: () => 'opt-in' })
        TrustArcMockGlobal.GetDomainData.mockReturnValue({
          ...domainDataMock,
          ConsentModel: {
            Name: TrustArcAPI.TaConsentModel.optOut,
          },
        })
        TrustArcMockGlobal.IsAlertBoxClosed.mockReturnValueOnce(true)
        getNormalizedActiveGroupIds.mockImplementation(() => [
          domainGroupMock.StrictlyNeccessary.CustomGroupId,
        ])
        const load = jest.fn()
        const shouldLoadSegP = createWrapperSpyHelper.shouldLoadSegment({
          load,
        } as any)
        checkResolveWhen()
        await shouldLoadSegP
        expect(load).toHaveBeenCalledWith({ consentModel: 'opt-in' })
      })
    })

    it('should load if alert box is closed and groups are defined', async () => {
      withTrustArc(analyticsMock)

      TrustArcMockGlobal.GetDomainData.mockReturnValue(domainDataMock)
      TrustArcMockGlobal.IsAlertBoxClosed.mockReturnValueOnce(true)
      getNormalizedActiveGroupIds.mockImplementation(() => [
        domainGroupMock.StrictlyNeccessary.CustomGroupId,
      ])
      const shouldLoadSegment = Promise.resolve(
        createWrapperSpyHelper.shouldLoadSegment({
          load: jest.fn(),
        } as any)
      )
      checkResolveWhen()
      await expect(shouldLoadSegment).resolves.toBeUndefined()
    })

    it('should not load at all if no groups are defined', async () => {
      withTrustArc(analyticsMock)
      getNormalizedActiveGroupIds.mockImplementation(() => [])
      const shouldLoadSegment = Promise.resolve(
        createWrapperSpyHelper.shouldLoadSegment({} as any)
      )
      void shouldLoadSegment.catch(() => {})
      TrustArcMockGlobal.IsAlertBoxClosed.mockReturnValueOnce(true)
      checkResolveWhen()
      await expect(shouldLoadSegment).rejects.toEqual(expect.anything())
    })

    it("should load regardless of AlertBox status if showAlertNotice is true (e.g. 'show banner is unchecked')", async () => {
      withTrustArc(analyticsMock)
      TrustArcMockGlobal.GetDomainData.mockReturnValue({
        ...domainDataMock,
        ShowAlertNotice: false, // meaning, it's open
      })
      getNormalizedActiveGroupIds.mockImplementation(() => [
        domainGroupMock.StrictlyNeccessary.CustomGroupId,
      ])
      const shouldLoadSegment = Promise.resolve(
        createWrapperSpyHelper.shouldLoadSegment({
          load: jest.fn(),
        } as any)
      )
      TrustArcMockGlobal.IsAlertBoxClosed.mockReturnValueOnce(false) // alert box is _never open
      checkResolveWhen()
      await expect(shouldLoadSegment).resolves.toBeUndefined()
    })
  })

  describe('getCategories', () => {
    it('should get categories successfully', async () => {
      withTrustArc(analyticsMock)
      TrustArcMockGlobal.GetDomainData.mockReturnValue({
        ...domainDataMock,
        Groups: [
          domainGroupMock.StrictlyNeccessary,
          domainGroupMock.Performance,
          domainGroupMock.Targeting,
        ],
      })
      getNormalizedActiveGroupIds.mockImplementation(() => [
        domainGroupMock.StrictlyNeccessary.CustomGroupId,
      ])
      const categories = createWrapperSpyHelper.getCategories()
      // contain both consented and denied category
      expect(categories).toEqual({
        1: true,
        2: false,
        3: false,
      })
    })
  })

  describe('Consent changed', () => {
    it('should enable consent changed by default', async () => {
      withTrustArc(analyticsMock)
      TrustArcMockGlobal.GetDomainData.mockReturnValue({
        ...domainDataMock,
        Groups: [
          domainGroupMock.StrictlyNeccessary,
          domainGroupMock.Performance,
          domainGroupMock.Targeting,
        ],
      })
      const onCategoriesChangedCb = jest.fn()

      void createWrapperSpyHelper.shouldLoadWrapper()
      createWrapperSpyHelper.registerOnConsentChanged(onCategoriesChangedCb)
      onCategoriesChangedCb()

      checkResolveWhen() // wait for OneTrust global to be available
      await sleep(0)

      analyticsMock.track.mockImplementationOnce(() => {}) // ignore track event sent by consent changed

      const onConsentChangedArg =
        TrustArcMockGlobal.OnConsentChanged.mock.lastCall![0]
      onConsentChangedArg(
        new CustomEvent('', {
          detail: [
            domainGroupMock.StrictlyNeccessary.CustomGroupId,
            domainGroupMock.Performance.CustomGroupId,
          ],
        })
      )

      // expect to be normalized!
      expect(onCategoriesChangedCb.mock.lastCall[0]).toEqual({
        [domainGroupMock.StrictlyNeccessary.CustomGroupId]: true,
        [domainGroupMock.Performance.CustomGroupId]: true,
        [domainGroupMock.Targeting.CustomGroupId]: false,
      })
    })
  })
})
