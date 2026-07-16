# crispy-robot

MtaaPal client apps — a pnpm workspace. Currently one app: `apps/mtaapal`, the MtaaPal React
Native/Expo chat client.

Everything below is run from the repo root using pnpm — either directly via `--filter mtaapal`,
or the shorthand `pnpm mtaapal <command>` (defined in the root `package.json`), which is
equivalent.

## Install dependencies

```sh
pnpm install
```

## Add a package

```sh
pnpm mtaapal add <package>
```

For Expo SDK-aligned native packages (keeps versions compatible with the installed Expo SDK):

```sh
pnpm mtaapal exec expo install <package>
```

## Run the app

```sh
pnpm mtaapal start
```

Then press `i` (iOS simulator), `a` (Android emulator), or scan the QR code with Expo Go on a
physical device. The `didactic-invention` agent backend (sibling repo) must be running too — see
its README.

**Physical device**: `http://localhost:8000` resolves to the phone itself, not your dev machine.
Copy `apps/mtaapal/.env.example` to `apps/mtaapal/.env` and point `EXPO_PUBLIC_AGENT_API_URL` /
`EXPO_PUBLIC_IDENTITY_SERVER_URL` at your machine's LAN IP (`ipconfig getifaddr en0` on macOS),
then restart `pnpm mtaapal start`.

## Typecheck and lint

```sh
pnpm mtaapal typecheck
pnpm mtaapal lint
```
