# Decisions

## Phase 0

- The app stays in the `ayby` folder. `app.json` uses the display name হিসাবখাতা, slug `hisabkhata`, scheme `hisabkhata`, and package id `com.example.hisabkhata`.
- Tabs live in `src/app/(tabs)` so the root layout can be a stack. The addresses stay `/`, `/reports`, `/budget`, and `/more`. The tab bar components remain `src/components/app-tabs.tsx` and `app-tabs.web.tsx`.
- The starter demo screens were removed in place. `npm run reset-project` was not used.
- The default accent is `#1F4D6E`. Dark mode uses `#9EC3DC` for the same hue so the title stays readable on black.
- `app_settings` uses `key` as its primary key. Every other table uses an integer `id`.
- Booleans are stored as integers `0` or `1`. Timestamps are UTC ISO-8601 text. Seed rows use `2026-01-01T00:00:00.000Z`.
- `recurring_rules.to_account_id` is included now so a later transfer rule does not need a migration.
- Money formatting splits taka and paisa with integers. `Intl` only formats the taka part.
- Jest checks the schema text, seed rows, and formatters. It does not open a device database, because `jest-expo` mocks `expo-sqlite`.
- Web needs `metro.config.js` so Metro can bundle `expo-sqlite`'s wasm file, plus COOP and COEP headers. Android and iOS do not use that file.
- Noto Sans Bengali (SIL Open Font License) is bundled as four static weights. The license is `assets/fonts/OFL.txt`.
- `npx expo lint` installed ESLint 9 and `eslint.config.js` on first run. The starter's web color-scheme hook keeps its hydration effect, with one lint exception, so the first client render still matches the server.
