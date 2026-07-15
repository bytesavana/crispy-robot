export type HistoryItem = {
  label: string;
  status: string;
};

export type HistoryEntry = {
  id: string;
  title: string;
  statusLine: string;
  userMessage: string;
  assistantIntro: string;
  items: HistoryItem[];
  runnerLine: string;
};

/**
 * No thread-listing endpoint exists on the backend yet — this is hardcoded
 * placeholder data matching the design mockups, standing in for a future
 * "list my requests" history API.
 */
export const mockHistory: HistoryEntry[] = [
  {
    id: "dry-cleaning-prescription",
    title: "Dry cleaning + Prescription",
    statusLine: "Delivered · Yesterday",
    userMessage:
      "Pick up my dry cleaning on Kimathi St and grab my prescription from Goodlife Pharmacy on the way home.",
    assistantIntro: "Got it — two stops for you today.",
    items: [
      { label: "Dry cleaning · Kimathi St", status: "Delivered" },
      { label: "Prescription · Goodlife Pharmacy", status: "Delivered" },
    ],
    runnerLine: "Runner: Amina · Delivered in 25 min",
  },
  {
    id: "grocery-pickup-naivas",
    title: "Grocery pickup · Naivas Kilimani",
    statusLine: "Delivered · Mon",
    userMessage: "Pick up my usual grocery order from Naivas Kilimani.",
    assistantIntro: "On it — one stop for you today.",
    items: [{ label: "Groceries · Naivas Kilimani", status: "Delivered" }],
    runnerLine: "Runner: Brian · Delivered in 40 min",
  },
  {
    id: "mama-fua-booking",
    title: "Mama fua booking",
    statusLine: "Completed · Last week",
    userMessage: "Book a mama fua for Saturday morning, same one as last time if she's free.",
    assistantIntro: "Booked — here's your appointment for Saturday.",
    items: [{ label: "Laundry service · Home visit", status: "Completed" }],
    runnerLine: "Runner: Faith · Completed on schedule",
  },
];
