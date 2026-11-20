/**
 * Trigger: Login / Post Login   (Actions > Triggers > post-login)
 * Name suggestion: "Step-up MFA for checkout"
 *
 * The SPA asks for step-up by sending  acr_values=http://schemas.openid.net/pape/policies/2007/06/multi-factor
 * on /authorize. A normal login never sends it, so regular sign-ins are NOT challenged.
 * Because the Auth0 session already exists, the user only sees the MFA prompt, not the
 * password/passkey screen again.
 *
 * Prereq: enable at least one factor in Dashboard > Security > Multi-factor Auth
 * (e.g. One-time Password and/or WebAuthn). Leave the MFA *policy* on "Never" so
 * this Action is the only thing that triggers MFA.
 */
const MFA_ACR = 'http://schemas.openid.net/pape/policies/2007/06/multi-factor';

// Factor types must be enabled in the tenant, otherwise they are ignored.
const FACTORS = [
  { type: 'otp' },
  { type: 'webauthn-roaming' },
  { type: 'webauthn-platform' },
];

exports.onExecutePostLogin = async (event, api) => {
  const requested = event.transaction?.acr_values ?? [];
  if (!requested.includes(MFA_ACR)) return; // not a step-up request

  // Already did MFA in this session (e.g. at signup)? Don't ask again. `amr` can be missing
  // from the token in that case, so state it explicitly for the SPA.
  const alreadyMfa = (event.authentication?.methods ?? []).some((m) => m.name === 'mfa');
  if (alreadyMfa) {
    api.idToken.setCustomClaim('https://pizza42.com/mfa_done', true);
    return;
  }

  const enrolled = (event.user.enrolledFactors ?? []).length > 0;
  if (enrolled) {
    api.authentication.challengeWithAny(FACTORS);
  } else {
    // First time: let the user enroll a factor, then challenge happens as part of it.
    api.authentication.enrollWithAny(FACTORS);
  }
};

/**
 * Optional: if the user returns from MFA, Auth0 adds "mfa" to the `amr` claim of the
 * ID token. The SPA checks that claim and the API should check it too (access token
 * `amr`, or a custom claim) before accepting the order. Don't rely on the UI alone.
 */
