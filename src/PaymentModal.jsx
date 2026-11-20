import { useState } from 'react';

// Demo-only: card details are validated in the browser and never stored or sent anywhere.
// In production, use a PCI-compliant provider (e.g. Stripe Elements) instead of raw inputs.

const luhn = (num) => {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
};

const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
const fmtExp = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

// Module-level so its identity is stable across renders (otherwise inputs lose focus per keystroke).
function Field({ k, label, f, errors, set, ...rest }) {
  return (
    <label className={`fld ${errors[k] ? 'bad' : ''}`}>
      <span>{label}</span>
      <input value={f[k]} onChange={set(k)} {...rest} />
      {errors[k] && <em>{errors[k]}</em>}
    </label>
  );
}

export default function PaymentModal({ total, onClose, onConfirm }) {
  const [f, setF] = useState({
    name: '', line1: '', line2: '', city: '', state: '', zip: '',
    card: '', exp: '', cvc: '',
  });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = 'Required';
    if (!f.line1.trim()) e.line1 = 'Required';
    if (!f.city.trim()) e.city = 'Required';
    if (!f.state.trim()) e.state = 'Required';
    if (!/^\d{5}(-\d{4})?$/.test(f.zip.trim())) e.zip = 'Enter a valid ZIP';
    const digits = f.card.replace(/\s/g, '');
    if (digits.length < 13 || !luhn(digits)) e.card = 'Enter a valid card number';
    const m = /^(\d{2})\/(\d{2})$/.exec(f.exp);
    const now = new Date();
    const expOk =
      m && Number(m[1]) >= 1 && Number(m[1]) <= 12 &&
      new Date(2000 + Number(m[2]), Number(m[1]), 0, 23, 59) >= now;
    if (!expOk) e.exp = 'Invalid or expired';
    if (!/^\d{3,4}$/.test(f.cvc)) e.cvc = '3–4 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const { card, exp, cvc, ...address } = f; // card data stays in this component
    onConfirm({ address, last4: card.replace(/\s/g, '').slice(-4) });
  };

  const fp = { f, errors, set };

  return (
    <div className="backdrop">
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="pay-title" onSubmit={submit} noValidate>
        <h3 id="pay-title">Delivery &amp; payment</h3>
        <p className="muted">You're verified with MFA. Enter your details to finish.</p>

        <h4>Delivery address</h4>
        <Field {...fp} k="name" label="Full name" autoComplete="name" />
        <Field {...fp} k="line1" label="Address" autoComplete="address-line1" />
        <Field {...fp} k="line2" label="Apt, suite (optional)" autoComplete="address-line2" />
        <div className="row3">
          <Field {...fp} k="city" label="City" autoComplete="address-level2" />
          <Field {...fp} k="state" label="State" autoComplete="address-level1" maxLength={20} />
          <Field {...fp} k="zip" label="ZIP" autoComplete="postal-code" inputMode="numeric" />
        </div>

        <h4>Payment</h4>
        <label className={`fld ${errors.card ? 'bad' : ''}`}>
          <span>Card number</span>
          <input
            value={f.card}
            onChange={(e) => setF((s) => ({ ...s, card: fmtCard(e.target.value) }))}
            autoComplete="cc-number" inputMode="numeric" placeholder="4242 4242 4242 4242"
          />
          {errors.card && <em>{errors.card}</em>}
        </label>
        <div className="row2">
          <label className={`fld ${errors.exp ? 'bad' : ''}`}>
            <span>Expiry (MM/YY)</span>
            <input
              value={f.exp}
              onChange={(e) => setF((s) => ({ ...s, exp: fmtExp(e.target.value) }))}
              autoComplete="cc-exp" inputMode="numeric" placeholder="08/29"
            />
            {errors.exp && <em>{errors.exp}</em>}
          </label>
          <label className={`fld ${errors.cvc ? 'bad' : ''}`}>
            <span>CVC</span>
            <input
              value={f.cvc}
              onChange={(e) => setF((s) => ({ ...s, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              autoComplete="cc-csc" inputMode="numeric" type="password"
            />
            {errors.cvc && <em>{errors.cvc}</em>}
          </label>
        </div>

        <div className="m-foot">
          <button type="button" className="clear dark" onClick={onClose}>Cancel</button>
          <button type="submit" className="add">Pay ${total.toFixed(2)}</button>
        </div>
      </form>
    </div>
  );
}
