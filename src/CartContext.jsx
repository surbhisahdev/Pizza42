import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const KEY = 'pizza42.cart';

// The cart lives only in this browser tab (sessionStorage). It is NOT stored in Auth0.
function load() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState(load);

  useEffect(() => {
    sessionStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines]);

  const value = useMemo(() => {
    const unitOf = (l) => l.total / l.qty;
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((sum, l) => sum + l.total, 0),
      add: (line) => setLines((ls) => [...ls, { ...line, lineId: crypto.randomUUID() }]),
      remove: (lineId) => setLines((ls) => ls.filter((l) => l.lineId !== lineId)),
      setQty: (lineId, qty) =>
        setLines((ls) =>
          ls.map((l) =>
            l.lineId === lineId ? { ...l, qty, total: unitOf(l) * qty } : l
          )
        ),
      clear: () => setLines([]),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
