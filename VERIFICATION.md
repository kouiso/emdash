# Verification — 2026-10-25 UTC

Implementation: `8ba5abd61dbcf8c252e1bbee16303aa36b8cd6b0`.

## Passed locally

- Official EmDash 1.3.1 starter source retained with MIT notice.
- EmDash / Cloudflare adapter both pinned to 1.3.1; npm lock committed.
- `npm run build` / Worker minification completed.
- `wrangler types` and `npm run typecheck`: 0 errors, 0 warnings.
- `wrangler deploy --dry-run` validated the official build and dedicated bindings.
- Final minified Worker: `/` HTTP 200; `/_emdash/admin` redirects to setup,
  which returns HTTP 200.
- Chromium + Playwright: setup page rendered, title `EmDash Admin`, heading
  `Set up your site`, no JavaScript page errors. No setup form was submitted.
- Unauthenticated `/_emdash/api/content/posts`: HTTP 401 / NOT_AUTHENTICATED.
- Public source secret-pattern scan: no matching credentials or private keys.
- Local Git tree matched the GitHub tree; no task-app files were used or changed.

## Cloudflare resources created

- Worker candidate `emdash-trial-20261021`: **not created / not deployed**.
- D1 `emdash-trial-20261021-db`: `a4b9eeef-6a0e-4fb5-9261-bb58a4286214`.
- R2 `emdash-trial-20261021-media`.
- SESSION KV `emdash-trial-20261021-session`: `12fbffdd4ec5416999785817007ee354`.

Existing resources were not changed. No paid subscription, Access, DNS, LOADER,
AI, mail service, new API token, or OAuth grant was added.

## Deployment blocker

The connected Cloudflare plugin can create the assets upload session, but the
asset upload request to
`POST /accounts/6e206506efda3871a2d6e81da38b4b0b/workers/assets/upload?base64=true`
with that short-lived upload JWT returned plain `Unauthorized`. Its HTTP status
was not captured because the response was not JSON. The session was still within
its validity period. The root cause is not established; it must not be treated as
a successful upload or deployment.

The plugin's documented `cloudflare.request` interface does not expose arbitrary
Authorization headers for this upload JWT. Local Wrangler is unauthenticated and
the environment's direct Cloudflare API network request is denied with HTTP 403.
No new authentication or alternate hosting route was attempted after the failure.

An attempted new upload-session creation for state reconciliation was denied by
automatic approval review as a prohibited retry. It was not repeated.

All 85 temporary `deploy-*` KV staging keys were deleted; listing this prefix
returned zero remaining keys. The dedicated empty resources above remain for a
later authorized deployment.

## Pending acceptance

- Successful Worker deployment and public HTTP / browser verification.
- Owner completes standard setup and passkey registration, then logs in again.
- Owner saves a synthetic draft and `fixtures/trial.png`, reloads, and verifies
  both persist. No administrator, proxy passkey, or permanent credential was made.
