import { TrustArcGlobal } from '../lib/trustarc-api'
/**
 * ALERT: It's OK to declare ambient globals in test code, but __not__ in library code
 * This file should not be included in the final package
 */
export declare global {
  interface Window {
    TrustArc: TrustArcGlobal
    TrustarcActiveGroups: string
  }
}
