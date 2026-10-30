# K Young reviews

Shoppers' ratings and reviews for kaeyoung.com, written here by the site's `/api/reviews` route (one commit per
review or moderation change). Public on purpose: nothing about a reviewer is stored (no IP, no email). Only reviews
with `"status": "published"` reach the site, at the next daily build (`scripts/reviews-export.ts` on `main`).

Never merge this branch into `main`. It never deploys (`vercel.json` here).
