import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { CartProvider } from './CartContext.jsx';
import Header from './Header.jsx';
import Welcome from './Welcome.jsx';
import Menu from './Menu.jsx';
import CartPage from './CartPage.jsx';
import CheckoutPage from './CheckoutPage.jsx';
import TokenPanel from './TokenPanel.jsx';

// Tiny hash router: "#/cart" shows the cart, anything else shows the home page.
const route = () => window.location.hash;
const isCart = () => route() === '#/cart';
const isCheckout = () => route() === '#/checkout';

export default function App() {
  const { isLoading, error } = useAuth0();
  const [view, setView] = useState(route());

  useEffect(() => {
    const onHash = () => {
      setView(route());
      if (isCart() || isCheckout()) window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (isLoading) return <div className="center">Loading…</div>;
  if (error) return <div className="center">Auth error: {error.message}</div>;

  return (
    <CartProvider>
      {view === '#/cart' || view === '#/checkout' ? (
        <div className="cart-shell">
          <Header />
          {view === '#/cart' ? <CartPage /> : <CheckoutPage />}
        </div>
      ) : (
        <>
          <Welcome />
          <Menu />
        </>
      )}
      <TokenPanel />
    </CartProvider>
  );
}
