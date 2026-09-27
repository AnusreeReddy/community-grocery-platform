# Checkpoint Notes (backend + frontend integration complete, testing in progress)

This ZIP is exported mid-session, right before a clean-database final test
pass. Both backend and frontend have been reworked; below is the honest
state of what's verified vs. still pending.

## Backend (see previous checkpoint's notes for the original list; unchanged
since then except one small fix):
- `threshold/service.js`: `getCommunityBatches`'s delivery projection now
  also includes `driverPhone` (was missing from the `.select()`, minor
  completeness fix, not a bug that affected behavior).

All backend changes from the first checkpoint are intact: per-batch
threshold pooling, atomic stock reservation, real cutoff enforcement, batch
capacity caps, community access guards, shopkeeper approval workflow,
community-scoped products, validated order/delivery status transitions,
truck assignment, and the delivery-detail PII fix.

## Frontend (new since last checkpoint)

Rewritten to match the backend above:
- `services/authService.js` — added `getMe()`, `requestedRole` passthrough
- `services/communityService.js` — added `getBatches()`
- `services/productService.js` — list/search/filter now take optional
  `communityId`
- `services/deliveryService.js` — added `assignTruck()`
- `pages/Communities.jsx` — fixed a real bug: `window.location.reload()`
  after joining re-read the *stale cached* user from localStorage (since
  AuthContext only calls `/auth/me` when there's no cached user at all), so
  `user.community` never actually updated client-side until a fresh login.
  Now uses `setUser` + localStorage update directly from the join response.
- `pages/CommunityDetail.jsx` — fixed a second real bug: merge-suggestion
  rendering used `item.name`/`item._id`, but the service returns
  `{ community: {...}, sharedDays, combinedOrderValue, ... }` — suggestions
  never rendered correctly before. Same stale-reload issue fixed here too.
- `pages/Products.jsx` — gated behind community membership for customers;
  fetches community-scoped products; removed the duplicated shopkeeper
  "add inventory" form (now only in ShopkeeperPanel).
- `pages/Cart.jsx` — plain day `<select>` replaced with a batch-card
  selector: resolved date, cutoff status, pooled total/threshold progress
  bar, capacity, disabled once cutoff has passed.
- `pages/Dashboard.jsx` — single community-wide progress bar replaced with
  per-batch pooling progress (the real picture, since pooling is per batch
  not per community).
- `pages/Register.jsx` — shopkeeper self-registration checkbox with
  pending-approval messaging.
- `pages/ShopkeeperPanel.jsx` — approval-status banner, add-product form
  gated on approval, community-scoping checkboxes per product, inline stock
  editing, "check approval status" refresh button.
- `pages/AdminPanel.jsx` — fixed a real bug: delivery list load used
  `resp.deliveries` instead of `resp.data.deliveries` (axios wraps the body
  in `.data`), so the Deliveries tab always rendered empty and admins could
  never see/approve proposals through the UI. Added: shopkeeper-approval
  tab, truck-assignment UI, community-creation form, role-gated sections
  (`communityAdmin` vs `superAdmin`).
- `App.jsx` / `AppHeader.jsx` — `/admin` route widened to allow
  `communityAdmin` (previously `superAdmin`-only, which meant
  communityAdmin — a real role in the data model — had no usable UI at
  all); added a community-first banner for logged-in customers without a
  community.

## Testing status as of this checkpoint

- `vite build` succeeds cleanly.
- `eslint` was broken in the original project (missing devDependencies,
  and a deeper mismatch: `eslint.config.js` uses ESLint 9 flat-config
  helpers while `package.json` pins `eslint@^8.57.0`) — pre-existing, not
  caused by these changes, not yet fully resolved.
- Two rounds of scripted API-level end-to-end tests were run against a live
  local MongoDB + the real Express server (64 checks total across both
  rounds, all passing) covering shopkeeper approval, community-scoped
  products, join/leave rules, per-batch threshold pooling, stock
  reservation/oversell prevention/restore-on-cancel, real cutoff
  enforcement, batch capacity caps, the PII-leak fix, and status-transition
  validation.
- A **third** run (re-running `seed.js` against a database that already had
  a full turn's completed order history) produced 9 apparent "failures" —
  traced to the seed script's idempotency check (`status: "Pending"`) not
  matching orders that were now `Delivered`, so it created duplicate
  orders for an already-completed historical batch date. This is a
  test/seed-script artifact, not an application bug — the transition logic
  itself behaved correctly given the (corrupted) state each time. It
  surfaces a narrow latent issue worth noting: a `Delivery`'s `proposalKey`
  is not freed after reaching a terminal `Delivered` state, so if the exact
  same (community, day, calendar-date) triple were ever pooled again — only
  possible by artificially recreating historical orders — a new proposal
  could silently fail to be created. Not reachable through normal usage
  (dates always move forward), but documented for transparency.
- **Not yet done:** wiping the dev database and running one clean,
  unambiguous final end-to-end pass (this is the very next step, along with
  a full customer/admin/shopkeeper flow walkthrough against the rebuilt
  frontend).

## Recreating a working dev environment from this ZIP

1. `cd server && npm install`, create `.env` per `SETUP_GUIDE.md` pointing
   `MONGO_URI` at a MongoDB instance you control, `node scripts/seed.js`,
   `node server.js`.
2. `cd client && npm install && npm run dev` (or `npm run build` +
   `npm run preview`).
3. Demo accounts are printed by `seed.js`; see its console output.

Work will resume from this exact state: wipe DB → clean end-to-end run →
fix any genuine issues found → re-test → final report.
