# AeroMiles TK Front-End

Front-end-only React application for the AeroMiles airline loyalty system. The app is built on the existing Create React App project, uses mocked data only, and follows the connected Stitch design direction for the member and staff experiences.

## Project Overview

AeroMiles serves the AeroTeams alliance:

- Nusantara Air
- LionSky
- Bumi Airlines
- Ozi Skies
- Sakura Airways

This build includes member flows, staff/admin flows, CRUD screens, validation, local mocked state, toasts, and Selenium coverage for positive and negative cases.

## Install Dependencies

```bash
npm install
python -m pip install -r requirements.txt
```

## Run the React App

```bash
npm start
```

Default local URL:

- `http://localhost:3000`

## Mock Credentials

Member:

- Email: `adi.pratama@gmail.com`
- Password: `password123`

Staff:

- Email: `raka.mahendra@oziskies.com`
- Password: `password123`

## Available Routes

- `/`
- `/login`
- `/member/dashboard`
- `/member/claim`
- `/member/buy-miles`
- `/member/transfer`
- `/member/rewards`
- `/member/identity`
- `/admin/dashboard`
- `/admin/members`
- `/admin/staff`
- `/admin/claims`
- `/admin/transactions`
- `/admin/master-data`
- `/admin/rewards-management`
- `/admin/reports`

Detailed routing write-up for reporting purposes:

- `ROUTING.md`
- `PROJECT_SECTIONS.md`

## Implemented Features

- Landing page with AeroMiles hero and AeroTeams alliance strip
- Member and staff login with validation and route-based redirects
- Member dashboard with balances, tier progress, recent activity, and navigation
- Missing miles claim form with six-month date validation and route validation
- Award miles purchase with package selection and mock balance update
- Award miles transfer with balance protection and self-transfer rejection
- Reward catalog with search, filter, detail modal, redemption, and insufficient-balance handling
- Identity document CRUD with lifetime KTP handling
- Admin dashboard with KPI cards, queue, and airline performance summary
- Member CRUD with add, edit, view, delete, search, filter, validation, and cancel-delete path
- Staff CRUD with company domain validation
- Claim review with approve, reject, and request-more-info flows
- Transaction management tabs and detail drawer
- Master data CRUD for airlines, airports, tiers, and miles packages
- Partner and reward management with active date warning
- Reports placeholders for growth, tier mix, claims, revenue, and top rewards

## How to Run Selenium Tests

1. Start the React app:

```bash
npm start
```

2. In another terminal, run:

```bash
python -m pytest tests/test_aeromiles_ui.py
```

Optional custom base URL:

```powershell
$env:AEROMILES_BASE_URL="http://127.0.0.1:3000"
python -m pytest tests/test_aeromiles_ui.py
```

## Demo Mode

To watch the Selenium flow in a visible browser without dragging the suite out, run the suite in demo mode. The built-in pacing is moderately fast: `180ms` between actions, `380ms` after page changes, and a `650ms` pause before the browser closes.

PowerShell:

```powershell
$env:AEROMILES_DEMO_MODE="1"
python -m pytest tests/test_aeromiles_ui.py -q
```

You can override the pacing:

```powershell
$env:AEROMILES_HEADLESS="0"
$env:AEROMILES_ACTION_DELAY_MS="260"
$env:AEROMILES_PAGE_DELAY_MS="520"
$env:AEROMILES_FINAL_PAUSE_MS="850"
python -m pytest tests/test_aeromiles_ui.py -q
```

## Selenium Good-Way Tests

1. Member login success
2. Staff login success
3. Submit valid missing miles claim
4. Purchase miles success
5. Transfer miles success
6. Add member success
7. Edit staff success
8. Staff search and detail drawer success
9. Add staff success
10. Full staff CRUD flow: create, view, edit, delete
11. Transaction tabs render correct datasets
12. Approve claim success

## Selenium Bad-Way Tests

1. Member login fails with wrong password
2. Staff login rejects personal email
3. Claim form rejects old flight date
4. Claim form rejects same origin and destination
5. Purchase miles without selecting package
6. Transfer more miles than available
7. Transfer to self
8. Reward redemption with insufficient miles
9. Add member with invalid email
10. Delete member cancel
11. Add staff with personal email rejected
12. Add staff with duplicate staff ID rejected
13. Delete staff cancel

## Notes

- This application is front-end only.
- No backend or real database is connected.
- All business state is mocked in `src/data/mockData.js`.
- Persisted demo data uses browser `localStorage`.
- Selenium selectors rely on stable `data-testid` attributes.
