/**
 * This is the public API for this package.
 * We avoid using splat (*) exports so that we can control what is exposed.
 */
export { withTrustArc } from './domain/wrapper'
export type { TrustArcSettings } from './domain/wrapper'
