/**
 * Trigger: Login / Post Login   (Actions > Triggers > post-login)
 * Name suggestion: "MFA for password logins"
 *
 * Policy:
 *   - Logged in with a PASSKEY       -> skip MFA (a passkey is already phishing-resistant
 *                                       and multi-factor: device possession + biometric/PIN).
 *   - Logged in with a PASSWORD      -> require MFA.
 *       * no factor enrolled yet     -> prompt to enroll (first signup / first login)
 *       * factor already enrolled    -> challenge it
 *   - Social login (e.g. Google)     -> skip (Google does its own MFA). Flip SOCIAL_NEEDS_MFA to change.
 *   - MFA already done this session  -> skip
 *
 * Prereqs:
 *   - Enable the factors below in Dashboard > Security > Multi-factor Auth.
 *   - Set the tenant MFA *policy* to "Never" so this Action is what decides.
 *
 * Works alongside "step-up-mfa.action.js": passkey users skip MFA at login, but are still
 * challenged when they reach checkout (that Action reacts to the step-up acr_values).
 * Put THIS Action first in the post-login flow, step-up second.
 */
const FACTORS = [
  { type: 'otp' },
  { type: 'webauthn-roaming' },
  { type: 'webauthn-platform' },
];

const SOCIAL_NEEDS_MFA = false;

exports.onExecutePostLogin = async (event, api) => {
  const methods = (event.authentication?.methods ?? []).map((m) => m.name);

  // 1. MFA already satisfied in this session
  if (methods.includes('mfa')) return;

  // 2. Passkey login: skip MFA
  if (methods.includes('passkey')) return;

  // 3. Social / enterprise federated login
  if (methods.includes('federated') && !SOCIAL_NEEDS_MFA) return;

  // 4. Password login (or anything else that isn't a passkey): require MFA
  const enrolled = (event.user.enrolledFactors ?? []).length > 0;
  if (enrolled) {
    api.authentication.challengeWithAny(FACTORS);
  } else {
    // First signup / first login: ask the user to set up MFA now.
    api.authentication.enrollWithAny(FACTORS);
  }
};
