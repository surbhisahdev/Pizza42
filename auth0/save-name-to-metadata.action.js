/**
 * Trigger: Pre User Registration  (Actions > Triggers > pre-user-registration)
 *
 * Copies the First/Last name typed into the custom signup-id partial
 * (inputs named "ulp-first-name" / "ulp-last-name") into user_metadata.
 *
 * Only runs for database (email + password / passkey) signups. Social signups
 * (Google) never see the partial; their names come from the Google profile.
 */
exports.onExecutePreUserRegistration = async (event, api) => {
  const body = event.request.body || {};

  // Uncomment once to see exactly which keys the signup form posts:
  // console.log('signup body keys:', Object.keys(body));

  const clean = (v) => (typeof v === 'string' ? v.trim().slice(0, 100) : '');
  const first = clean(body['ulp-first-name']);
  const last = clean(body['ulp-last-name']);

  // `required` in the partial is browser-only, so enforce it server-side too.
  if (!first || !last) {
    api.access.deny(
      'missing_name',
      'Please enter your first and last name.'
    );
    return;
  }

  api.user.setUserMetadata('first_name', first);
  api.user.setUserMetadata('last_name', last);
};
