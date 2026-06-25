'use client';
import * as React from 'react';
import { Send, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Kpi, Quarter } from '@/lib/types';
import { formatValue, currentQuarter } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useI18n } from './i18n-provider';

export function InputForm({ kpis }: { kpis: Kpi[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [kpiId, setKpiId] = React.useState<string>(kpis[0] ? String(kpis[0].id) : '');
  const [quarter, setQuarter] = React.useState<Quarter>(currentQuarter());
  const [value, setValue] = React.useState('');
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; msg: string } | null>(null);

  const selectedKpi = kpis.find((k) => String(k.id) === kpiId);
  const targetQ = selectedKpi?.quarters.find((q) => q.quarter === quarter);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (!selectedKpi || !value.trim()) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      setResult({ ok: false, msg: 'Value must be a number.' });
      return;
    }
    const send = selectedKpi.unit === 'percentage' && parsed > 1 ? parsed / 100 : parsed;
    setBusy(true);
    try {
      const r = await fetch('/api/actuals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kpiId: selectedKpi.id, quarter, value: send, note: note || null }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      setResult({
        ok: true,
        msg: t('input.saved', { value: formatValue(send, selectedKpi.unit), id: selectedKpi.id, quarter }),
      });
      setValue(''); setNote('');
      router.refresh();
    } catch (err: any) {
      setResult({ ok: false, msg: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-12 -end-12 h-40 w-40 rounded-full bg-nahj-gold/30 blur-3xl opacity-40" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <Send className="h-4 w-4 text-nahj-gold" />
          {t('input.title')}
        </CardTitle>
        <CardDescription>{t('input.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <Label htmlFor="kpi-select">{t('input.kpi')}</Label>
            <Select value={kpiId} onValueChange={setKpiId}>
              <SelectTrigger id="kpi-select" className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {kpis.map((k) => (
                  <SelectItem key={k.id} value={String(k.id)}>
                    <span className="font-mono text-xs me-2">KPI {k.id}</span>
                    <span dir="rtl" className="font-arabic text-xs">{k.arabicName}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="qsel">{t('input.quarter')}</Label>
            <Select value={quarter} onValueChange={(v) => setQuarter(v as Quarter)}>
              <SelectTrigger id="qsel" className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['Q1', 'Q2', 'Q3', 'Q4'] as Quarter[]).map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="val">
              {t('input.actual')}{selectedKpi?.unit === 'percentage' ? ' (%)' : ''}
            </Label>
            <Input
              id="val"
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={targetQ?.target !== null && targetQ?.target !== undefined ? `${t('kpi.target')}: ${formatValue(targetQ.target, selectedKpi?.unit ?? 'unknown')}` : '—'}
              className="mt-1.5"
              required
            />
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="note">{t('input.note')}</Label>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('input.notePlaceholder')} className="mt-1.5" />
          </div>
          <div className="md:col-span-12 flex items-center justify-between gap-3 pt-1">
            <div>
              {result && (
                <div className={`flex items-center gap-1.5 text-xs ${result.ok ? 'text-emerald-300' : 'text-red-300'}`}>
                  {result.ok ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  {result.msg}
                </div>
              )}
            </div>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t('input.submit')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
