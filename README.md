# crispy-robot

MtaaPal client apps — a pnpm workspace. Currently one app: `apps/mobile`, the MtaaPal React
Native/Expo chat client. Design mockups and the original brief live in `Todos/`.

## Architecture

`apps/mobile` is a chat UI (onboarding → location permission → home chat → drawer history →
thread detail) that talks to the `didactic-invention` agent backend over the **AG-UI protocol**.

There is no official React Native client for AG-UI yet, and this app deliberately doesn't depend
on assistant-ui (its React Native package pulls in a broken `assistant-cloud` import). Instead:

- `@ag-ui/client`'s `HttpAgent` handles the wire protocol directly (POSTs `RunAgentInput`, parses
  the SSE event stream, keeps the running message list).
- `apps/mobile/src/lib/useMtaaPalChat.ts` is a small hook that drives one `HttpAgent` thread —
  sends messages, subscribes to streamed text/error events, and exposes plain `{id, role, text}`
  messages to the UI.
- Chat UI (`HomeChatScreen`, `ChatMessages`) is plain React Native (`FlatList`, `TextInput`,
  `Pressable`) rendering those messages — no chat-framework layer in between.

Auth doesn't exist yet on the backend (`X-Customer-Id`/`X-Zone-Name` headers are a documented
placeholder there), so this app hardcodes them — see `apps/mobile/src/lib/identity.ts`.

## Prerequisites

- Node.js, pnpm (`corepack enable` or `npm i -g pnpm`)
- The `didactic-invention` backend running locally (sibling repo) — see its README. Note that full
  booking conversations also need the separate `effective-happiness` .NET backend; without it,
  simple Q&A still works but booking actions will error (the app surfaces this as an inline error
  message rather than crashing).

## Setup

```sh
pnpm install
```

## Running

```sh
# Terminal 1 — backend
cd ../didactic-invention
uv run dev

# Terminal 2 — app
cd apps/mobile
pnpm start
```

Then press `i` (iOS simulator), `a` (Android emulator), or scan the QR code with Expo Go on a
physical device.

**Physical device gotcha**: `http://localhost:8000` resolves to the phone itself, not your dev
machine. Copy `apps/mobile/.env.example` to `apps/mobile/.env` and set:

```
EXPO_PUBLIC_AGENT_API_URL=http://<your-machine-lan-ip>:8000
```

Find your LAN IP on macOS with `ipconfig getifaddr en0`. Restart `pnpm start` after changing it.

## Verifying it works

1. Confirm the backend is up: `curl localhost:8000/healthz` → `{"status":"ok"}`.
2. Walk through onboarding → location permission → home screen.
3. Tap a quick-action suggestion card (or type your own message, e.g. "What errands can I get
   done in my area?") and confirm the reply streams in incrementally.
4. Booking an actual errand will error without `effective-happiness` running — that's expected;
   confirm it shows a readable inline error rather than crashing or hanging.
5. Open the drawer (hamburger icon or swipe from the left edge) and confirm the mock history list
   renders; tap an entry to see the static thread detail view.

## Project layout

```
apps/mobile/
  app.config.ts          # Expo config; reads EXPO_PUBLIC_AGENT_API_URL
  src/
    app/                  # expo-router routes (onboarding, location-permission, (drawer)/*)
    screens/              # screen-level components
    components/           # shared UI (buttons, bubbles, badges, chat message renderers)
    lib/                  # AG-UI bridge, identity, session, mock history
    theme/                 # colors, typography, spacing tokens
```

`packages/*` can be added later (e.g. for a web client) without restructuring — not needed yet
for a single app.
