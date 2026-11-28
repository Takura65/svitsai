# Svitsai — Smart Parcel Sending & Collection Platform

**Svitsai** is a cross-platform mobile and web parcel logistics application built with **React Native (Expo)** and **Supabase**. It streamlines store-to-store parcel drop-offs, intercity transport handovers, real-time checkpoint tracking, and 6-digit PIN-verified recipient collection.

---

## Key Features

* **Parcel Registration & Tracking:** Generates unique `SVT-...` tracking references with sender/recipient validation, destination store selection, and end-to-end lifecycle history (`Registered` → `Awaiting Collection` → `In Transit` → `Ready for Collection` → `Collected`).
* **Transport Handover & Checkpoints:** Enables staff to log partner transport handovers and record intermediate route checkpoints visible on customer tracking screens.
* **6-Digit Collection Verification:** Automatically generates a unique 6-digit numeric collection code when a parcel reaches `Ready for Collection`, rejecting invalid codes and preventing duplicate collections.
* **Role-Based Access Control (RBAC):** Protects application routes with email/password authentication, separating customer parcel views from staff operational workflows.
* **Real-Time Notifications & Dashboard:** Tracks parcel counts across lifecycle stages and delivers automated status notifications with unread badge counts.
* **Offline-Resilient Caching:** Combines Supabase PostgreSQL persistence with local `AsyncStorage` caching for reliable reads across Expo Go and Web.

---

## Architecture

Svitsai uses a serverless client-to-database architecture with PostgreSQL Row Level Security (RLS) enforcing data boundaries:

| Layer | Stack | Role |
| :--- | :--- | :--- |
| **Frontend** | React Native, Expo, Expo Web | Cross-platform UI for customers and store/hub staff. |
| **Service & Cache** | `src/services/parcelStorage.js`, `AsyncStorage` | Business logic, status progression guards, and local cache fallback. |
| **Auth & Security** | Supabase Auth, PostgreSQL RLS | Session management, staff role checks, and row-level ownership rules. |
| **Database** | Supabase PostgreSQL | Relational tables: `parcels`, `parcel_status_history`, `transport_handovers`, `transport_checkpoints`, and `notifications`. |

---

## Local Setup

### 1. Prerequisites
* Node.js (v18+) and npm
* Expo Go (for mobile testing) or a modern web browser
* A hosted [Supabase](https://supabase.com) project with the database schema and RLS migration applied

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Supabase
Create a `.env` file in the project root with your Supabase project URL and public anon/publishable key:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

`EXPO_PUBLIC_SUPABASE_KEY` is also accepted as a compatibility alias. Restart Expo after changing `.env` so Metro picks up the values. Never put a Supabase service-role key in an `EXPO_PUBLIC_` variable.
