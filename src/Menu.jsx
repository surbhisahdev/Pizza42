import { useState } from 'react';
import { CATEGORIES, MENU } from './menu.js';
import { useCart } from './CartContext.jsx';
import ToppingsModal from './ToppingsModal.jsx';

export default function Menu() {
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const [added, setAdded] = useState('');
  const { add, count, subtotal } = useCart();
  const items = category === 'All' ? MENU : MENU.filter((m) => m.category === category);

  return (
    <section id="menu" className="menu">
      <h2>Our Menu</h2>
      <p className="menu-sub">Browse freely. Log in to place an order.</p>

      <div className="tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`tab ${c === category ? 'on' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid">
        {items.map((m) => (
          <article
            key={m.id}
            className="card"
            role="button"
            tabIndex={0}
            onClick={() => setSelected(m)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(m)}
          >
            <div className="emoji">{m.emoji}</div>
            <h3>{m.name}</h3>
            <p>{m.desc}</p>
            <div className="price">${m.price.toFixed(2)}</div>
            <div className="cta-hint">Customize →</div>
          </article>
        ))}
      </div>

      {count > 0 && (
        <a className="toast" href="#/cart">
          🛒 {count} item(s) · ${subtotal.toFixed(2)} · View cart
          {added && <span className="added"> — added {added}</span>}
        </a>
      )}

      {selected && (
        <ToppingsModal
          item={selected}
          onClose={() => setSelected(null)}
          onAdd={(line) => {
            add(line);
            setAdded(line.name);
            setSelected(null);
          }}
        />
      )}
    </section>
  );
}
