# Project Split - AeroMiles TK

## Overview

For reporting purposes, the AeroMiles TK project can be split into five sections based on the color grouping in the provided feature allocation table. The split below follows the same grouping logic and maps each section to the current front-end routes and modules in this repository.

## Section 1 - Core Platform (White)

### Scope

- Navbar
- Login & Logout
- Registration
- Dashboard
- Profile Settings

### Current Route Mapping

- `/` -> Landing page
- `/login` -> Member and staff login
- `/member/dashboard` -> Member dashboard
- `/admin/dashboard` -> Admin dashboard

### Current Implementation Notes

- Navbar and shared navigation are implemented through the member/admin layout shell.
- Login and logout flows are implemented for both member and staff.
- Dashboard is implemented for both member and admin roles.
- A dedicated registration route is not part of the current front-end build.
- Full profile settings are not implemented as a separate page; the closest implemented member data maintenance feature is identity document management.

### Main Source Areas

- `src/App.js`
- `src/layouts/MemberLayout.js`
- `src/layouts/AdminLayout.js`
- `src/components/Sidebar.js`
- `src/components/Topbar.js`
- `src/pages/LandingPage.js`
- `src/pages/LoginPage.js`
- `src/pages/member/MemberDashboardPage.js`
- `src/pages/admin/AdminDashboardPage.js`

## Section 2 - Member Data Administration (Yellow)

### Scope

- CRUD - Manajemen Data Member
- CRUD - Manajemen Identitas Member

### Current Route Mapping

- `/admin/members` -> Member management CRUD
- `/member/identity` -> Member identity document CRUD

### Current Implementation Notes

- Admin can create, read, update, search, and delete member data.
- Member can manage identity documents with validation and KTP lifetime handling.

### Main Source Areas

- `src/pages/admin/MembersPage.js`
- `src/pages/member/IdentityPage.js`
- `src/data/mockData.js`
- `src/utils/validation.js`

## Section 3 - Claim & Transfer Operations (Green)

### Scope

- CRUD - Manajemen Claim Missing Miles Member
- RU - Manajemen Claim Missing Miles Staf
- CR - Transfer Miles antar Member

### Current Route Mapping

- `/member/claim` -> Missing miles claim submission
- `/admin/claims` -> Staff claim review and decision flow
- `/member/transfer` -> Award miles transfer between members

### Current Implementation Notes

- Member can submit missing miles claims with validation.
- Staff can approve, reject, or request more information on claims.
- Member can transfer miles with self-transfer and balance protection rules.

### Main Source Areas

- `src/pages/member/ClaimPage.js`
- `src/pages/admin/ClaimsPage.js`
- `src/pages/member/TransferMilesPage.js`
- `src/utils/validation.js`

## Section 4 - Rewards, Miles Purchase, Tier Info, and Transaction History (Blue)

### Scope

- CR - Redeem Hadiah
- CR - Pembelian Award Miles Package
- R - Informasi Tier & Keuntungan
- RD - Laporan & Riwayat Transaksi Miles

### Current Route Mapping

- `/member/rewards` -> Reward catalog and redemption
- `/member/buy-miles` -> Award miles package purchase
- `/member/dashboard` -> Tier overview and benefit progress summary
- `/admin/transactions` -> Staff transaction review and history
- `/admin/reports` -> Reporting summary

### Current Implementation Notes

- Reward redemption is implemented with search, detail modal, and insufficient balance handling.
- Award miles package purchase is implemented with mock balance updates.
- Tier information is shown in the member dashboard.
- Transaction history and multi-tab transaction management are implemented for staff.
- Reporting is available as front-end dashboard/report placeholders.

### Main Source Areas

- `src/pages/member/RewardsPage.js`
- `src/pages/member/BuyMilesPage.js`
- `src/pages/member/MemberDashboardPage.js`
- `src/pages/admin/TransactionsPage.js`
- `src/pages/admin/ReportsPage.js`

## Section 5 - Reward & Partner Administration (Red)

### Scope

- CRUD - Manajemen Hadiah & Penyedia
- CRUD - Manajemen Mitra

### Current Route Mapping

- `/admin/rewards-management` -> Partner and reward management

### Current Implementation Notes

- Staff can manage partners and reward records.
- Reward records include active date handling and warnings.

### Main Source Areas

- `src/pages/admin/RewardsManagementPage.js`
- `src/data/mockData.js`
- `src/utils/validation.js`

## Summary Table

| Section | Color Group | Main Functional Area | Main Routes |
| --- | --- | --- | --- |
| 1 | White | Core platform and shared access | `/`, `/login`, `/member/dashboard`, `/admin/dashboard` |
| 2 | Yellow | Member and identity CRUD | `/admin/members`, `/member/identity` |
| 3 | Green | Claim and transfer operations | `/member/claim`, `/admin/claims`, `/member/transfer` |
| 4 | Blue | Rewards, purchase, tier info, transactions | `/member/rewards`, `/member/buy-miles`, `/member/dashboard`, `/admin/transactions`, `/admin/reports` |
| 5 | Red | Partner and reward administration | `/admin/rewards-management` |

## Testing Note

The Selenium suite already covers the implemented flows across these sections, especially:

- login
- dashboards
- member CRUD-related flows
- staff CRUD-related flows
- claim flows
- transfer flows
- reward redemption
- transaction tabs
- master data CRUD
- reward and partner CRUD

This document is a reporting split only. It does not change the runtime architecture of the application.
