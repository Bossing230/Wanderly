import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import ForgotPassword from '../components/ForgotPassword.jsx';
import { errMsg } from '../services/api';

export default function Login() {
  const { login, sendSetupCode, verifySetup, needsSetup } = useAuth();
  const [signup, setSignup] = useState(false);       // false = log in, true = create account
  const [noAccounts, setNoAccounts] = useState(false); // true only on the very first visit
  const [open, setOpen] = useState(true);            // is registration open?
  const [forgot, setForgot] = useState(false);
  const [domains, setDomains] = useState(['gmail.com']);
  const [step, setStep] = useState('form');          // form -> code
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '', code: '' });
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    needsSetup().then((r) => {
      setNoAccounts(r.needsSetup); setSignup(r.needsSetup); setOpen(r.registrationOpen !== false);
      if (r.allowedDomains) setDomains(r.allowedDomains);
    }).catch(() => {});
  }, []); // eslint-disable-line
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const switchMode = (toSignup) => {
    setSignup(toSignup); setStep('form'); setErr(''); setInfo(''); setCooldown(0);
    setF((p) => ({ ...p, password: '', confirm: '', code: '' }));
  };

  const validate = () => {
    if (!f.name.trim()) return 'Enter your name';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return 'Enter a valid email address';
    if (!domains.includes(f.email.split('@')[1]?.toLowerCase())) return `Email must end with ${domains.map((d) => '@' + d).join(' or ')}`;
    if (f.password.length < 8 || !/\d/.test(f.password) || !/[A-Za-z]/.test(f.password)) return 'Password needs 8+ characters with letters and numbers';
    if (f.password !== f.confirm) return 'Passwords do not match';
    return '';
  };
  const payload = () => ({ name: f.name, email: f.email, password: f.password, confirmPassword: f.confirm });

  const sendCode = async () => {
    setErr(''); setInfo('');
    const bad = validate();
    if (bad) return setErr(bad);
    setBusy(true);
    try {
      await sendSetupCode(payload());
      setStep('code'); setCooldown(60);
      setInfo(`We sent a 6-digit code to ${f.email}. It expires in 10 minutes.`);
    } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!signup) {
      if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Enter a valid email address');
      setBusy(true);
      try { await login(f.email, f.password); } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
      return;
    }
    if (step === 'form') return sendCode();
    if (!/^\d{6}$/.test(f.code)) return setErr('Enter the 6-digit code from your email');
    setBusy(true);
    try { await verifySetup({ ...payload(), code: f.code }); } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };

  if (forgot) return <ForgotPassword initialEmail={f.email} onBack={() => setForgot(false)} />;

  const title = !signup ? 'Welcome back' : step === 'code' ? 'Check your email' : 'Create your account';
  const subtitle = !signup ? 'Log in to continue planning.' : step === 'code' ? info : 'Sign up with your email to start planning trips.';
  return (
    <form onSubmit={submit} className="w-full max-w-sm" noValidate>
      {signup && step === 'code' && (
        <button type="button" onClick={() => { setStep('form'); setErr(''); setInfo(''); }} className="mb-4 flex items-center gap-1 text-sm font-medium text-muted hover:text-sea">
          <ArrowLeft size={16} /> Change email
        </button>
      )}
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mb-6 mt-1 text-muted">{subtitle}</p>
      {err && <div className="mb-4 rounded-xl border border-coral/40 bg-coral/10 px-3 py-2 text-sm" role="alert">{err}</div>}

      {(!signup || step === 'form') && (
        <>
          {signup && (
            <div className="mb-4"><label className="label" htmlFor="n">Name</label>
              <input id="n" className="input" value={f.name} onChange={set('name')} placeholder="Enter your full name" autoComplete="name" /></div>
          )}
          <div className="mb-4"><label className="label" htmlFor="e">Email</label>
            <input id="e" type="email" autoComplete="email" className="input" value={f.email} onChange={set('email')} placeholder={signup ? `Enter your ${domains[0]} account` : 'Enter your email address'} /></div>
          <div className="mb-4"><label className="label" htmlFor="p">Password</label>
            <PasswordInput id="p" autoComplete={signup ? 'new-password' : 'current-password'} value={f.password} onChange={set('password')} placeholder={signup ? 'Create a password' : 'Enter your password'} />
            {signup && <p className="mt-1 text-xs text-muted">At least 8 characters, with letters and numbers.</p>}
            {!signup && (
              <button type="button" onClick={() => { setErr(''); setForgot(true); }} className="mt-2 text-sm font-semibold text-sea hover:underline">
                Forgot password?
              </button>
            )}</div>
          {signup && (
            <div className="mb-6"><label className="label" htmlFor="c">Confirm password</label>
              <PasswordInput id="c" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} placeholder="Re-enter your password" />
              {f.confirm && f.confirm !== f.password && <p className="mt-1 text-xs text-coral">Passwords do not match yet.</p>}</div>
          )}
        </>
      )}

      {signup && step === 'code' && (
        <div className="mb-6">
          <label className="label" htmlFor="code">Verification code</label>
          <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus
            className="input text-center font-display text-2xl tracking-[0.5em]"
            value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.replace(/\D/g, '') })} placeholder="000000" />
          <button type="button" onClick={sendCode} disabled={busy || cooldown > 0} className="mt-3 text-sm font-semibold text-sea disabled:text-muted">
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      )}

      {!signup && <div className="mb-2" />}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? 'Please wait…' : !signup ? 'Log in' : step === 'code' ? 'Verify and create account' : 'Send verification code'}
      </button>

      {!signup && open && (
        <p className="mt-6 text-center text-sm text-muted">
          {"Don't have an account? "}
          <button type="button" onClick={() => switchMode(true)} className="font-semibold text-sea hover:underline">Create account</button>
        </p>
      )}
      {signup && step === 'form' && !noAccounts && (
        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <button type="button" onClick={() => switchMode(false)} className="font-semibold text-sea hover:underline">Log in</button>
        </p>
      )}
    </form>
  );
}