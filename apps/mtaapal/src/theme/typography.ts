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
} as const;
