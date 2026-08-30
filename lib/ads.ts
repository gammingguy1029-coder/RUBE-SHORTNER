/**
 * DEPRECATED — All ads now served from main domain via lib/adUnits.ts + AdUnit.tsx.
 * Previous separate-origin iframe approach (ADS_ORIGIN) is removed. All units
 * are approved for the main domain, so no second deployment is needed.
 * Kept only so legacy AdFrame still type-checks; new code should not import this.
 */
export const ADS_ORIGIN = "";

export function adUrl(file: string): string {
  return `/ads/${file}`;
}
