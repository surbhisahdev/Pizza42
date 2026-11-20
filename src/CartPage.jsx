import { useAuth0 } from '@auth0/auth0-react';
import { useCart } from './CartContext.jsx';
import { SIZES, TOPPINGS } from './menu.js';

const label = (id) => TOPPINGS.find((t) => t.id === id)?.label || id;

export default function CartPage() {
  const { lines, subtotal, setQty, remove, clear } = useCart();
  const { isAuthenticated, loginWithRedirect } = useAuth0();

  if (lines.length === 0) {
    return (
      <section className="cart-page empty">
        <h2>Your cart is empty</h2>
        <p>Pick something delicious from the menu.</p>
        <a className="add as-link" href="#menu" onClick={() => (window.location.hash = '#/')}>
          Browse the menu
        </a>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <h2>Your cart</h2>

      <ul className="lines">
        {lines.map((l) => (
          <li key={l.lineId} className="line">
            <div className="line-main">
              <h3>{l.name}</h3>
              {l.size && (
                <div className="meta">Size: {SIZES.find((s) => s.id === l.size)?.label}</div>
              )}
              {l.toppings.length > 0 && (
                <div className="meta">Toppings: {l.toppings.map(label).join(', ')}</div>
              )}
              {l.removed.length > 0 && (
                <div className="meta">No: {l.removed.map(label).join(', ')}</div>
              )}
              {l.note && <div className="meta">Note: “{l.note}”</div>}
            </div>

            <div className="qty">
              <button onClick={() => (l.qty > 1 ? setQty(l.lineId, l.qty - 1) : remove(l.lineId))} aria-label="Decrease">−</button>
              <span>{l.qty}</span>
              <button onClick={() => setQty(l.lineId, Math.min(20, l.qty + 1))} aria-label="Increase">+</button>
            </div>

            <div className="line-total">${l.total.toFixed(2)}</div>
            <button className="rm" onClick={() => remove(l.lineId)} aria-label={`Remove ${l.name}`}>×</button>
          </li>
        ))}
      </ul>

      <div className="summary">
        <div className="sum-row"><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
        <button className="clear" onClick={clear}>Clear cart</button>

        {isAuthenticated ? (
          <a className="add as-link block" href="#/checkout">Place order</a>
        ) : (
          <button
            className="add"
            onClick={() => loginWithRedirect({ appState: { returnTo: '#/checkout' } })}
          >
            Log in to check out
          </button>
        )}
      </div>
    </section>
  );
}
