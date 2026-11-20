// Pizza 42 order API (deliberately superficial: it proves the access-token check, nothing more).
//   POST /orders  -> requires a valid Auth0 access token (right issuer + audience + signature)
//                    AND the `write:orders` scope. Returns 200 with a fake order id.
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { auth, requiredScopes } from 'express-oauth2-jwt-bearer';

const DOMAIN = process.env.AUTH0_DOMAIN || 'yumm-pizzza.oktademo.cloud'; // custom domain = token issuer
const AUDIENCE = process.env.AUTH0_AUDIENCE || 'https://get-pizza42';
const ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
const NS = process.env.CLAIM_NAMESPACE || 'https://pizza42.com/';
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors({ origin: ORIGIN }));
app.use(express.json());

// Validates the JWT: signature (JWKS), iss, aud, exp. Rejects with 401 otherwise.
const checkJwt = auth({
  issuerBaseURL: `https://${DOMAIN}/`,
  audience: AUDIENCE,
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post(
  '/orders',
  checkJwt,
  requiredScopes('write:orders'), // 403 insufficient_scope if missing
  (req, res) => {
    const claims = req.auth.payload;
    res.json({
      status: 'success',
      orderId: randomUUID(),
      // Identifier comes from the token (set by the Auth0 Action), never from the request body.
      customerId: claims[`${NS}pizza42_customer_id`] ?? null,
      sub: claims.sub,
      scope: claims.scope,
    });
  }
);

// Turn the library's auth errors into clean JSON (401 / 403).
app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({ error: err.code || 'server_error', message: err.message });
});

app.listen(PORT, () => console.log(`Pizza 42 API listening on http://localhost:${PORT}`));
