# Turing Project HQ

Professional project management dashboard for the Turing platform.

## Features

- **Overview Dashboard**: KPIs, quick links, recent activity, sprint status
- **Issues Tracker**: Full issue management with filters and detail views
- **Apple Compliance**: App Store submission checklist and privacy labels
- **Screenshots Library**: Visual documentation organized by feature
- **Architecture Docs**: System overview, Firebase collections, tech stack
- **Marketplace Debug**: Category data comparison and provider counts
- **Links & Resources**: Centralized resource management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Pages (static export)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Build for Production

```bash
npm run build
```

This generates a static export in the `out/` folder.

## Deployment to Cloudflare Pages

### Build Settings

- **Build command**: `npm run build`
- **Build output directory**: `out`
- **Root directory**: `/` (or the path to this folder)

### Steps

1. Push to GitHub
2. Connect repository to Cloudflare Pages
3. Set build command: `npm run build`
4. Set output directory: `out`
5. Deploy

The site will be available at your Cloudflare Pages URL (e.g., `hq.turingtr.com`).

## Adding Screenshots

1. Place image files in `public/screenshots/[feature]/`
   ```
   public/
     screenshots/
       auth/
         login.png
         register.png
       marketplace/
         categories.png
         providers.png
   ```

2. Update `data/hq-data.json` with screenshot metadata:
   ```json
   {
     "id": "SS-001",
     "name": "Login Screen",
     "path": "/screenshots/auth/login.png",
     "feature": "Auth",
     "tags": ["login", "auth"],
     "platform": "iOS",
     "createdAt": "2026-01-30"
   }
   ```

3. Build and deploy

## Data Management

### Data Sources

- **Static JSON**: `data/hq-data.json` - main data source
- **localStorage**: Local overrides for edits (browser-only)

### Extending with Firestore

1. Add Firebase credentials to `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   ```

2. Create Firestore adapter in `src/lib/firestore.ts`

3. Replace JSON imports with Firestore queries in page components

### Export/Import

- Use the browser console or add UI to export/import data
- Data format matches `data/hq-data.json` schema

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Overview (/)
│   │   ├── issues/page.tsx    # Issues (/issues)
│   │   ├── apple/page.tsx     # Apple Compliance (/apple)
│   │   ├── screenshots/       # Screenshots Library
│   │   ├── architecture/      # Architecture Docs
│   │   ├── marketplace/       # Marketplace Debug
│   │   └── links/page.tsx     # Links & Resources
│   ├── components/             # React components
│   ├── lib/                    # Utilities and data access
│   └── types/                  # TypeScript types
├── data/
│   └── hq-data.json           # Main data file
├── public/
│   └── screenshots/           # Screenshot images
└── project-hq/                # Legacy backup (vanilla JS version)
```

## TypeScript Types

All data types are defined in `src/types/hq.ts`:

- `Issue` - Bug/task tracking
- `Screenshot` - Screenshot metadata
- `Link` - Resource links
- `MarketplaceCategory` - Category data
- `HQData` - Root data structure

## Legacy Version

The original vanilla JS version is preserved in `project-hq/` for reference.

## License

Internal use only - Turing Project
