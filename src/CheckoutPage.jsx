import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useCart } from './CartContext.jsx';
import PaymentModal from './PaymentModal.jsx';

// Asking for this ACR on /authorize is what makes the "Step-up MFA" Action challenge the user.
const MFA_ACR = 'http://schemas.openid.net/pape/policies/2007/06/multi-factor';
const AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE || 'https://get-pizza42';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// Triggers the "verify email" Action (OTP form) if the email isn't verified yet.
const VERIFIED_EMAIL_ACR = 'urn:pizza42:acr:verified-email';
// Guards against a redirect loop if the Action is missing / not attached.
const FLAG_EMAIL = 'pizza42.email.attempted';
const FLAG_MFA = 'pizza42.stepup.attempted';

export default function CheckoutPage() {
  const { isAuthenticated, isLoading, loginWithRedirect, getIdTokenClaims, getAccessTokenSilently } = useAuth0();
  const { lines, subtotal, clear } = useCart();
  const [status, setStatus] = useState('checking'); // checking | needs-login | stepup | failed | ready | done
  const [receipt, setReceipt] = useState(null);
  const [orderError, setOrderError] = useState(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setStatus('needs-login');
      return;
    }
    let cancelled = false;
    (async () => {
      // `user` from the SDK strips `amr`, so read the raw ID token claims.
      const claims = await getIdTokenClaims();
      if (cancelled) return;
      const emailVerified =
        claims?.email_verified === true || claims?.['https://pizza42/email_verified'] === true;
      // MFA counts if done in this session: either `amr` has it (challenged just now) or the
      // step-up Action flagged it because the session already had MFA.
      const mfaDone =
        (Array.isArray(claims?.amr) && claims.amr.includes('mfa')) ||
        claims?.['https://pizza42.com/mfa_done'] === true;

      // Two sequential redirects (one transaction can't reliably do OTP form + MFA):
      //   1. email not verified -> "verify email" Action renders the OTP form
      //   2. no fresh MFA       -> "step-up mfa" Action challenges
      // Only then are the address/card fields shown.
      const redirectFor = async (flag, acr) => {
        if (sessionStorage.getItem(flag)) {
          setStatus('failed');
          return;
        }
        sessionStorage.setItem(flag, '1');
        setStatus('stepup');
        await loginWithRedirect({
          authorizationParams: { acr_values: acr },
          appState: { returnTo: '#/checkout' },
        });
      };

      if (!emailVerified) {
        await redirectFor(FLAG_EMAIL, VERIFIED_EMAIL_ACR);
      } else if (!mfaDone) {
        sessionStorage.removeItem(FLAG_EMAIL);
        await redirectFor(FLAG_MFA, MFA_ACR);
      } else {
        sessionStorage.removeItem(FLAG_EMAIL);
        sessionStorage.removeItem(FLAG_MFA);
        setStatus('ready');
      }
    })();
    return () => { cancelled = true; };
  }, [isLoading, isAuthenticated, getIdTokenClaims, loginWithRedirect]);

  if (status === 'done') {
    return (
      <section className="cart-page empty">
        <h2>Order placed 🎉</h2>
        <p>
          Thanks! Order {receipt.orderId} confirmed by the API. Paid with card ending {receipt.last4}. Delivering to {receipt.address.line1},{' '}
          {receipt.address.city}.
        </p>
        <a className="add as-link" href="#/">Back to menu</a>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="cart-page empty">
        <h2>Your cart is empty</h2>
        <a className="add as-link" href="#/">Browse the menu</a>
      </section>
    );
  }

  if (status === 'needs-login') {
    return (
      <section className="cart-page empty">
        <h2>Log in to place your order</h2>
        <p>You need to be signed in to check out. Your cart will be waiting.</p>
        <button
          className="add as-link"
          onClick={() => loginWithRedirect({ appState: { returnTo: '#/checkout' } })}
        >
          Log in
        </button>
      </section>
    );
  }

  if (status === 'failed') {
    return (
      <section className="cart-page empty">
        <h2>We couldn't verify your identity</h2>
        <p>Email verification or extra verification (MFA) didn't complete. Please try again.</p>        <button
          className="add as-link"
          onClick={() => {
            [FLAG_EMAIL, FLAG_MFA].forEach((k) => sessionStorage.removeItem(k));
            window.location.reload();
          }}
        >
          Try again
        </button>
      </section>
    );
  }

  if (status !== 'ready') {
    return (
      <section className="cart-page empty">
        <h2>{status === 'stepup' ? 'Redirecting to verify your email & identity…' : 'Checking your session…'}</h2>
        <p>For your security, we confirm it's you before taking payment.</p>
      </section>
    );
  }

  return (
    <>
      <section className="cart-page">
        <h2>Checkout</h2>
        <p className="muted">Identity verified ✔ · {lines.length} line(s) · Total ${subtotal.toFixed(2)}</p>
      </section>
      <PaymentModal
        total={subtotal}
        onClose={() => (window.location.hash = '#/cart')}
        onConfirm={async (r) => {
          try {
            // Access token for the Pizza 42 API, carrying the write:orders scope.
            const token = await getAccessTokenSilently({
              authorizationParams: { audience: AUDIENCE, scope: 'write:orders' },
            });
            const res = await fetch(`${API_URL}/orders`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              // Only what the order needs; card data never leaves the browser in this demo.
              body: JSON.stringify({
                items: lines.map((l) => ({ lineId: l.lineId, qty: l.qty })),
                total: subtotal,
                address: r.address,
              }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.message || `Order failed (${res.status})`);
            setReceipt({ ...r, orderId: body.orderId });
            clear();
            setStatus('done');
          } catch (e) {
            setOrderError(e.message);
          }
        }}
      />
      {orderError && (
        <section className="cart-page">
          <p className="muted">⚠ {orderError}</p>
        </section>
      )}
    </>
  );
}
