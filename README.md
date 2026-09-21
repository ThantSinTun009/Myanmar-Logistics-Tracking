# Myanmar Logistics Monitoring

Prototype monorepo for the AIE-F B2 Assignment 5: 

- a Next.js admin/trader web app
- a React Native/Expo driver app, and
- a Supabase PostgreSQL backend.

## Architecture

- `apps/admin-web` — Next.js web app for Admin + Trader roles
- `apps/mobile` — Expo React Native app for Driver role
- `supabase/schema.sql` — PostgreSQL schema, RLS policies, helper functions and demo seed data
- `docs/prd.md` — supplied product requirements

The implementation follows the supplied PRD: role-based access, shipment lifecycle, simulated GPS, Leaflet/OpenStreetMap tracking, route closure alerts, realtime updates, offline driver queue simulation, and document metadata.

## Quick start

### 1. Supabase

Create a Supabase project and run `supabase/schema.sql` in the SQL editor. Then create three Auth users matching the demo profiles in the seed section (or sign up normally and update their profile roles).

Set environment variables in `apps/admin-web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

For the mobile app, put the same values in `apps/mobile/.env` as `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### 2. Web

```bash
cd apps/admin-web
npm install
npm run dev
```

Open `http://localhost:3000/login`.

### 3. Mobile

```bash
cd apps/mobile
npm install
npx expo start
```

The mobile app contains the Driver flow and a simulated offline mode.

## Demo scenario

Use shipment `MYT-2026-001`: Yangon → Muse, driver Aung Aung. Move the simulated truck through Yangon → Mandalay → Lashio, close the Muse route from Admin, observe the alert, switch the Driver to offline mode, create a pending checkpoint update, then reconnect and synchronize.

## Demo mode (no Supabase required)

The prototype now runs with local demo data, so Supabase is optional until you are ready to connect a database.

### Temporary web users

- Admin: `admin@example.com` / `admin123`
- Trader: `trader@example.com` / `trader123`

The web app stores demo users, shipments, events, routes, and alerts in browser localStorage.

### Temporary mobile user

- Driver: `driver@example.com` / `driver123`

The Expo app stores the demo shipment and offline queue in AsyncStorage.

### Run web

```bash
cd apps/admin-web
npm install
npm run dev
```

Open `http://localhost:3000/login`.

### Run mobile

```bash
cd apps/mobile
npm install
npx expo start
```

Supabase environment variables are not required in demo mode. When Supabase is added later, populate the environment files using the examples in each app.

---

### Prototype Demo

<table>
  <tr>
    <td align="center"><b>Login & Access</b></td>
    <td align="center"><b>Logistics Tracking System</b></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/8a0c5306-4bf0-42c3-a0a8-03c58ac8477d" alt="Login & Access" width="450"></td>
    <td><img src="https://github.com/user-attachments/assets/d82be505-2d0b-49a7-8e44-2fefbff1cf3c" alt="Logistics Tracking System" width="450"></td>
  </tr>
</table>

---
