/**
 * Same palette as apps/mtaapal — MtaaHub is "MtaaPal for Business", a sibling surface for the same
 * brand, not a separate product with its own look. A shop owner and a customer should recognise the
 * same warm cream-and-terracotta world in both apps.
 *
 * `actionBlue` is the one addition: mtaapal's `accentBlue` is a pale pill background, not a button
 * colour, and this app needs a saturated one for in-job actions (accept a job you're already
 * looking at, start it, mark a step done) — kept distinct from `primary` (terracotta), which is
 * reserved for the business/growth-flavoured actions: onboarding, submitting for verification,
 * withdrawing earnings.
 */
export const colors = {
  background: "#FBF1E7",
  backgroundAlt: "#F7E9DC",
  surface: "#FFFFFF",
  primary: "#C1602C",
  primaryDark: "#A54F22",
  primaryLight: "#D2703A",
  accentBlue: "#BFE0F2",
  accentPeach: "#F6D3C1",
  accentGreen: "#C9E4C5",
  accentAmber: "#F4DFB0",
  text: "#2B2320",
  textMuted: "#8A7A6F",
  textOnPrimary: "#FFFFFF",
  border: "#EAD9C8",
  success: "#3F7D4F",
  danger: "#B3261E",
  dangerBackground: "#FBEAE8",
  warning: "#8A5A00",
  // Saturated steel blue for in-job actions — Accept/Start/Mark-arrived — as distinct from the pale
  // accentBlue pill background above.
  actionBlue: "#3E7CA6",
  actionBlueDark: "#2F5F80",
} as const;

/**
 * The job lifecycle, given colour. Four stages a job actually moves through — waiting on the
 * platform/customer, waiting on you, under way, done — plus a failure state. Matches the pill
 * badges in the Calendar and job-detail views; `plain` variants (no background) back the Earnings
 * list, which shows status as bold coloured text rather than a pill.
 */
export const statusTones = {
  new: { background: colors.accentAmber, text: colors.warning },
  confirmed: { background: colors.accentBlue, text: colors.actionBlueDark },
  inProgress: { background: colors.accentPeach, text: colors.primaryDark },
  completed: { background: colors.accentGreen, text: colors.success },
  failed: { background: colors.dangerBackground, text: colors.danger },
  neutral: { background: colors.backgroundAlt, text: colors.textMuted },
} as const;

export type StatusTone = keyof typeof statusTones;
