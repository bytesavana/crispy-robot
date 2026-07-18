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
pnpm mtaapal android
pnpm mtaapal ios
```

Then press `i` (iOS simulator), `a` (Android emulator), or scan the QR code with Expo Go on a
physical device. The `didactic-invention` agent backend (sibling repo) must be running too — see
its README.

## Generate native projects

Run Expo prebuild from the repo root:

```sh
pnpm mtaapal exec expo prebuild
```

To regenerate native projects from scratch:

```sh
pnpm mtaapal exec expo prebuild --clean
```

## Run native builds

After prebuild creates the native `ios/` and `android/` projects, run:

```sh
pnpm mtaapal exec expo run:ios
pnpm mtaapal exec expo run:android
```

## Android SDK setup for native builds

`expo run:android` uses Gradle and requires the Android SDK to be discoverable outside Android Studio.
On macOS, if your SDK is installed at `~/Library/Android/sdk`, add this to your shell profile:

```sh
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
```

Then reload your shell and rerun the Android build from the repo root:

```sh
source ~/.zshrc
pnpm mtaapal exec expo run:android
```

**Physical device**: `http://localhost:8000` resolves to the phone itself, not your dev machine.
Copy `apps/mtaapal/.env.example` to `apps/mtaapal/.env` and point `EXPO_PUBLIC_AGENT_API_URL` /
`EXPO_PUBLIC_IDENTITY_SERVER_URL` at your machine's LAN IP (`ipconfig getifaddr en0` on macOS),
then restart `pnpm mtaapal start`.

## Typecheck and lint

```sh
pnpm mtaapal typecheck
pnpm mtaapal lint
```

## EAS

EAS builds run in the cloud by default; add `--local` to build on your own machine instead:

```sh
eas build --profile development --platform android --local
```

