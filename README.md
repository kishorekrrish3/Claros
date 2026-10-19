<div align="center">
  <h1>Claros</h1>
  <p><strong>Know what you can safely spend today.</strong></p>
  <p>A local-first personal finance workspace for daily spending clarity, transaction tracking, savings goals, and practical financial insights.</p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js">
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite&logoColor=white" alt="SQLite">
    <img src="https://img.shields.io/badge/Privacy-Local--first-2ea44f" alt="Local-first">
  </p>
</div>

Claros is a self-hosted personal finance app built around one daily question: *How much can I safely spend today?* Its local SQLite workflow is designed to keep core financial records under your control. Optional integrations and deployment modes should be reviewed separately before assuming that every configuration is fully offline.



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
git clone https://github.com/kishorekrrish3/Claros.git
cd Claros

# Start with Docker Compose
docker-compose up -d

# Open in browser
open http://localhost:3000
```

Your data is stored in `./data/claros.db` and persists across container restarts. Back up this file or use the app's export tools before making infrastructure changes.

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
