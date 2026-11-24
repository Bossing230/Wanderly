import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordInput from './PasswordInput.jsx';
import { errMsg } from '../services/api';

export default function ForgotPassword({ onBack, initialEmail = '' }) {
  const { forgotSendCode, forgotVerify, forgotReset } = useAuth();
  const [step, setStep] = useState('email'); // email -> code -> password
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async () => {
    setErr('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address');
    setBusy(true);
    try { await forgotSendCode(email.trim()); setStep('code'); setCooldown(60); }
    catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (step === 'email') return sendCode();
    setBusy(true);
    try {
      if (step === 'code') {
        if (!/^\d{6}$/.test(code)) { setErr('Enter the 6-digit code from your email'); return; }
        const r = await forgotVerify(email.trim(), code);
        setResetToken(r.resetToken); setStep('password');
      } else {
        if (pw.length < 8 || !/\d/.test(pw) || !/[A-Za-z]/.test(pw)) { setErr('Password needs 8+ characters with letters and numbers'); return; }
        if (pw !== confirm) { setErr('Passwords do not match'); return; }
        await forgotReset({ resetToken, newPassword: pw, confirmPassword: confirm }); // logs in, then the app opens the dashboard
      }
    } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };

  const back = () => { setErr(''); step === 'code' ? setStep('email') : onBack(); };
  const titles = { email: 'Forgot your password?', code: 'Check your email', password: 'Set a new password' };
  const subs = {
    email: 'Enter the email you signed up with and we will send you a code.',
    code: `If ${email} has an account, we sent a 6-digit code. It expires in 10 minutes.`,
    password: 'Choose a new password for your account.',
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm" noValidate>
      <button type="button" onClick={back} className="mb-4 flex items-center gap-1 text-sm font-medium text-muted hover:text-sea">
        <ArrowLeft size={16} /> {step === 'code' ? 'Change email' : 'Back to login'}
      </button>
      <h1 className="text-3xl font-bold">{titles[step]}</h1>
      <p className="mb-6 mt-1 text-muted">{subs[step]}</p>
      {err && <div className="mb-4 rounded-xl border border-coral/40 bg-coral/10 px-3 py-2 text-sm" role="alert">{err}</div>}

      {step === 'email' && (
        <div className="mb-6"><label className="label" htmlFor="fe">Email</label>
          <input id="fe" type="email" autoComplete="email" autoFocus className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      )}

      {step === 'code' && (
        <div className="mb-6">
          <label className="label" htmlFor="fc">Verification code</label>
          <input id="fc" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus
            className="input text-center font-display text-2xl tracking-[0.5em]"
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          <button type="button" onClick={sendCode} disabled={busy || cooldown > 0} className="mt-3 text-sm font-semibold text-sea disabled:text-muted">
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      )}

      {step === 'password' && (
        <>
          <div className="mb-4"><label className="label" htmlFor="np">New password</label>
            <PasswordInput id="np" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <p className="mt-1 text-xs text-muted">At least 8 characters, with letters and numbers.</p></div>
          <div className="mb-6"><label className="label" htmlFor="cp">Confirm new password</label>
            <PasswordInput id="cp" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {confirm && confirm !== pw && <p className="mt-1 text-xs text-coral">Passwords do not match yet.</p>}</div>
        </>
      )}

      <button className="btn-primary w-full" disabled={busy}>
        {busy ? 'Please wait…' : step === 'email' ? 'Send code' : step === 'code' ? 'Verify code' : 'Reset password and log in'}
      </button>
    </form>
  );
}