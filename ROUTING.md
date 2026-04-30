# Routing System - AeroMiles TK

## Overview

AeroMiles TK uses a client-side routing system with `react-router-dom`. Routing is implemented in `src/App.js` and organized by user area so the member and admin experiences are separated clearly.

## Routing Technology

- `BrowserRouter` for browser-based navigation
- `Routes` and `Route` for route declarations
- `Navigate` for fallback redirect
- Nested layout routing for shared member and admin shells

## Route Structure

### Public Routes

- `/` -> Landing page
- `/login` -> Login page for member and staff

### Member Routes

Member pages are wrapped by `MemberLayout`, which provides the shared navigation and page shell.

- `/member/dashboard` -> Member dashboard
- `/member/claim` -> Missing miles claim
- `/member/buy-miles` -> Purchase award miles
- `/member/transfer` -> Transfer award miles
- `/member/rewards` -> Reward catalog and redemption
- `/member/identity` -> Identity document CRUD

### Admin Routes

Admin pages are wrapped by `AdminLayout`, which provides the admin sidebar, topbar, and shared content structure.

- `/admin/dashboard` -> Admin dashboard
- `/admin/members` -> Member management CRUD
- `/admin/staff` -> Staff management CRUD
- `/admin/claims` -> Claim review and processing
- `/admin/transactions` -> Transaction management
- `/admin/master-data` -> Master data CRUD
- `/admin/rewards-management` -> Partner and reward management
- `/admin/reports` -> Reports and analytics

## Route Mapping Per Tab

### Public Navigation

| UI Tab / Entry | Route | Notes |
| --- | --- | --- |
| Landing Page | `/` | Public entry page |
| Login | `/login` | Shared login page for member and staff |

### Member Sidebar Tabs

| Member Tab | Route | Function |
| --- | --- | --- |
| Dashboard | `/member/dashboard` | Balance, tier progress, recent activity |
| Claim Miles | `/member/claim` | Submit missing miles claim |
| Buy Miles | `/member/buy-miles` | Purchase award miles |
| Transfer Miles | `/member/transfer` | Transfer miles to another member |
| Rewards | `/member/rewards` | Browse and redeem rewards |
| Identity Docs | `/member/identity` | Identity document CRUD |

### Admin Sidebar Tabs

| Admin Tab | Route | Function |
| --- | --- | --- |
| Dashboard | `/admin/dashboard` | KPI and operations summary |
| Members | `/admin/members` | Member CRUD |
| Staff | `/admin/staff` | Staff CRUD |
| Claims | `/admin/claims` | Claim review queue |
| Transactions | `/admin/transactions` | Transaction management |
| Master Data | `/admin/master-data` | Airlines, airports, tiers, packages CRUD |
| Rewards Mgmt | `/admin/rewards-management` | Partner and reward CRUD |
| Reports | `/admin/reports` | Reporting and analytics |

## Tabs Without Separate Routes

Some tabs in the UI are state-based tabs inside a page, so they do not change the browser URL.

### Login Page Tabs

| Tab | Route | Notes |
| --- | --- | --- |
| Member Login | `/login` | Changes form mode only |
| Staff Login | `/login` | Changes form mode only |

### Admin Transactions Tabs

| Tab | Route | Notes |
| --- | --- | --- |
| Miles Purchase | `/admin/transactions` | Filtered transaction view inside the same page |
| Miles Transfer | `/admin/transactions` | Filtered transaction view inside the same page |
| Reward Redemption | `/admin/transactions` | Filtered transaction view inside the same page |
| Claim Miles | `/admin/transactions` | Filtered transaction view inside the same page |

### Fallback Route

- `*` -> Redirect to `/`

This ensures invalid or unknown URLs return the user to the landing page instead of leaving the app on a blank screen.

## Routing Design

The routing is grouped by access domain:

1. Public area
2. Member area
3. Admin area

This structure makes the application easier to maintain because shared UI concerns are handled once in the layout layer instead of being repeated in every page.

## Navigation Flow

### Member Flow

1. User opens `/login`
2. User logs in as member
3. App navigates to `/member/dashboard`
4. User can continue to claim, buy miles, transfer, rewards, or identity routes

### Staff Flow

1. User opens `/login`
2. User logs in as staff
3. App navigates to `/admin/dashboard`
4. User can continue to members, staff, claims, transactions, master data, rewards management, and reports

## Implementation Note

The routing is front-end only. Access flow is controlled by React state and mock logic, without backend session handling or server-side route protection.

## Source Reference

- Main routing file: `src/App.js`
- Member shared layout: `src/layouts/MemberLayout.js`
- Admin shared layout: `src/layouts/AdminLayout.js`
