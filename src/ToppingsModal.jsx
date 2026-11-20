import { useEffect, useState } from 'react';
import { DEFAULT_TOPPINGS, SIZES, TOPPINGS } from './menu.js';

export default function ToppingsModal({ item, onClose, onAdd }) {
  const isPizza = item.category === 'Pizzas';
  const defaults = DEFAULT_TOPPINGS[item.id] || [];
  const [size, setSize] = useState('M');
  const [selected, setSelected] = useState(new Set(defaults));
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  // Close on Escape; lock background scroll while open
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // Default toppings are included in the base price; only extras are charged.
  const extras = TOPPINGS.filter((t) => selected.has(t.id) && !defaults.includes(t.id));
  const removed = defaults.filter((d) => !selected.has(d));
  const sizeExtra = isPizza ? SIZES.find((s) => s.id === size).extra : 0;
  const unit = item.price + sizeExtra + extras.reduce((sum, t) => sum + t.price, 0);
  const total = unit * qty;

  const add = () =>
    onAdd({
      itemId: item.id,
      name: item.name,
      size: isPizza ? size : null,
      toppings: isPizza ? [...selected] : [],
      removed,
      note,
      qty,
      total,
    });

  return (
    <div className="backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="x" onClick={onClose} aria-label="Close">×</button>
        <div className="m-head">
          <span className="emoji">{item.emoji}</span>
          <div>
            <h3 id="modal-title">{item.name}</h3>
            <p>{item.desc}</p>
          </div>
        </div>

        {isPizza && (
          <>
            <h4>Size</h4>
            <div className="chips">
              {SIZES.map((s) => (
                <button key={s.id} className={`chip ${size === s.id ? 'on' : ''}`} onClick={() => setSize(s.id)}>
                  {s.label}
                </button>
              ))}
            </div>

            <h4>Toppings <small>(tap to add or remove)</small></h4>
            <div className="tgrid">
              {TOPPINGS.map((t) => {
                const isDefault = defaults.includes(t.id);
                return (
                  <label key={t.id} className={`top ${selected.has(t.id) ? 'on' : ''}`}>
                    <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
                    <span>{t.emoji} {t.label}</span>
                    <em>{isDefault ? 'included' : `+$${t.price.toFixed(2)}`}</em>
                  </label>
                );
              })}
            </div>
          </>
        )}

        <h4>Special instructions</h4>
        <textarea
          rows={2}
          maxLength={140}
          placeholder="e.g. well done, cut in squares"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="m-foot">
          <div className="qty">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Increase">+</button>
          </div>
          <button className="add" onClick={add}>Add to order · ${total.toFixed(2)}</button>
        </div>
      </div>
    </div>
  );
}
