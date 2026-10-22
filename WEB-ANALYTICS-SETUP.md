# SWOS visitor analytics

The SWOS Studio production build includes Vercel Web Analytics for all generated HTML pages. No external analytics product, cookie banner, npm package or game data change is introduced by this integration.

## Owner step required
Vercel Web Analytics MUST also be enabled for the existing Vercel project in the Vercel dashboard. This connector cannot activate that account-level service.

1. Open https://vercel.com/premier-league-predictions/swos-editor/analytics (or select the project in Vercel, then Analytics).
2. Click **Enable** for standard **Web Analytics** if offered. Check the Vercel pricing/plan prompt before accepting paid options; standard analytics is available on Hobby and other plans. **Web Analytics Plus is not required.**
3. After enabling, redeploy the production branch so Vercel creates analytics ingestion routes. The tracked HTML code was already committed; a fresh Vercel deployment is needed after enabling, even if a prior code deployment was READY.
4. Visit the live site once in a normal browser, then see the Analytics panel. Statistics start from activation; **historical visitors cannot be reconstructed**.

## Implementation and safety
- Build: scripts/build-web-analytics.mjs runs after all website and game-test generation; it injects one official plain-HTML bootstrap and `/_vercel/insights/script.js` into each generated HTML page in `dist/`.
- Regression: scripts/test-web-analytics.mjs verifies exactly one snippet on each page, untouched source editor, and locked direct game installer.
- This does not instrument offline Magic DOSBox or original SWOS data. It only counts pages loaded from the hosted website.
- Reporting: Vercel Analytics dashboard displays pageviews, visitors, countries, pages, devices and referral sources when data is available. Read-only Vercel Analytics API can be queried from ChatGPT after activation.
- Vercel may record only from the point of activation. It cannot retroactively count past visits; automated tests, ad blockers and privacy settings can affect recorded figures.
- This is Vercel's privacy-oriented, cookie-free anonymised visitor analytics; do not add invasive individual identification.

Vercel docs:
- https://vercel.com/docs/analytics/quickstart
- https://vercel.com/docs/analytics/using-web-analytics
