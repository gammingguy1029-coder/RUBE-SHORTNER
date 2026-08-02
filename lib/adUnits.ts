/**
 * The ad units rendered on the unlock page.
 *
 * Single source of truth so lib/adblock.ts can probe exactly the domains that
 * have to work. When the probe and the units drifted apart, detection passed a
 * visitor whose ads could never load.
 */
export type AdUnitDef = {
  variant: "banner" | "native";
  adKey: string;
  scriptSrc: string;
  width: number;
  height: number;
};

/** Only one banner unit is permitted — atOptions is a single global. */
export const AD_UNITS: readonly AdUnitDef[] = [
  {
    variant: "native",
    adKey: "6e6cc333f8d31100c0f630699c8b02cc",
    scriptSrc:
      "https://pl30646646.effectivecpmnetwork.com/6e6cc333f8d31100c0f630699c8b02cc/invoke.js",
    width: 336,
    height: 280,
  },
  {
    variant: "banner",
    adKey: "b00444c5eda4e8aa8c625ec8d2c44342",
    scriptSrc:
      "https://www.highperformanceformat.com/b00444c5eda4e8aa8c625ec8d2c44342/invoke.js",
    width: 300,
    height: 250,
  },
];

export const AD_SCRIPT_URLS = AD_UNITS.map((u) => u.scriptSrc);
