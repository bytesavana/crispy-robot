# crispy-robot

MtaaPal client apps — a pnpm workspace. Three apps:

| App | What it is | Who uses it |
|---|---|---|
| `apps/mtaapal` | React Native/Expo chat client | customers |
| `apps/mtaahub` | React Native/Expo fulfillment client | shops and runners |
| `apps/admin` | Vite ops web console | the MtaaPal team |

Everything below is run from the repo root using pnpm — either directly via `--filter mtaapal` /
`--filter mtaahub` / `--filter admin`, or the shorthand `pnpm mtaapal <command>` /
`pnpm mtaahub <command>` / `pnpm admin <command>` (defined in the root `package.json`), which is
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

## MtaaHub app — "MtaaPal for Business"

`apps/mtaahub` is the other side of a MtaaPal order: the shop or independent runner who takes on a
job. One Expo app, one shared Calendar / Earnings / Profile experience for both — a provider's
`businessType` ("Shop or Vendor" vs "Independent Runner") only changes labels and copy, never
navigation, since both are self-fulfilling providers under the hood (ProviderRegistry's
`ProviderKind.Vendor`, `FulfillmentType.VendorFulfilled`).

```sh
pnpm mtaahub start
pnpm mtaahub android
pnpm mtaahub ios
```

It talks to three `effective-happiness` services directly (no agent in the loop):
ServiceRequestOrchestrator for jobs and offers, ProviderRegistry for sign-in, coverage and
availability, and ServiceCatalog for category names, plus IdentityServer for the OTP. Copy
`apps/mtaahub/.env.example` to `apps/mtaahub/.env` to point them somewhere other than the default
local ports.

**Onboarding is self-service once the phone number has an account.** Signing in needs an
IdentityServer account for the number — that part is still ops-provisioned, since nothing creates
one for a non-customer yet (`/account/activate` cascades into creating a Consumer) — but from there,
a number with no `Provider` record lands in an in-app onboarding flow (role picker → business info)
that calls `POST /providers` directly, landing as `VerificationStatus.Pending` until ops verifies it.
Only a wholly unknown phone number gets the "ask ops to set you up" dead end.

**Physical device**: same caveat as MtaaPal, plus one more. `ServiceRequestOrchestrator` and
`ProviderRegistry` bind to `localhost` in their `launchSettings.json` — unlike IdentityServer, which
already binds `0.0.0.0` — so a phone on the LAN can't reach them until those are changed too.

### Demo data

To walk the app with no backend running, set `EXPO_PUBLIC_DEMO_DATA=1` in `apps/mtaahub/.env`.
Offers, the calendar, earnings and job detail then come from in-memory fixtures (`src/lib/demo/`)
instead of the backend, and no fulfillment or provider-registry request touches the network at all.

It's a real little state machine rather than static lists — accepting an offer moves a job onto the
calendar as confirmed, starting a job and working through its stops narrates real task updates, and
reporting a price runs the same tolerance rule the backend uses (5% or KES 50, whichever is kinder),
so a big enough difference escalates to "waiting on customer". Every screen shows a **Demo data**
banner while it's on, and the Profile tab grows a "switch to shop view" toggle so one account can
see both roles, plus a "reset demo data" button.

Sign-in still uses the real IdentityServer — demo mode stubs the fulfillment and provider-registry
sides only. Delete the line, or set it to `0`, to go back to live data.

**Offers are polled, not pushed.** The offers list and calendar refresh every 15–20s while focused. A
job offer expires on a timer, so a provider with the app backgrounded hears about one when they next
open it. Fixing that properly needs provider-keyed push tokens, which the backend doesn't have —
today's push infra is in `didactic-invention` and keyed by `customer_id`.

## Admin app

`apps/admin` is a Vite + React web console for internal MtaaPal operations (catalog, providers,
service requests, consumers). It calls the `effective-happiness` backend services directly from
the browser — no proxy — so that backend must be running too, with CORS enabled for the four
services it talks to (ServiceCatalog, ProviderRegistry, ServiceRequestOrchestrator, Consumers; see
that repo's README).

### Run the admin app

```sh
pnpm admin dev
```

Then open `http://localhost:5173` and sign in (`ops` / `mtaapal-admin` — a placeholder login for
v1, not yet backed by IdentityServer). Copy `apps/admin/.env.example` to `apps/admin/.env` if you
need to point at backend services running somewhere other than the default local ports.

### Add a package

```sh
pnpm admin add <package>
```

### Typecheck and lint

```sh
pnpm admin typecheck
pnpm admin lint
```

## EAS

EAS builds run in the cloud by default; add `--local` to build on your own machine instead:

```sh
eas build --profile development --platform android --local
```

