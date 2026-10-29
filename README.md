# Starlink stats dashboard

Single-page Next.js dashboard of public Starlink figures, each with a source and date.

Satellite counts, inclination shells, and launches are read from Jonathan McDowell and Launch Library 2 when the page is generated. The twelve ground-track elements are read from CelesTrak at the same time. Vercel keeps that page for an hour, then rebuilds it the next time it is requested. A daily cron requests the page at 07:15 UTC so a quiet day still moves. If McDowell or Launch Library is down, those sections keep the copy in `src/data/stats.ts`. Ground tracks keep the saved CelesTrak sample. The prospectus figures, the coverage line, and the Direct to Cell list stay in that file. Those sources are not a feed.

```bash
npm install
npm run dev
```
