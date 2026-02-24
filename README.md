# Sparkle Timekeeping Admin Dashboard

This repository contains the Sparkle Timekeeping Admin Dashboard frontend.

## Run Locally

### 1. Prerequisites

- Node.js 18+ (Node.js 20 recommended)
- npm

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

Open the URL shown in terminal (usually `http://localhost:5173`).

### 4. Build for production

```bash
npm run build
```

Build output is generated in `dist/`.

### 5. Preview production build

```bash
npm run preview
```

## UI Notes

- Sidebar groups:
  - `DASHBOARD` (Overview, Time Records, Activity Logs)
  - `User Management`
  - `Time Management`
- Default dashboard route: `/dashboard/overview`
- Most table pages now include shared pagination controls:
  - `Previous` / `Next`
  - Page number jump input
  - Page indicator (`Page X of Y`)
  - Page size selector (10, 25, 50, 100)
- Action buttons use modal flows:
  - Edit/Create modal
  - Confirm modal
  - Action completed modal



## Troubleshooting

- If a page turns blank after code changes, restart dev server:

```bash
npm run dev
```

- Then hard refresh the browser (`Ctrl+Shift+R`).
