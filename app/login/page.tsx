'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Lock, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NahjLogo } from '@/components/nahj-logo';
import { useI18n } from '@/components/i18n-provider';
import { cn } from '@/lib/utils';

// Demo defaults. Real passwords managed via Admin → Users once signed in.
const QUICK_ACCOUNTS = [
  { username: 'executive', password: '1', labelKey: 'login.acct.executive', subKey: 'login.acct.executiveSub' },
  { username: 'badir', password: '1', labelKey: 'nav.badir', subKey: 'login.acct.badirSub' },
  { username: 'risala', password: '1', labelKey: 'nav.risala', subKey: 'login.acct.risalaSub' },
  { username: 'iktashif', password: '1', labelKey: 'nav.iktashif', subKey: 'login.acct.iktashifSub' },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // Shared login routine. Takes credentials explicitly so the Quick Account
  // tiles can sign in directly without waiting for a setState round-trip.
  async function performLogin(u: string, p: string) {
    setErr(null); setBusy(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || t('login.invalid'));
      router.push(data.landing || '/dashboard/executive');
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
    // Note: don't clear busy on success — leave the spinner up until the
    // route transition completes so users can't double-click.
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await performLogin(username, password);
  }

  // One-click sign-in from the Quick Account tiles. Fills the visible fields
  // (so the inputs reflect what's happening) AND triggers the login.
  function quick(u: typeof QUICK_ACCOUNTS[number]) {
    setUsername(u.username);
    setPassword(u.password);
    performLogin(u.username, u.password);
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating coloured halos behind everything */}
      <div className="pointer-events-none absolute -top-24 -start-24 h-[28rem] w-[28rem] rounded-full bg-nahj-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -end-24 h-[28rem] w-[28rem] rounded-full bg-nahj-teal/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 start-1/2 h-[20rem] w-[20rem] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Brand pane */}
        <div className="relative hidden lg:flex flex-col justify-between p-12">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="relative inline-block">
              <NahjLogo className="h-14 w-14" />
              <div className="absolute inset-0 bg-nahj-gold/30 blur-2xl -z-10" />
            </div>
            <div className="mt-6">
              <div className="font-serif text-3xl font-medium leading-tight text-white">NAHJ Dashboard</div>
              <div dir="rtl" className="font-arabic text-base mt-1 text-white/65">جمعية نهج لتمكين الشباب</div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="space-y-6 max-w-md">
            <h2 className="font-serif text-4xl font-medium leading-tight text-white">{t('login.brand.headline')}</h2>
            <p className="text-white/70 leading-relaxed">{t('login.brand.body')}</p>
            <div className="grid grid-cols-3 gap-3 pt-4">
              <Stat n="20" label={t('nav.kpis')} />
              <Stat n="15" label={t('nav.risks')} />
              <Stat n="3" label={t('nav.panels')} />
            </div>
          </motion.div>

          <div dir="rtl" className="font-arabic text-xs text-white/45">
            الإلهام · التمكين · الوعي والمسؤولية · الأثر والاستدامة
          </div>
        </div>

        {/* Form pane */}
        <div className="flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="lg:hidden flex items-center gap-3">
                <NahjLogo className="h-10 w-10" />
                <div>
                  <div className="font-serif text-lg font-medium text-white">NAHJ Dashboard</div>
                </div>
              </div>
              <div className="ms-auto inline-flex items-center glass rounded-lg p-0.5">
                <button
                  onClick={() => setLocale('en')}
                  className={cn('h-7 px-2.5 rounded-md text-xs font-medium', locale === 'en' ? 'bg-white/10 text-white' : 'text-white/55')}
                  aria-pressed={locale === 'en'}
                >EN</button>
                <button
                  onClick={() => setLocale('ar')}
                  className={cn('h-7 px-2.5 rounded-md text-base leading-none font-medium', locale === 'ar' ? 'bg-white/10 text-white' : 'text-white/55')}
                  aria-pressed={locale === 'ar'}
                >
                  <Languages className="h-3.5 w-3.5 inline -mt-0.5 me-1" />ع
                </button>
              </div>
            </div>

            <h1 className="font-serif text-2xl font-medium text-white">{t('login.title')}</h1>
            <p className="mt-1 text-sm text-white/55">{t('login.subtitle')}</p>

            <div className="mt-6 rounded-2xl glass-card-strong p-6">
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label htmlFor="u">{t('login.username')}</Label>
                  <Input
                    id="u"
                    autoFocus
                    list="username-options"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('login.usernameHint')}
                    className="mt-1.5"
                    required
                  />
                  {/*
                    Native HTML5 datalist — the browser shows these as a dropdown
                    when the user focuses or starts typing in the field. Works in
                    every modern browser without needing a custom popover.
                  */}
                  <datalist id="username-options">
                    {QUICK_ACCOUNTS.map((u) => (
                      <option key={u.username} value={u.username} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label htmlFor="p">{t('login.password')}</Label>
                  <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" required />
                </div>
                {err && <div className="text-xs text-red-300">{err}</div>}
                <Button type="submit" variant="primary" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {t('nav.signIn')}
                </Button>
              </form>
            </div>

            <div className="mt-6">
              <div className="text-[11px] uppercase tracking-wider text-white/45 mb-2">{t('login.quickAccounts')}</div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACCOUNTS.map((u) => (
                  <button
                    key={u.username}
                    onClick={() => quick(u)}
                    className="text-start rounded-xl glass p-3 hover:bg-white/[0.07] hover:border-nahj-gold/40 transition-all"
                  >
                    <div className="text-sm font-medium text-white">{t(u.labelKey as any)}</div>
                    <div className="text-[11px] text-white/55 mt-0.5">{t(u.subKey as any)}</div>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-white/45">{t('login.quickHint')}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-xl glass p-3 relative overflow-hidden">
      <div className="text-2xl font-serif font-medium text-nahj-gold tabular-nums">{n}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/55 mt-0.5">{label}</div>
    </div>
  );
}
