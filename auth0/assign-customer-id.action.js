/**
 * Trigger: Login / Post Login   (Actions > Triggers > post-login)
 * Name suggestion: "Assign customer id"
 * Put it anywhere in the flow (e.g. right after "Enrich tokens").
 *
 * Architecture integrity: orders/transactions live in Pizza 42's own database, NOT in the
 * Auth0 user profile. Auth0 only stores a stable pointer, app_metadata.pizza42_customer_id,
 * which is generated once and then delivered to the app (ID token) and API (access token)
 * as a namespaced claim.
 *
 * Secret (optional): NAMESPACE, same value as in "Enrich tokens" (default https://pizza42.com/).
 */
const { randomUUID } = require('crypto');

exports.onExecutePostLogin = async (event, api) => {
  let ns = event.secrets.NAMESPACE || 'https://pizza42.com/';
  if (!ns.endsWith('/')) ns += '/';

  let customerId = event.user.app_metadata?.pizza42_customer_id;
  if (!customerId) {
    customerId = `p42_${randomUUID()}`;
    api.user.setAppMetadata('pizza42_customer_id', customerId); // persisted for next logins
  }

  // Use the value directly (event.user isn't refreshed within this same run).
  api.idToken.setCustomClaim(`${ns}pizza42_customer_id`, customerId);
  api.accessToken.setCustomClaim(`${ns}pizza42_customer_id`, customerId);
};
