# Claros

**Know what you can safely spend today.**

Claros is a self-hosted personal finance app that answers one question every day: *How much can I safely spend today?* It runs entirely on your machine — no cloud accounts, no external APIs, no telemetry.

(overview screenshot placeholder)

## Features

- **Safe to Spend Today** — One primary metric calculated from your income, fixed costs, savings goals, and spending
- **Calendar View** — Visual monthly calendar with per-day spending, quick transaction entry
- **Insights & Analytics** — Spending trends, category breakdown, money leaks, pace warnings
- **Savings Goals** — Track multiple goals with projections and "what if" simulations
- **Import/Export** — CSV import with column mapping, JSON backup/restore, PDF reports
- **Command Palette** — Cmd/Ctrl+K for quick actions and navigation
- **Keyboard Shortcuts** — T (today), N (new expense), ←/→ (month navigation)
- **Dark Mode** — Light, dark, and system theme support
- **Local-First** — SQLite database, no external dependencies, all data stays on your machine

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url> claros
cd claros

# Start with Docker Compose
docker-compose up -d

# Open in browser
open http://localhost:3000
```

Your data is stored in `./data/claros.db` and persists across container restarts.

### Local Development

```bash
# Install dependencies
npm install

# Create the database
npx prisma db push

# (Optional) Seed with demo data
npm run db:seed

# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite (via Prisma ORM) |
| Charts | Recharts |
| Validation | Zod |
| Icons | Lucide React |
| Deployment | Docker + docker-compose |

## Database

The SQLite database is stored at `./data/claros.db` (or `/app/data/claros.db` in Docker).

### Backup

**Via the app:** Go to Settings → Data → "Download Backup" to export a full JSON backup.

**Manual:** Simply copy the `data/claros.db` file.

### Restore

**Via the app:** Go to Settings → Data → "Restore Backup" and upload a previously exported JSON file.

**Manual:** Replace `data/claros.db` with your backup file and restart the app.

### Migrations

Database migrations run automatically on startup (via `prisma db push` in Docker, or manually via `npx prisma db push` in development). Your existing data is preserved.

## Updating

### Docker

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build
```

Your data in `./data/` is mounted as a volume and will not be affected by container rebuilds.

### Local

```bash
git pull
npm install
npx prisma db push
npm run build
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./data/claros.db` | SQLite database path |
| `RECEIPT_STORAGE_PATH` | `./public/receipts` | Receipt image storage |
| `NODE_ENV` | `development` | Environment mode |
| `SEED_DEMO_DATA` | `false` | Seed demo data on first run |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `T` | Navigate to today |
| `N` | Quick add expense |
| `←` | Previous month |
| `→` | Next month |
| `Esc` | Close dialog/drawer |

## Project Structure

```
src/
├── app/              # Next.js pages (Overview, Calendar, Insights, Goals, Settings)
├── actions/          # Server Actions (CRUD operations)
├── components/
│   ├── ui/           # shadcn/ui primitives
│   ├── layout/       # Shell, Nav, Header
│   ├── overview/     # Safe-to-spend, metrics, budget pace
│   ├── calendar/     # Month grid, day drawer
│   ├── insights/     # Charts, analytics
│   ├── goals/        # Goal cards, what-if simulator
│   ├── settings/     # Category manager, import/export
│   ├── transactions/ # Form, row, list
│   └── command-palette/
├── lib/
│   ├── finance/      # Pure calculation functions + tests
│   ├── validators/   # Zod schemas
│   ├── db.ts         # Prisma client singleton
│   ├── constants.ts  # Currencies, categories, formatting
│   └── utils.ts      # Tailwind utilities
└── hooks/            # Custom React hooks
```

## Currency Support

Default: INR (₹). Supported: INR, USD, EUR, GBP, JPY, CAD.

Change currency in Settings → General.

## License

MIT
