# Pizza 42: Auth0 CIAM Proof of Concept

A React SPA plus a small Express API that demonstrates a modern customer identity setup on Auth0:
passwordless login, social login, token enrichment, an email-verification gate, step-up MFA, a
scope-protected API, and an identifier-only user profile.

Sequence diagram of every flow: [docs/pizza42-flows.mmd](docs/pizza42-flows.mmd)
(Mermaid; import into Lucidchart via *Insert > Diagram as code > Mermaid*).

## Requirements coverage

| # | Requirement | How it is met | Where |
|---|-------------|---------------|-------|
| 1 | Baseline auth: signup/login, social + standard connection | Auth0 Universal Login (custom domain), Authorization Code + PKCE via `@auth0/auth0-react`. Database connection + Google. | `src/main.jsx`, `src/Header.jsx` |
| 2 | Frictionless login: Passkeys / WebAuthn | Passkeys enabled on the database connection. Passkey logins skip MFA at login (already multi-factor), but are still challenged at checkout. | `auth0/mfa-for-password-logins.action.js` |
| 3 | Data enrichment via Actions | Post-login Action adds namespaced claims (`firstName`, `lastName`, `email`) to the ID token. | "Enrich tokens" Action (tenant) |
| 4 | Email verification gate | Browsing is open. At checkout, an unverified user is sent to Auth0, which renders an Email OTP **Form**. Checkout stays blocked until verified. | `auth0/verify-email-otp.action.js`, `src/CheckoutPage.jsx` |
| 5 | API security: valid access token + `write:orders` scope | Express API validates the JWT (signature, issuer, audience, expiry) and requires `write:orders`. 401 / 403 otherwise. | `api/server.js` |
| 6 | Step-up authentication | Before address and card are collected, the SPA requests the multi-factor ACR and the Action challenges (or enrolls) a factor. Skipped if MFA was already done this session. | `auth0/step-up-mfa.action.js` |
| 7 | Architecture integrity | Only `app_metadata.pizza42_customer_id` is stored in Auth0. It is delivered to the app and API as a token claim. No order data in the profile. | `auth0/assign-customer-id.action.js` |

## Architecture

```
Browser (React SPA, :5173) --OIDC / PKCE--> Auth0 (custom domain yumm-pizzza.oktademo.cloud)
        |                                        |-- Pre-registration Action  (names -> user_metadata)
        |                                        |-- Post-login Actions (see below)
        |                                        |-- Forms + Flows (email OTP)
        |                                        '-- MFA (OTP / SMS / WebAuthn)
        '--Bearer access token (write:orders)--> Express API (:3001)  POST /orders
```

### Post-login Action order

Drag them in this order in *Actions > Triggers > post-login*:

1. **mfa prompt** (`mfa-for-password-logins.action.js`): login-time MFA policy. Passkey and Google logins skip it. Password logins are enrolled or challenged.
2. **Enrich tokens** (tenant only): marketing claims.
3. **Assign customer id** (`assign-customer-id.action.js`): creates `pizza42_customer_id` once, adds it to ID and access tokens.
4. **verify email** (`verify-email-otp.action.js`): renders the OTP form when the SPA sends ACR `urn:pizza42:acr:verified-email` and the email is unverified.
5. **stepup mfa** (`step-up-mfa.action.js`): challenges when the SPA sends the multi-factor ACR, unless MFA is already in the session.

Plus one Pre User Registration Action: `save-name-to-metadata.action.js`.

### Checkout gate (`src/CheckoutPage.jsx`)

On `#/checkout` the SPA reads the ID token claims and goes through, in order:

1. Not logged in: prompt to log in, cart is kept (sessionStorage).
2. Email not verified: redirect to `/authorize` with `acr_values=urn:pizza42:acr:verified-email` and the Email OTP form appears.
3. No MFA this session: redirect with `acr_values=http://schemas.openid.net/pape/policies/2007/06/multi-factor` and the MFA challenge appears.
4. Both pass: the address and card form is shown, then `POST /orders`.

Each redirect has its own sessionStorage guard flag to avoid loops. If the Action is not attached,
the user sees "We couldn't verify your identity" with a Try again button.
Email counts as verified if the standard `email_verified` claim is true **or** the custom claim
`https://pizza42/email_verified` is true (the form updates the user mid-login, so the standard claim
can be stale on that first token).
MFA counts as done if `amr` includes `mfa` **or** `https://pizza42.com/mfa_done` is true.

### Claims

| Claim | Token | Source |
|-------|-------|--------|
| `https://pizza42.com/firstName`, `lastName`, `email` | ID | Enrich tokens |
| `https://pizza42.com/pizza42_customer_id` | ID + access | Assign customer id (value in `app_metadata`) |
| `https://pizza42/email_verified` | ID | verify email, after the OTP form |
| `https://pizza42.com/mfa_done` | ID | stepup mfa, when MFA was already done |
| `amr`, `acr` | ID | Auth0 |

## Project layout

```
pizza42/
  src/                  React SPA (menu, cart, checkout, header, payment modal)
  api/                  Express order API (JWT + write:orders)
  auth0/                Action sources, Universal Login template, branding, push script
  docs/                 Mermaid sequence diagram
  .env.example          Frontend env template
```

## Running locally

Prereqs: Node 18+, an Auth0 tenant with a custom domain.

```bash
# 1. Frontend
cp .env.example .env        # fill in the three values below
npm install
npm run dev                 # http://localhost:5173

# 2. API (second terminal)
cd api
npm install
npm start                   # http://localhost:3001
```

### Frontend env (`.env`)

| Variable | Value |
|----------|-------|
| `VITE_AUTH0_DOMAIN` | Custom domain (e.g. `yumm-pizzza.oktademo.cloud`). Needed for passkeys and a consistent issuer. |
| `VITE_AUTH0_CLIENT_ID` | SPA application Client ID |
| `VITE_AUTH0_AUDIENCE` | API identifier, `https://get-pizza42` |
| `VITE_AUTH0_CLAIM_NAMESPACE` | Optional, defaults to `https://pizza42.com/` |
| `VITE_API_URL` | Optional, defaults to `http://localhost:3001` |

### API env (all optional, defaults match this tenant)

`AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `ALLOWED_ORIGIN` (CORS, default `http://localhost:5173`),
`CLAIM_NAMESPACE`, `PORT`.

## Auth0 tenant setup

1. **Application** (SPA): Allowed Callback URLs, Allowed Logout URLs and Allowed Web Origins all include `http://localhost:5173` (and the hosted URL when deployed).
2. **API**: identifier `https://get-pizza42`, with permission `write:orders`. Enable RBAC and "Add Permissions in the Access Token", or otherwise make sure the app is allowed to request the scope.
3. **Connections**: a database connection with passkeys enabled, plus Google.
4. **Custom domain** verified (required for page templates and passkeys).
5. **Multi-factor Auth**: enable the factors (OTP, and SMS/phone or WebAuthn) and set the tenant MFA policy to **Never**. The Actions decide when to prompt.
6. **Universal Login branding**: `auth0/push.sh` pushes `page-template.liquid` and `branding.json` (needs the Auth0 CLI and `jq`).
7. **Actions**: create each file in `auth0/` as an Action, **Deploy**, and attach it in the order above. Secrets:
   - `verify email`: `EMAIL_OTP_FORM_ID` (the `ap_...` ID of the Form).
   - `Assign customer id`: optional `NAMESPACE`.
8. **Form + Flows** "Email OTP verification": step 1 generates an OTP and emails it, a Step collects the code, step 2 verifies it and calls Management API *Update user* with `email_verified: true`, then ends with "Resume authentication flow".

## Testing the flows

| Scenario | Expected |
|----------|----------|
| Anonymous visitor | Menu and cart work. Checkout asks to log in. |
| New signup (password) | First/last name required. MFA enrollment appears. Customer ID assigned. |
| Checkout, email unverified | OTP form, then payment form. No second MFA if MFA was just done. |
| Checkout, passkey login | Passkey skipped MFA at login, so the checkout MFA challenge appears. |
| Pay | API returns an order id shown on the receipt. |
| `curl -i -X POST localhost:3001/orders` | 401 (no token). |
| Token without `write:orders` | 403 `insufficient_scope`. |

If the checkout failure screen appears, it prints the token's `amr`, `email_verified`, the custom
email claim and `acr`. This is a temporary debug aid (marked TEMP in `CheckoutPage.jsx`); remove it
before sharing the demo.

## Known gaps and trade-offs

- The API does not verify MFA server-side. A hardened version should add `amr`/`acr` to the access token and check them in `/orders`.
- Cart, payment form and card handling are demo-only. In production, use a PCI-compliant provider (e.g. Stripe Elements). Card data never leaves the browser in this demo.
- Orders are not persisted. The API returns a generated order id.
- No welcome email is configured. Auth0's built-in template could be enabled under *Branding > Email Templates*.
- The "Enrich tokens" Action does not yet add mocked marketing/segment attributes (for example a loyalty tier) as requirement 3 asks, and its `lastName` claim is overwritten by a duplicate `setCustomClaim` line. See the tenant copy.
- Tokens are kept in memory (`cacheLocation: memory`), so a page reload re-authenticates silently through the Auth0 session.
- The app is not hosted yet, and there is no git repository.
