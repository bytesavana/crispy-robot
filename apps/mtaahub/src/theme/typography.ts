import type { TextStyle } from "react-native";

// Same type family as apps/mtaapal: Playfair Display for headings, system sans for everything else.
export const fontFamilies = {
  serif: "PlayfairDisplay_600SemiBold",
  serifRegular: "PlayfairDisplay_400Regular",
  sans: "System",
} as const;

export const typography = {
  heading: {
    fontFamily: fontFamilies.serif,
    fontSize: 26,
    lineHeight: 32,
  },
  headingLarge: {
    fontFamily: fontFamilies.serif,
    fontSize: 32,
    lineHeight: 40,
  },
  title: {
    fontFamily: fontFamilies.sans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: 15,
    lineHeight: 21,
  },
  bodySmall: {
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  /** Prices and countdowns — tabular so a list of amounts lines up and a ticking clock doesn't jitter.
   * fontVariant is annotated rather than left to `as const`, which would infer a readonly tuple that
   * RN's TextStyle won't take. */
  numeric: {
    fontFamily: fontFamilies.sans,
    fontSize: 15,
    lineHeight: 21,
    fontVariant: ["tabular-nums"] as TextStyle["fontVariant"],
  },
} as const;
