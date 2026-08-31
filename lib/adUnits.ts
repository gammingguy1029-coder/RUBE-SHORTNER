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

/** Only one banner unit is permitted per page — atOptions is a single global. */
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
  {
    // Second banner supplied by user — same shape as the one above; both render
    // in their own iframe srcdoc so the global atOptions race no longer fires.
    variant: "banner",
    adKey: "6e855ffe8642d5f59d1f63f665190696",
    scriptSrc:
      "https://www.highrevenueformat.com/6e855ffe8642d5f59d1f63f665190696/invoke.js",
    width: 300,
    height: 250,
  },
];

export const SOCIAL_BAR = {
  adKey: "8fc0e0bbeec98414982958c8a7105a2e",
  scriptSrc:
    "https://pl30636549.profitableratecpmnetwork.com/8f/c0/e0/8fc0e0bbeec98414982958c8a7105a2e.js",
} as const;

export const POPUNDER = {
  adKey: "48b51a54c3811b46f8096507a03d3efb",
  scriptSrc:
    "https://pl30636546.profitableratecpmnetwork.com/48/b5/1a/48b51a54c3811b46f8096507a03d3efb.js",
} as const;

export const AD_SCRIPT_URLS = [
  ...AD_UNITS.map((u) => u.scriptSrc),
  SOCIAL_BAR.scriptSrc,
  POPUNDER.scriptSrc,
];
