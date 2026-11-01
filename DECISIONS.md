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
- On web the database opens only in the browser, after the page has loaded. WAL is best-effort there; a failed journal-mode change keeps the default mode. Retry reloads the page because a failed open stays cached until then.
- Quick shortcuts are income or expense. The table has no destination account, and a category is required, so a transfer is not a shortcut.
- A shortcut's amount is required, so one tap can post today's entry. Order is changed with উপরে and নিচে.
- A new recurring rule's first run is its start date. Editing the start date does not move `next_run_date`, so entries already due are not skipped.
- The day of the start date is kept for monthly and yearly rules. A short month uses its last day, then a later month can return to the original day.
- Deleting a rule keeps the entries it already created and clears their rule link. A unique index on the rule and timestamp stops the same due date from being inserted twice.
- Missed runs are filled when the app opens and when it returns to the foreground.

## Phase 3

- A budget is one row per month. A null category is the overall budget. Saving the same month and category updates that row.
- Progress uses this month's expenses. Yellow starts at 80 percent, compared with integers (`spent * 5 >= limit * 4`). Red starts when spending reaches the limit. Copying last month skips rows that already exist.
- A savings goal is complete when the deposits, minus withdrawals, reach the target. A withdrawal cannot exceed what is saved.
- দেনা is `borrowed` and পাওনা is `lent`. Remaining is the original amount minus payments. Settled rows stay out of the person totals. A due date before today, with money still unpaid, is overdue.
- Linking an account is off unless the user turns it on, and only when the debt is created. Borrowed money is income and lent money is an expense, both in অন্যান্য. Paying back reverses that. Later edits do not rewrite those entries. Deleting a debt or payment leaves the account entries in place.

## Phase 4

- Chart values are integer paisa. The axis labels show whole taka. A day or month with no amount is left off the bar chart, and the bars that remain still add up to the same total as the table.
- An empty custom filter means every account, category, and kind. A range whose end is before its start shows no rows.
- The CSV stores integer paisa, with Bangla headers and a byte-order mark. On Android and iOS the file is written to the cache and shared. On the web the file system API throws, and a local file cannot be shared, so the browser downloads the CSV instead.
- `expo-linear-gradient` is installed because the bar chart loads it as soon as the chart package is imported.

## Phase 5

- A note search matches the title and the body. Pinned notes stay above the others.
- Today includes open tasks whose due day is today or earlier, so an overdue task is not hidden. Upcoming is everything else that is still open, including a task with no due day.
- A reminder is a date trigger with `delivery: 'bestEffort'`. The app does not declare an exact-alarm permission. On Android the channel is created before the notification permission is requested. Finishing or deleting a task cancels that notification, and a time that has already passed is not scheduled.
- The web build cannot schedule a local notification. Saving a reminder there shows that it can be set on the phone, and the task is left unchanged.

## Phase 6

- The PIN is stored as a SHA-256 hash with a random salt. The raw PIN is never written. On Android and iOS the hash is in secure storage. The web build has no secure-storage implementation, so the same hash is kept in local storage.
- Two wrong attempts have no wait. The third waits 15 seconds, and the fifth waits 60 seconds. A correct PIN clears the count.
- Face or fingerprint unlock is optional and does not replace the PIN. The system passcode is not offered as a fallback. Face ID uses the usage string in `app.json`.
- Hiding the recents preview turns on screen-capture protection. The web page cannot do that, so the switch is saved and applied only on a phone.
- Dark mode keeps the existing black background and white text. Each accent preset has a lighter pair for dark mode, stored as the light hex in `app_settings`.
- The widget's month figure is this month's income minus expense, the same number Home calls সঞ্চয়. Today's figure is today's expenses. On iOS the add button opens `hisabkhata://transaction/new`. On Android the button notifies the app with the target `add`, which opens the new-entry screen while the app process is running. The widget itself needs a development build, so the browser cannot show it.
- While the lock is up, the current screen stays mounted but hidden, so unlocking returns to the same place. The visible page and the accessibility tree contain only the PIN pad.

