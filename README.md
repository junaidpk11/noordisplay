# NoorDisplay

Masjid TV display platform — customizable prayer times, rotating Quran/Hadith quotes, announcements, and an Iqamah countdown screen for any masjid worldwide.

## Stack

| Layer     | Tech                                      |
|-----------|-------------------------------------------|
| Backend   | Spring Boot 3.2 / Java 21 / PostgreSQL    |
| Frontend  | Next.js 14 (App Router) / TypeScript / Tailwind |
| Auth      | JWT (jjwt 0.12)                           |
| Real-time | WebSocket / STOMP                         |
| Migrations| Flyway                                    |
| Prayer API| Aladhan (https://aladhan.com)             |

---

## Quick start (MacBook)

### Prerequisites

```bash
brew install postgresql@16 java@21 node
brew services start postgresql@16
```

### 1. Database

```bash
createdb noordisplay
# or: psql -c "CREATE DATABASE noordisplay;"
```

### 2. Backend

```bash
cd backend
./mvnw spring-boot:run
# Runs on http://localhost:8080
# Flyway runs V1__init_schema.sql automatically on first start
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### 4. Open the display

- TV display:  http://localhost:3000/display/masjid-al-noor
- Admin panel: http://localhost:3000/admin
- Login:       http://localhost:3000/auth/login

> **Fullscreen tip for the TV:** Open the display URL in Chrome, press **⌘+Shift+F** (or F11 on Windows) to go fullscreen. On the actual TV, plug in a mini PC or Raspberry Pi running Chrome in kiosk mode.

---

## Project structure

```
noordisplay/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/noordisplay/
│       ├── NoorDisplayApplication.java
│       ├── config/         # Security, WebSocket, AppConfig
│       ├── controller/     # AuthController, AdminController, DisplayController
│       ├── entity/         # Masjid, PrayerTimes, Announcement, MasjidFeatures, User
│       ├── repository/     # Spring Data JPA repos
│       ├── security/       # JwtUtil, JwtFilter
│       ├── service/        # DisplayService, AladhanService, IqamahScheduler
│       └── websocket/      # DisplayPhaseMessage
│
└── frontend/
    └── src/
        ├── app/
        │   ├── display/[slug]/page.tsx   ← public TV board
        │   ├── admin/                    ← admin panel pages
        │   └── auth/login/page.tsx
        ├── lib/
        │   ├── api.ts                    ← axios client with JWT
        │   ├── quotes.ts                 ← Quran + Hadith pool
        │   └── useDisplayPhase.ts        ← WebSocket hook
        └── types/index.ts
```

---

## How the TV display works

1. Masjid admin opens `/display/masjid-al-noor` in Chrome on their TV PC
2. Browser connects via WebSocket (`/ws`) to subscribe to `/topic/display/masjid-al-noor`
3. `IqamahScheduler` runs every 30 seconds on the backend, calculates the phase (NORMAL / WARN / IQAMAH / IN_PRAYER), and broadcasts it
4. The display page reacts to the phase and transitions screens automatically

## Prayer time sync

- `AladhanService` runs a `@Scheduled` job at 1 AM daily to fetch and store times for all masjids
- Admin can also trigger a manual sync from the admin panel → Prayer times → "Sync now"
- Iqamah offsets are stored in the DB and are editable per-prayer from the admin panel

---

## Next steps

- [ ] Niyyah donation widget integration
- [ ] Multi-masjid superadmin dashboard
- [ ] Ramadan mode (auto-activate, Suhoor/Iftar times, Tarawih)
- [ ] Azaan audio at prayer time (Web Audio API)
- [ ] Weather widget (OpenWeatherMap API)
- [ ] Multi-language support (French, Urdu)
- [ ] Stripe billing per masjid (monthly SaaS)
