# AI Photo Intake for Municipal Equipment Listings

Garage-style demo showing how messy seller uploads can become structured, searchable listing data.

## What it demonstrates

- Listing creation for municipal equipment categories like Engines & Pumpers and Ladders / Aerials / Quints
- Multi-photo upload flow
- AI-style image analysis into broad gallery buckets such as `exterior`, `interior`, `engine`, `pump_panel`, and `documents`
- Search-friendly captions and labels for each image
- Gallery grouping on the listing detail page
- Search across listing fields plus image-derived metadata
- Human correction of predicted categories, stored for future model improvement

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Prisma schema included for PostgreSQL production modeling
- Demo JSON datastore for out-of-the-box local runs

## Architecture

```text
src/
  app/                  routing + API routes
  features/             listing, photos, search product slices
  server/ai/            image analysis prompt + services
  server/taxonomy/      asset-to-photo category mapping
  server/storage/       upload persistence
  server/demo/          demo datastore + seeded records
  server/db/            Prisma client entrypoint
  components/ui/        reusable UI primitives
```

## Local run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo behavior

- The app ships with seeded municipal equipment listings so search and gallery grouping work immediately.
- New uploads are saved into `public/uploads`.
- AI analysis currently uses a deterministic local heuristic service in `src/server/ai/imageAnalysis.service.ts` so the demo works without external credentials.
- The Prisma schema matches the intended PostgreSQL production shape, but the runtime uses `data/demo-store.json` for simplicity.

## Suggested demo script

1. Create a new Engine / Pumper listing.
2. Upload exterior, cab, engine bay, pump panel, tire, and document photos.
3. Show the AI-generated categories, captions, and labels on the upload page.
4. Open the listing detail gallery and switch between grouped tabs.
5. Search for `pump panel` or `interior dashboard`.
6. Manually correct one photo category and explain that the correction is persisted for future training.
