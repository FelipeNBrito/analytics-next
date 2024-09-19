import {
  TrustArcDomainData,
  TrustArcGlobal,
  TaConsentModel,
} from '../lib/trustarc-api'
import type { AnyAnalytics } from '@segment/analytics-consent-tools'
/**
 * This can be used to mock the TrustArc global object in individual tests
 * @example
 * ```ts
 * import * as TrustArcApi from '../trustarc-api'
 * jest.spyOn(TrustArcApi, 'getTrustArcGlobal').mockImplementation(() => TrustArcMockGlobal)
 * ````
 */

export const analyticsMock: jest.Mocked<AnyAnalytics> = {
  page: jest.fn(),
  addSourceMiddleware: jest.fn(),
  addDestinationMiddleware: jest.fn(),
  load: jest.fn(),
  track: jest.fn(),
}

export const domainGroupMock = {
  StrictlyNeccessary: {
    CustomGroupId: '1',
  },
  Targeting: {
    CustomGroupId: '2',
  },
  Performance: {
    CustomGroupId: '3',
  },
}

export const domainDataMock: jest.Mocked<TrustArcDomainData> = {
  Groups: [domainGroupMock.StrictlyNeccessary],
  ConsentModel: {
    Name: TaConsentModel.optIn,
  },
  ShowAlertNotice: true,
}

export const TrustArcMockGlobal: jest.Mocked<TrustArcGlobal> = {
  GetDomainData: jest.fn().mockReturnValue(domainDataMock),
  IsAlertBoxClosed: jest.fn(),
  OnConsentChanged: jest.fn(),
  eu: null,
  cma: null,
}
