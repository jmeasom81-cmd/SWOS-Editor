# SWOS Studio - development handover

This is the permanent starting point for future development chats, particularly after older chats are deleted. Read this file, then inspect GitHub main and the actual Vercel production commit. Do not assume that earlier chat updates match the live deployment.

## Project links
- Source: https://github.com/jmeasom81-cmd/SWOS-Editor
- Live app: https://swos-editor.vercel.app
- 2026/27 Excel: https://swos-editor.vercel.app/downloads/SWOS_Master_2026-27.xlsx
- Squad and source audit: https://swos-editor.vercel.app/source-audit-2026-27.html
- Research worklist: https://swos-editor.vercel.app/research-queue.html
- Development progress: https://swos-editor.vercel.app/development-status.html (once deployed)

## User priorities
Make a stable browser-based SWOS/SWAS editor and a trustworthy 2026/27 English football update. Exactly 92 clubs across Premier League (20), Championship (24), League One (24), League Two (24); 16 players per club = 1,472 SWOS player slots. Essential player research: shirt number, position, nationality, valuation; plus correct club colours and eventually appropriate SWOS skills. Missing/unknown data must stand out. Maintain filterable Excel/CSV outputs. Do NOT spend time on ages or assists just to fill an arbitrary template. Never include the same club in two divisions.

## Build architecture
- GitHub main source index.html must NOT be replaced by generated dist/index.html.
- The ordered Node build/tests are in scripts/build-production.mjs. Vercel and GitHub Actions both invoke it and publish the generated dist folder.
- Versioned master research baseline: data/master-2026-27.json. scripts/build-master-tracker.mjs combines it with the researched team packs embedded in index.html.
- Kit research: data/kit-research-2026-27.json. A sourced jersey is NOT necessarily a fully sourced kit; shorts/socks need evidence.
- Squad and evidence audit: scripts/build-source-audit.mjs; the dedicated read-only research worklist: scripts/build-research-queue.mjs.
- Gameplay-model candidate: scripts/build-gameplay-rebuild.mjs. Skills remain *provisional gameplay profiles*, not verified scouting.
- Copy-only Magic DOSBox trial pack and independent checksum checker: scripts/build-test-pack.mjs. Direct installation is LOCKED.
- Permanent auto-generated progress dashboard: scripts/build-development-status.mjs and development-status-template.html. Regression test: scripts/test-development-status.mjs. Its counts come from the generated source audit (no hard-coded gap totals).

## Safety requirements
1. Preserve the existing SWOS player and career editors and all original game files. A generated candidate is a copy only, never an overwrite of source data.
2. A missing published market valuation stays null/unknown, never numeric zero. In-game placeholder values must be separately marked provisional.
3. An individual source URL does not by itself prove permanent 2026/27 squad membership. Distinguish official club source, independent season roster and match-sheet evidence, and keep discrepancies for manual review.
4. Do not silently change conflicting squad numbers, duplicate names or unconfirmed transfers.
5. Maintain exact division and club counts and the 16-player SWOS format.
6. Real Magic DOSBox testing and six in-game QA steps are required before any consideration of unlocking direct installation.
7. Production Vercel may lag GitHub main when quota or build failures occur; only claim deployment when the matching commit is READY.
8. Update checks/test assertions when a genuinely sourced change alters known counts; never weaken safety assertions merely to force a green build.

## Visitor analytics (pending Vercel dashboard activation)
- The production pipeline now injects Vercel's cookie-free Web Analytics script into every generated HTML page and tests that it is present once.
- Enable the standard **Web Analytics** feature in Vercel's SWOS project dashboard, then redeploy after enabling. This requires project-owner action; the available connector cannot toggle the project-level Analytics service.
- See WEB-ANALYTICS-SETUP.md for exact activation and verification instructions. Do not claim recorded visitors until the Vercel analytics API returns real counts.
- Historical visitors from before activation are not recoverable.

## November 2026 club dossiers
- Generated read-only `club-dossier.html` uses `dist/data/source-audit-2026-27.json` as its sole data source and displays all 92 clubs / 16 player slots each, per-player evidence, prioritised actions, kit evidence, CSV export, and a print/PDF layout. The page is linked from the editor, progress dashboard, and research worklist.
- This is not evidence that football research is fully current; linked sources still require review. No editor binary, career save, installation, or original TEAM data was changed.
- The dossier is built and regression tested during the ordinary production build, before Web Analytics injection.

## November 2026 real-game QA workspace
- Published `/game-qa.html` accepts the existing test ZIP or manifest, checks both ZIP TEAM hashes, verifies the chosen duplicate-game TEAM file by SHA-256 and binary league counts, and stores six user-observed Magic DOSBox checks locally per candidate SHA. It exports a report and never uploads any game file or unlocks installation.
- ZIP identity checks **do not** establish that the game runs, that a career can be saved, or that roster research is accurate. Only actual game observation can answer those questions. All manual checks remain unverified until performed by the user.
- Production build includes `scripts/test-game-qa.mjs` with negative tests for unsafe/invalid packs and incorrectly reported success.

## 10 November 2026 — verified home-kit components
- Three additional 2026/27 kits now have shorts and socks evidence: Arsenal, Fulham and Manchester City. 31 of 92 have complete home-kit colour evidence, 61 outstanding.
- Official manufacturer/club links and current-season independent corroboration are recorded in `data/kit-component-evidence-2026-11-10.json`. Distinct component sources are visible in the kit guide and CSV.
- SWOS palette approximations are not faithful reproductions; the original game TEAM files remain untouched.

## 10 November 2026 — additional verified 2026/27 kit components (batch B)
- Eight additional full home-kit references checked against 2026/27 club, manufacturer and independent release coverage: Manchester United, Everton, Bournemouth, Leeds, Sunderland, Brighton, Crystal Palace and Burnley.
- Home kits with sourced shorts and socks increased from 31 to **39 of 92**, leaving 53 without complete component evidence. Stored in `data/kit-component-evidence-2026-11-10-batch-b.json`; the kit guide and CSV use the existing source URL columns.
- Diagonal sashes, tonal patterns, hooped socks and multi-colour trim remain SWOS palette approximations; availability of an alternative kit colour does not replace the chosen standard home pairing.
- `scripts/test-kit-component-evidence-b.mjs` runs in production before the later full editor, checksum and installation-lock safety checks. No TEAM game files, careers or player lists were changed.

## 10 November 2026 — kit research batch C
- Completed eight further 2026/27 home-kit shorts/socks references from club product listings and season-specific kit coverage: Norwich, Charlton, Stoke, Leicester, Blackburn Rovers, QPR, Middlesbrough and Hull.
- Total sourced full home kit pairings now 47/92, leaving 45. Source URLs and SWOS approximations recorded in `data/kit-component-evidence-2026-11-10-batch-c.json`. Existing shorts values for Charlton and QPR were preserved.
- Regression tests for earlier batches now validate their own evidence while computing page totals from the live master, rather than requiring repeated hard-coded global totals.
- Hull's amber/black hooped socks are approximated with SWOS Orange (single colour); this is a limitation, not an assertion that the real socks are plain orange.
- No original SWOS files, game saves or direct-installer permissions have been modified.

## Next useful milestones
- Source-check remaining League One/League Two roster identities and missing player valuation evidence. Determine current outstanding totals from the latest audit rather than this prose.
- Validate 2026/27 shirt numbers and conflicting player identities without guesswork.
- Research the remaining kit components across all 92 clubs, tracking source URLs.
- Carry out and record the six Magic DOSBox copy-only game checks; do not assert game compatibility before actual testing.
- In a later stage, replace purely modelled skill profiles with researched/calibrated SWOS data.

## Workflow
Fetch latest HEAD, tree, source audit scripts, and Vercel production deployment. Build an isolated improvement with tests, commit to main, inspect GitHub Actions, then verify deployment SHA/state. Keep notes in the conversation and this handover as needed. The generated dashboard is the canonical numerical status.
