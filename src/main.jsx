import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.jsx';
import './styles.css';

const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

createRoot(document.getElementById('root')).render(
  <Auth0Provider
    domain={import.meta.env.VITE_AUTH0_DOMAIN}
    clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin,
      // Request write:orders up front so the access token carries it. The API grants it
      // only if the user is allowed (API > Permissions + RBAC / "Add Permissions in the Access Token").
      ...(audience ? { audience, scope: 'openid profile email write:orders' } : {}),
    }}
    cacheLocation="memory"
    onRedirectCallback={(appState) => {
      // Strip ?code=&state= from the URL, then return to where the user was (e.g. #/cart)
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.hash = appState?.returnTo || '#/';
    }}
  >
    <App />
  </Auth0Provider>
);
