# Deploy the combined Appwrite Function

The frontend and Express API remain in one Appwrite Function. The function serves
`frontend/dist` and same-origin `/api` requests. MongoDB and existing image storage
remain as configured. No second frontend or backend deployment is introduced.

## Payment behaviour preserved

Clicking **Place Order** synchronously opens `/order-processing` in a new tab.
After `/api/checkout/create` succeeds, that same tab navigates to `/orders/<id>`
for the existing manual-UPI payment screen. The original tab returns home only
when the payment tab is still available. If the popup is blocked or closed, the
original checkout stays open with a new-tab payment link and disables another
submission. Failed orders keep the cart and display an error.

The UPI QR, UTR submission, payment screenshot and manual verification routes are
retained. No payment-provider migration is part of this change.

## Build and rollout

1. Review and merge the performance branch when ready. Keep the previous Appwrite
   deployment available for rollback. Do not activate a new deployment before its
   build finishes successfully.
2. Keep the function root at the repository root and the entrypoint at
   `backend/src/appwrite-entry.js`. Keep the existing Node 22 runtime.
3. Use `npm run build` as the build command. It installs from both lockfiles,
   builds `frontend/dist`, and installs production backend dependencies. The
   function serves that directory directly; the redundant root `dist` copy is
   removed. Do not change the entrypoint to the persistent `server.js` script.
4. Keep `NODE_ENV=production`, `MONGODB_URI`, `JWT_ACCESS_SECRET`,
   `JWT_REFRESH_SECRET`, existing email/payment variables and `APP_URL` on the
   function. Leave `VITE_API_URL` unset for same-origin `/api`.
   The checked-in `appwrite.json` contains a placeholder project ID: it is not a
   record of the live console configuration. Existing R2 environment names read
   by the backend are `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`,
   `R2_BUCKET_NAME`, and `R2_PUBLIC_URL`; preserve working console values.
5. Optional adapter settings: `PROXY_TIMEOUT_MS` defaults to 25000 (bounded to
   1000–120000); `PROXY_MAX_RESPONSE_BYTES` defaults to 10 MiB. These limit the
   internal response request, not the database connection stage. Keep them below
   applicable function/platform limits and tune only after measuring real uploads
   and exports. Database selection retains its existing 10-second timeout.
6. The default Express trusted proxy is loopback. Appwrite's adapter replaces
   caller-supplied `X-Forwarded-For` with validated `x-appwrite-client-ip` metadata.
   Verify distinct client IPs in staging before relying on per-IP rate limits.
   `TRUST_PROXY` can specify another trusted subnet for other deployment modes;
   avoid trusting arbitrary proxy chains.
7. Review existing MongoDB indexes before building the new compound product
   indexes in a controlled maintenance window. `backend/database/createIndexes.js`
   now uses the product schema for text-index definitions. If a legacy text index
   differs, plan its replacement separately; this script deliberately does not
   drop live indexes automatically. Run `node backend/database/createIndexes.js`
   from a trusted environment with `MONGODB_URI` set after reviewing indexes.
8. Activate the tested deployment and run the checks below through the actual
   Appwrite function domain. Restore the previous deployment if regressions occur.

## Checks before accepting the deployment

- Open `/`, `/products`, `/checkout`, `/order-processing`, and an existing order
  deep link. HTML must revalidate; missing JS files must return 404, not SPA HTML.
- Request a hashed JS asset with Brotli, gzip and identity encoding. Confirm the
  browser decodes it correctly, MIME type remains JavaScript, and `Vary` includes
  `Accept-Encoding`. Only hashed assets get one-year immutable caching. Check
  Appwrite's final response headers, not just the local Express response.
- Request a public product list twice: the warm instance may report `X-Cache: HIT`.
  Account, wishlist, cart, orders and authentication must not use the public cache.
- Test database unavailability in a non-production test environment: HTML/assets
  and `/api/health` still work; database-dependent requests return 503 on initial
  connection failure. `/api/health` is liveness, not database readiness.
- Place a test order with popups allowed; verify one payment tab, correct order ID,
  amount and QR. Repeat with popups blocked, then use the visible manual link.
  Test a failed order request and rapid repeated clicks. Verify payment screenshot
  upload and UTR submission using test data. Do not perform a real payment for QA.
- Test expired sessions in both the original tab and payment tab. Both access and
  rotated refresh tokens must be saved. Web Locks coordinate refresh across tabs
  where supported; browsers without Web Locks only coalesce within each tab.
- Verify guest custom-product image upload and authenticated payment screenshots.
  Customer uploads are capped at 5 MiB, one file and two fields, 40 megapixels
  decoded, and ten uploads/minute/IP/instance. Decoded images are converted to WebP;
  invalid content and unsupported formats no longer fall back to public originals.
- Compare cold/warm TTFB, mobile LCP, product API p50/p95, error rates and MongoDB
  query plans against the preceding deployment. No live speedup is guaranteed.

## Automated validation

```sh
npm ci --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
npm ci --prefix backend
# Use local test secrets, never production secrets, for this command.
JWT_ACCESS_SECRET=test-access JWT_REFRESH_SECRET=test-refresh npm test --prefix backend
```

Frontend tests exercise payment tab opening before the request, success routing,
blocked-popup recovery, duplicate-click prevention, failure handling and token
refresh. Backend tests cover adapter DB independence/deadlines, gzip/Brotli and
conditional responses, cache isolation/eviction/invalidation, payment-slot
exhaustion and image validation.

In the implementation workspace, 6 frontend and 22 backend tests passed. The
existing 4 wishlist integration tests could not run: the local MongoDB test
process exited with `open: Operation not permitted`. Run the full suite in CI or
an environment that supports MongoDB. A real-browser run was also unavailable
because Chromium was absent and its download failed; payment tests use React in
jsdom with mocked API/window responses. Live Appwrite/UPI checks remain required.

With identical production settings, removing manual library chunks reduced JS
referenced by initial HTML from 575,216 to 246,244 bytes (57.2%); their prebuilt
Brotli payloads fell from 150,480 to 68,563 bytes (54.4%). This measures initial
HTML entry/preload assets, excludes subsequently loaded routes/3D animation, and
is not a measured live-page load-time improvement.

## Remaining scaling work

The cache is bounded to 200 entries/4 MiB per instance, with a 30-second server
TTL. Successful catalogue writes invalidate that instance only; public browser
cache policies can retain data longer. Rate limits are also per-instance. Shared
invalidation and distributed abuse counters need additional persistence work.

Payment-amount allocation now uses one bounded query instead of an unbounded
loop. It retains existing fractional-amount semantics. It does **not** guarantee
uniqueness between concurrent checkouts. The frontend click guard is **not**
server-side idempotency. Database-enforced payment allocation, idempotent checkout,
transactional cart/order writes and inventory reservation need a separately tested
migration against the actual MongoDB topology and current order data. This change
does not claim to solve those remaining integrity risks.

Responsive image variants, earlier hero-image discovery and shared catalogue
caching remain follow-up optimizations; the existing storage/provider is retained.
