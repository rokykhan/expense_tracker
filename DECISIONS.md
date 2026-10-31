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

## Phase 1

- The total balance adds every account, including archived ones, so a transfer does not change it.
- সঞ্চয় on Home is this month's income minus expense. Transfers are left out of income, expense, savings, and the daily total.
- Accounts are archived instead of deleted. A category can be deleted only when no row uses it, and its kind stays fixed after creation.
- `profile_name` and `currency_symbol` are settings keys. Missing keys are inserted on launch. The default symbol is ৳. A new install also gets them from the seed.
- A picked calendar day is stored as midnight in Asia/Dhaka. The month switcher is remembered only while that screen stays open.
- Deleting an entry asks on the form, then offers ফেরান until another entry is deleted. Undo writes the same row back.
- The icon picker stores an SF Symbol name and shows a Bangla label.
- List screens open `/accounts`, `/categories`, `/transactions`, and `/settings`. The generated type name `/accounts/index` would be caught by the `[id]` route.
