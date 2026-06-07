# KreativTools Briefing

KreativTools is a small business briefing site that turns public RSS/source signals into a short original scan, fixed topic pages, and direct links back to the original publishers.

## Local Workflow

- `npm start` runs the local Express server at `http://localhost:3000`.
- `npm test` runs the Worker API tests.
- `npm run worker:dev` runs the Cloudflare Worker locally with Wrangler.
- `npm run deploy` deploys the Worker and static assets.

## Public Routes

- `/` shows the latest KreativTools editorial brief and top cards.
- `/topic/artificial-intelligence`, `/topic/markets`, `/topic/europe`, and `/topic/romania` are fixed topic pages.
- `/about`, `/privacy`, `/terms`, and `/contact` are trust and compliance pages.
- `/ads.txt`, `/robots.txt`, `/sitemap.xml`, `/favicon.svg`, and `/social-card.svg` are static public assets.

## Content Standard

KreativTools should add value before it links out. Keep the homepage editorial brief original, keep cards short, avoid republishing full publisher text, and make the source link clear on every article card.

## AdSense Checklist

- Replace `pub-0000000000000000` in `public/ads.txt` with the real Google AdSense publisher ID.
- Keep `/privacy`, `/terms`, and `/contact` reachable from the footer.
- Do not put ad units on thin error states or empty pages.
- Keep publisher ownership language visible because the reporting belongs to the original source.
- Apply for review only after the production domain serves the final sitemap, legal pages, and real `ads.txt`.

## Deployment Notes

The configured Cloudflare Worker name is `kreativtools-briefing`. If the existing Cloudflare project still uses the old worker name, update the Cloudflare route/project mapping before deploying.
