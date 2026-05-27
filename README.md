# Garage

AI-assisted listing intake demo for ambulances, fire apparatus, dump trucks, and heavy equipment. The app turns uploaded listing photos into structured categories, captions, and search labels, then uses that metadata to drive gallery organization and search.

## What The Project Does

- Creates listings for multiple apparatus and equipment categories
- Lets a user start from preset demo asset packs or upload additional photos
- Runs image analysis on photos and stores:
  - primary category
  - category list
  - confidence
  - caption
  - labels
  - raw model metadata
- Streams analysis progress on the listing detail page
- Groups galleries by detected visual category
- Searches across listing fields plus photo-derived metadata
- Exposes API endpoints for re-categorizing a photo and applying manual category corrections

## Current Product Shape

- Home page: create a listing from scratch or from preset demo packs in `assets/`
- Listing detail page: live image analysis status, grouped gallery, captions, and slideshow views
- Listings page: browse created listings with search
- Search: keyword + embedding-based ranking over listings and photos

The current presets are:

- `Ambulance`
- `Pumper Tanker`

Supported asset categories in the taxonomy include:

- Engines & Pumpers
- Ladders / Aerials / Quints
- Tankers / Tenders
- Rescue Trucks / Squads
- Brush Trucks / Minis
- Ambulances
- Dump Trucks
- Heavy Equipment

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL via `NEON_URL`
- OpenAI Responses API for image analysis
- OpenAI embeddings for search ranking

## Important Runtime Notes

- The app now uses Prisma at runtime. It does not use a JSON datastore.
- `NEON_URL` is required for listing and photo storage.
- `OPENAI_API_KEY` is required for:
  - image analysis
  - semantic search embeddings
- Uploaded files are written to `public/uploads/`.
- Preset demo images are served from `assets/` through `/api/demo-assets/...`.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Set environment variables:

```bash
NEON_URL=postgresql://...
OPENAI_API_KEY=sk-...
```

3. Push the Prisma schema to your database:

```bash
npx prisma db push
```

4. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Notes

The Prisma schema lives in [prisma/schema.prisma](./prisma/schema.prisma) and currently models:

- `Listing`
- `Photo`

The runtime store is implemented in [src/server/demo/demoStore.ts](./src/server/demo/demoStore.ts), which uses Prisma queries and transactions for listing creation, photo analysis state, corrections, and search indexing.

## Seeding And Demo Data

There are two different demo-data concepts in this repo:

- Preset asset packs in `assets/` used by the create-listing flow
- Prisma reset logic in `prisma/seed.ts`

Running:

```bash
npm run seed
```

resets the Prisma-backed store using [src/server/demo/seedData.ts](./src/server/demo/seedData.ts).

At the moment, `seedData.ts` is checked in with empty `listings` and `photos` arrays, so the main out-of-the-box demo path is to create a listing from one of the preset asset packs on the home page.

## Analysis Flow

There are two main analysis paths:

- Creating a listing with preset or deferred-upload photos:
  - photo records are created as pending
  - the listing detail page opens an SSE stream to `/api/listings/[listingId]/analyze`
  - progress updates stream into the UI until analysis completes or fails
- Uploading photos from the dedicated uploader:
  - files are saved
  - analysis runs during the upload request
  - the page refreshes with completed metadata

Image analysis lives in [src/server/ai/imageAnalysis.service.ts](./src/server/ai/imageAnalysis.service.ts) and is now OpenAI-only. The previous heuristic fallback path has been removed.

## Search

Search is implemented in [src/features/search/server/search.queries.ts](./src/features/search/server/search.queries.ts).

It combines:

- keyword matching across listing fields
- keyword matching across photo captions, labels, filenames, and categories
- OpenAI embedding similarity for reranking

If `OPENAI_API_KEY` is missing, semantic search cannot run.

## API Surface

Current API routes include:

- `GET /api/listings`
- `POST /api/listings`
- `GET /api/listings/[listingId]`
- `POST /api/listings/[listingId]/photos`
- `GET /api/listings/[listingId]/analyze`
- `POST /api/listings/[listingId]/analyze`
- `GET /api/photos/[photoId]`
- `PATCH /api/photos/[photoId]`
- `POST /api/photos/[photoId]/categorize`
- `GET /api/search?q=...`

## Repo Shape

```text
src/
  app/                  pages and API routes
  components/           shared UI and layout
  features/listings/    listing UI, queries, and actions
  features/photos/      upload, analysis actions, and photo types
  features/search/      search ranking and result types
  server/ai/            OpenAI analysis and embeddings
  server/db/            Prisma client setup
  server/demo/          presets, Prisma-backed store wrapper, seed helpers
  server/storage/       upload persistence
  server/taxonomy/      asset-specific photo category rules
prisma/
  schema.prisma         Prisma schema
  seed.ts               demo store reset entrypoint
assets/
  ...                   preset demo image packs
public/uploads/
  ...                   user-uploaded files at runtime
```
