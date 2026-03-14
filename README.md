<h1 align="center">
  Code Ninjas Dashboard
</h1>

<p align="center">
  <strong>A full-stack student dashboard for Code Ninjas dojos</strong><br>
  Coin rewards · Leaderboards · Game Jams · 3D Print Queue · Catalog Store
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Deployed_on-Vercel-000?logo=vercel&logoColor=white" alt="Vercel">
  <img src="https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Auth-JWT-purple?logo=jsonwebtokens&logoColor=white" alt="JWT">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| **Coin Economy** 🪙 | Silver, gold, and obsidian coin system with tasks students complete to earn rewards |
| **Leaderboard** 🏆 | Live point rankings with belt-level progression (White → Black) |
| **Game of the Month** 🎮 | Rotating featured game with per-game leaderboards and automatic point payouts |
| **Game Jams** 🏁 | Timed coding competitions with carousel hero banners and past-jam archives |
| **Catalog Store** 🛍️ | Prize store where students spend coins — supports variants, images, and limited-time items |
| **3D Print Queue** 🖨️ | Students submit print requests; staff manage queue status (Queued → Printing → Ready) |
| **Sandbox Challenges** 🧩 | Tiered coding challenges (Levels 1-3 + Mix Sets) with difficulty ratings and point rewards |
| **Sensei Admin Panel** 🛡️ | Full back-office for staff — manage news, rules, students, jams, catalog, and queue |
| **Role-Based Auth** 🔐 | JWT-based login with separate Ninja (student) and Sensei/Admin roles |

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        BROWSER (SPA)                           │
│  index.html + main.js + ui.js + auth.js + admin.js + config.js │
└────────────────┬───────────────────────────────────────────────┘
                 │  fetch() calls
                 ▼
┌────────────────────────────────────────────────────────────────┐
│                  VERCEL SERVERLESS FUNCTIONS                   │
│                                                                │
│  api/batch.js ─────────── Batch load (12 collections → 1 req)  │
│  api/auth/login.js ────── JWT login + rate limiting            │
│  api/auth/register.js ─── Sensei registration                  │
│  api/[collection]/ ────── Generic CRUD for all data types      │
│                                                                │
│  lib/auth.js ──────────── JWT sign / verify (jose + HS256)     │
│  lib/requireAuth.js ───── Auth middleware (token + role check) │
│  lib/rateLimit.js ─────── In-memory brute-force protection     │
└────────────────┬───────────────────────────────────────────────┘
                 │  Mongoose ODM
                 ▼
┌────────────────────────────────────────────────────────────────┐
│                      MONGODB ATLAS                             │
│  Collections: news, rules, coins, catalog, queue, leaderboard, │
│  jams, jamSubmissions, games, challenges, settings, ...        │
└────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla JS, HTML5, CSS3 (no framework — fast & lightweight) |
| **Styling** | Custom CSS with M3 Design System tokens, CSS variables, dark theme |
| **Backend** | Vercel Serverless Functions (Node.js 18+) |
| **Database** | MongoDB Atlas via Mongoose ODM |
| **Auth** | JWT (HS256) with `jose`, bcrypt password hashing |
| **Security** | CSP headers, HSTS, rate limiting, XSS escaping, URL sanitization |
| **Hosting** | Vercel (zero-config deployments, edge caching) |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB Atlas](https://cloud.mongodb.com/) free-tier cluster
- [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/Jared1407/codeninja-dashboard.git
cd codeninja-dashboard

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and a strong JWT secret

# 4. Run locally
npm run dev
# → Opens at http://localhost:3000

# 5. Deploy to production
npm run deploy
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens (use a long random string) |

## Project Structure

```
codeninja-dashboard/
├── api/                        # Vercel serverless API routes
│   ├── auth/
│   │   ├── login.js            # POST — authenticate & return JWT
│   │   ├── register.js         # POST — register new sensei
│   │   ├── password.js         # POST — change password
│   │   └── senseis/            # GET/DELETE — manage sensei accounts
│   ├── [collection]/
│   │   ├── index.js            # GET/POST/PUT — collection CRUD
│   │   ├── [id].js             # GET/PUT/DELETE — single item CRUD
│   │   └── deleteWhere.js      # POST — conditional bulk delete
│   └── batch.js                # GET — load multiple collections in 1 request
│
├── lib/                        # Shared server-side utilities
│   ├── auth.js                 # JWT create / verify / extract
│   ├── requireAuth.js          # Auth middleware (token + admin check)
│   ├── rateLimit.js            # In-memory rate limiter
│   ├── mongodb.js              # Mongoose connection singleton
│   └── models/
│       ├── Collection.js       # Generic dynamic schema model
│       └── Sensei.js           # Sensei user model
│
├── public/                     # Static frontend (served by Vercel)
│   ├── index.html              # Single-page app shell
│   ├── styles.css              # Full stylesheet (M3 design tokens)
│   ├── main.js                 # App initialization & data rendering
│   ├── ui.js                   # UI helpers, security, tab switching
│   ├── auth.js                 # Login/logout flow
│   ├── admin.js                # Sensei admin panel logic
│   ├── config.js               # App constants & default data
│   ├── database.js             # LocalDB class (cache + server sync)
│   └── sandboxData.js          # Sandbox challenge definitions
│
├── scripts/
│   └── migrate-data.js         # Data migration utility
│
├── vercel.json                 # Vercel config (rewrites, security headers)
├── package.json
├── .env.example                # Environment template
├── LICENSE                     # MIT
└── README.md                   # ← You are here
```

## Security

This application implements several security best practices:

- **JWT Authentication** — Stateless tokens with 24-hour expiry (HS256)
- **Password Hashing** — bcrypt with salt rounds
- **Rate Limiting** — Brute-force protection on login endpoint
- **XSS Prevention** — All user content escaped via `escapeHtml()` + `sanitizeUrl()`
- **Security Headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options via `vercel.json`
- **Input Validation** — Collection allow-list, payload size limits, role-based access control

## API Reference

All endpoints are prefixed with `/api/`.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/login` | — | Authenticate with email + password |
| `POST` | `/auth/register` | Admin | Register a new sensei account |
| `POST` | `/auth/password` | Admin | Change admin password |
| `GET` | `/batch?collections=a,b` | — | Batch-load multiple collections |
| `GET` | `/:collection` | — | List all items in a collection |
| `POST` | `/:collection` | ✓* | Add a new item |
| `PUT` | `/:collection` | Admin | Replace entire collection |
| `GET` | `/:collection/:id` | — | Get a single item |
| `PUT` | `/:collection/:id` | ✓* | Update a single item |
| `DELETE` | `/:collection/:id` | ✓ | Delete a single item |

*\* Some collections allow public POST/PUT for student submissions.*

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built by Sensei Jared for <strong>Code Ninjas</strong> — <em>"Teaching kids what I learned in university"</em>
</p>
