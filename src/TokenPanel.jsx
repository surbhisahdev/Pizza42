import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

// Demo aid: shows the raw + decoded ID token and access token in a popup (bottom right).
// Decoding is client-side only; it does NOT verify signatures (the API does that).
const AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE || 'https://get-pizza42';

const decode = (jwt) => {
  try {
    const [h, p] = jwt.split('.');
    const json = (s) =>
      JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
    return { header: json(h), payload: json(p) };
  } catch {
    return null; // opaque (non-JWT) token
  }
};

function TokenView({ title, jwt, error }) {
  const [copied, setCopied] = useState(false);
  const decoded = jwt ? decode(jwt) : null;
  const copy = async () => {
    await navigator.clipboard.writeText(jwt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <section className="tp-sec">
      <h4>
        {title}
        {jwt && <button className="tp-copy" onClick={copy}>{copied ? 'Copied ✔' : 'Copy'}</button>}
      </h4>
      {error && <p className="tp-err">{error}</p>}
      {!jwt && !error && <p className="tp-muted">Loading…</p>}
      {jwt && (
        <>
          <label className="tp-lbl">Raw</label>
          <textarea readOnly value={jwt} rows={3} />
          <label className="tp-lbl">Decoded</label>
          <pre>{decoded ? JSON.stringify(decoded, null, 2) : '(opaque token, not a JWT)'}</pre>
        </>
      )}
    </section>
  );
}

export default function TokenPanel() {
  const { isAuthenticated, getIdTokenClaims, getAccessTokenSilently } = useAuth0();
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState({});

  if (!isAuthenticated) return null;

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    setTokens({});
    const t = {};
    try {
      t.id = (await getIdTokenClaims())?.__raw;
    } catch (e) {
      t.idError = e.message;
    }
    try {
      t.access = await getAccessTokenSilently({
        authorizationParams: { audience: AUDIENCE, scope: 'write:orders' },
      });
    } catch (e) {
      t.accessError = e.message;
    }
    setTokens(t);
  };

  return (
    <>
      <button className="tp-fab" onClick={toggle} aria-expanded={open}>
        🔑 Tokens
      </button>
      {open && (
        <div className="tp-pop" role="dialog" aria-label="Auth0 tokens">
          <div className="tp-head">
            <strong>Auth0 tokens</strong>
            <button className="tp-x" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>
          <div className="tp-body">
            <TokenView title="ID token" jwt={tokens.id} error={tokens.idError} />
            <TokenView title="Access token" jwt={tokens.access} error={tokens.accessError} />
          </div>
        </div>
      )}
    </>
  );
}
