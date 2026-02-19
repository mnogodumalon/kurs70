import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Kurse, Anmeldungen, Dozenten, Teilnehmer } from '@/types/app';
import { BookOpen, Users, GraduationCap, DoorOpen, ClipboardList, TrendingUp, CheckCircle2, Clock, Euro } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { de } from 'date-fns/locale';

interface Stats {
  kurse: number;
  dozenten: number;
  teilnehmer: number;
  raeume: number;
  anmeldungen: number;
  bezahlt: number;
  unbezahlt: number;
  upcomingKurse: Kurse[];
  recentAnmeldungen: Anmeldungen[];
  allKurse: Kurse[];
  allDozenten: Dozenten[];
  allTeilnehmer: Teilnehmer[];
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [kurseData, dozentenData, teilnehmerData, raeumeData, anmeldungenData] = await Promise.all([
          LivingAppsService.getKurse(),
          LivingAppsService.getDozenten(),
          LivingAppsService.getTeilnehmer(),
          LivingAppsService.getRaeume(),
          LivingAppsService.getAnmeldungen(),
        ]);
        const today = new Date();
        const upcoming = kurseData
          .filter(k => k.fields.startdatum && isAfter(parseISO(k.fields.startdatum), today))
          .sort((a, b) => (a.fields.startdatum ?? '').localeCompare(b.fields.startdatum ?? ''))
          .slice(0, 4);
        const recent = anmeldungenData
          .sort((a, b) => (b.fields.anmeldedatum ?? '').localeCompare(a.fields.anmeldedatum ?? ''))
          .slice(0, 5);
        setStats({
          kurse: kurseData.length,
          dozenten: dozentenData.length,
          teilnehmer: teilnehmerData.length,
          raeume: raeumeData.length,
          anmeldungen: anmeldungenData.length,
          bezahlt: anmeldungenData.filter(a => a.fields.bezahlt).length,
          unbezahlt: anmeldungenData.filter(a => !a.fields.bezahlt).length,
          upcomingKurse: upcoming,
          recentAnmeldungen: recent,
          allKurse: kurseData,
          allDozenten: dozentenData,
          allTeilnehmer: teilnehmerData,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const dozentenMap = Object.fromEntries(
    (stats?.allDozenten ?? []).map(d => [d.record_id, d.fields.name])
  );
  const teilnehmerMap = Object.fromEntries(
    (stats?.allTeilnehmer ?? []).map(t => [t.record_id, t.fields.name])
  );
  const kurseMap = Object.fromEntries(
    (stats?.allKurse ?? []).map(k => [k.record_id, k.fields.titel])
  );

  function resolveId(url?: string): string | null {
    if (!url) return null;
    const m = url.match(/([a-f0-9]{24})$/i);
    return m ? m[1] : null;
  }

  const kpiCards = [
    { label: 'Kurse', value: stats?.kurse ?? 0, icon: BookOpen },
    { label: 'Dozenten', value: stats?.dozenten ?? 0, icon: GraduationCap },
    { label: 'Teilnehmer', value: stats?.teilnehmer ?? 0, icon: Users },
    { label: 'Räume', value: stats?.raeume ?? 0, icon: DoorOpen },
    { label: 'Anmeldungen', value: stats?.anmeldungen ?? 0, icon: ClipboardList },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden gradient-hero shadow-hero p-8 text-white">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)'}} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-2">Kursverwaltungssystem</p>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Willkommen zurück</h1>
            <p className="text-white/75 text-base">
              {loading ? 'Daten werden geladen…' : `${stats?.kurse ?? 0} Kurse · ${stats?.anmeldungen ?? 0} Anmeldungen · ${stats?.teilnehmer ?? 0} Teilnehmer`}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-4 text-center min-w-[110px]">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Bezahlt</p>
              <p className="stat-number text-3xl text-white">{loading ? '—' : stats?.bezahlt}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-4 text-center min-w-[110px]">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Offen</p>
              <p className="stat-number text-3xl text-white">{loading ? '—' : stats?.unbezahlt}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map(card => (
          <div key={card.label} className="bg-card rounded-xl border border-border shadow-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{card.label}</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <card.icon size={15} className="text-primary" />
              </div>
            </div>
            <p className="stat-number text-4xl font-medium text-foreground">
              {loading ? <span className="text-muted-foreground text-2xl">…</span> : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Courses */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock size={14} className="text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Bevorstehende Kurse</h2>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">Laden…</div>
            ) : (stats?.upcomingKurse.length ?? 0) === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">Keine bevorstehenden Kurse</div>
            ) : stats?.upcomingKurse.map(kurs => {
              const dozentId = resolveId(kurs.fields.dozent);
              const dozentName = dozentId ? dozentenMap[dozentId] : null;
              return (
                <div key={kurs.record_id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{kurs.fields.titel ?? '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{dozentName ?? 'Kein Dozent'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-primary">
                      {kurs.fields.startdatum ? format(parseISO(kurs.fields.startdatum), 'dd. MMM yyyy', { locale: de }) : '—'}
                    </p>
                    {kurs.fields.preis != null && (
                      <p className="text-xs text-muted-foreground font-mono">{kurs.fields.preis.toLocaleString('de-DE')} €</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Letzte Anmeldungen</h2>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">Laden…</div>
            ) : (stats?.recentAnmeldungen.length ?? 0) === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">Keine Anmeldungen vorhanden</div>
            ) : stats?.recentAnmeldungen.map(a => {
              const tnId = resolveId(a.fields.teilnehmer);
              const kursId = resolveId(a.fields.kurs);
              const tnName = tnId ? teilnehmerMap[tnId] : null;
              const kursName = kursId ? kurseMap[kursId] : null;
              return (
                <div key={a.record_id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tnName ?? '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{kursName ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.fields.bezahlt
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {a.fields.bezahlt ? <CheckCircle2 size={10} /> : <Euro size={10} />}
                      {a.fields.bezahlt ? 'Bezahlt' : 'Offen'}
                    </span>
                    {a.fields.anmeldedatum && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {format(parseISO(a.fields.anmeldedatum), 'dd.MM.yy')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
