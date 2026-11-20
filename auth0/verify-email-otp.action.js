/**
 * Trigger: Login / Post Login   (Actions > Triggers > post-login)
 * Name suggestion: "Verify email (OTP form) at checkout"
 *
 * Flow order in the post-login trigger (drag to arrange):
 *   1. mfa-for-password-logins   (existing)
 *   2. THIS Action               <- email OTP form first
 *   3. step-up-mfa               <- then MFA, before card/address are collected
 *
 * Runs only when the SPA starts a checkout login (acr_values contains the MFA ACR),
 * and only if the user's email is not verified yet. It renders the Auth0 Form
 * "Email OTP verification" (Forms > that form: Generate OTP & Send email -> Step -> Verify OTP & Update user).
 *
 * Setup:
 *   - Action secret  EMAIL_OTP_FORM_ID = the Form ID (ap_xxxxxxxx...) from Forms > your form > Render/Instructions.
 *   - The form's "Verify OTP & Update user" flow must set email_verified=true on the user
 *     (Auth0 Management API: Update user -> { email_verified: true }).
 *   - The form's last node is "Ending screen: Resume authentication flow".
 */
// Custom ACR (any string is allowed). Must match VERIFIED_EMAIL_ACR in src/CheckoutPage.jsx.
const EMAIL_ACR = 'urn:pizza42:acr:verified-email';

exports.onExecutePostLogin = async (event, api) => {
  const requested = event.transaction?.acr_values ?? [];
  if (!requested.includes(EMAIL_ACR)) return; // normal login: don't interrupt
  if (event.user.email_verified) return;          // already verified

  api.prompt.render(event.secrets.EMAIL_OTP_FORM_ID);
};

exports.onContinuePostLogin = async (event, api) => {
  // The form's flow updates the user via the Management API mid-login, so `event.user`
  // here is a stale pre-form snapshot (email_verified still false). Don't deny on it.
  // The form only resumes the flow after the OTP check succeeds, so mark the token
  // explicitly; the standard email_verified claim can lag on this first login.
  api.idToken.setCustomClaim('https://pizza42/email_verified', true);
};
