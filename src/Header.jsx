import { useAuth0 } from '@auth0/auth0-react';
import { useCart } from './CartContext.jsx';

// Must match the NAMESPACE secret in the "Enrich tokens" Action (trailing slash optional).
const rawNs = import.meta.env.VITE_AUTH0_CLAIM_NAMESPACE || 'https://pizza42.com/';
const NS = rawNs.endsWith('/') ? rawNs : `${rawNs}/`;

// Prefer first/last name from the ID token custom claims; fall back to name, then email.
function displayName(user) {
  const first = user?.[`${NS}firstName`];
  const last = user?.[`${NS}lastName`];
  return [first, last].filter(Boolean).join(' ') || user?.name || user?.email || '';
}

// Shared top bar: logo, cart (top right), login/signup or user + logout.
export default function Header() {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
  const { count } = useCart();

  // Both calls hit https://<custom-domain>/authorize; signup just adds screen_hint=signup.
  const login = () => loginWithRedirect();
  const signup = () =>
    loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });

  return (
    <header className="nav">
      <a className="logo" href="#/">🍕 Pizza 42</a>
      <nav>
        {isAuthenticated ? (
          <>
            <span className="who">Hi, {displayName(user)}</span>
            <button
              className="link"
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <button className="link" onClick={login}>Log in</button>
            <button className="link cta" onClick={signup}>Sign up</button>
          </>
        )}
        <a className="link cart-link" href="#/cart" aria-label={`Cart, ${count} items`}>
          🛒 Cart
          {count > 0 && <span className="badge">{count}</span>}
        </a>
      </nav>
    </header>
  );
}
