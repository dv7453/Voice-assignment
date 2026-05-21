'use client';

import { type FounderView, type LeadPanelState } from '@/hooks/useFounderSync';

const SERVICES = [
  {
    slug: 'paid_media',
    title: 'Paid Media',
    subtitle: 'Meta + Google',
    price: '12% of spend + $2k/mo',
    desc: 'Full-funnel campaign management. Min spend $10K/month.',
  },
  {
    slug: 'growth_sprint',
    title: 'Growth Sprint',
    subtitle: '3-week intensive',
    price: '$8,000 flat',
    desc: 'Audit your funnel, identify top 3 growth levers, 90-day roadmap.',
  },
  {
    slug: 'creative_studio',
    title: 'Creative Studio',
    subtitle: 'Performance creative',
    price: '$3,500/month',
    desc: 'Up to 20 assets/month. Static, video, UGC briefs, landing pages.',
  },
  {
    slug: 'full_stack_retainer',
    title: 'Full-Stack Retainer',
    subtitle: 'Media + Creative + Strategy',
    price: '$8K–$15K/month',
    desc: 'Our flagship. For brands spending $30K+/month on ads.',
  },
];

const PROCESS_STEPS = [
  { n: '01', title: 'Discovery', desc: 'Understand your business, goals, unit economics' },
  { n: '02', title: 'Audit', desc: 'Review ad accounts, creatives, attribution' },
  { n: '03', title: 'Strategy', desc: '90-day plan with channel mix and KPIs' },
  { n: '04', title: 'Onboarding', desc: 'Account access, creative intake, dashboard setup' },
  { n: '05', title: 'Execution', desc: 'Weekly optimizations, bi-weekly strategy calls' },
  { n: '06', title: 'Reporting', desc: 'Custom dashboard + dedicated Slack channel' },
];

function ServicesOverview() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 w-full">
      {SERVICES.map((s) => (
        <div
          key={s.slug}
          className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-1"
        >
          <div className="text-xs font-medium text-white/50 uppercase tracking-wider">
            {s.subtitle}
          </div>
          <div className="text-base font-semibold text-white">{s.title}</div>
          <div className="text-sm text-white/60 mt-1">{s.desc}</div>
          <div className="text-sm font-medium text-blue-400 mt-2">{s.price}</div>
        </div>
      ))}
    </div>
  );
}

function ServiceDetail({ service }: { service: string }) {
  const s = SERVICES.find((x) => x.slug === service) ?? SERVICES[0];
  return (
    <div className="p-6 flex flex-col gap-4 w-full">
      <div className="text-xs font-medium text-white/50 uppercase tracking-wider">
        {s.subtitle}
      </div>
      <div className="text-2xl font-bold text-white">{s.title}</div>
      <div className="text-base text-white/70 leading-relaxed">{s.desc}</div>
      <div className="text-xl font-semibold text-blue-400">{s.price}</div>
      <div className="mt-2 text-sm text-white/40">
        Minimum engagement: 3 months
      </div>
    </div>
  );
}

function ProcessSlide() {
  return (
    <div className="p-4 flex flex-col gap-3 w-full">
      <div className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">
        How we work
      </div>
      {PROCESS_STEPS.map((step) => (
        <div key={step.n} className="flex items-start gap-3">
          <div className="text-xs font-mono font-bold text-blue-400 w-6 pt-0.5 shrink-0">
            {step.n}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{step.title}</div>
            <div className="text-xs text-white/50">{step.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LeadPanel({ lead }: { lead: LeadPanelState }) {
  const fields: { key: keyof LeadPanelState; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'company', label: 'Company' },
    { key: 'role', label: 'Role' },
    { key: 'problem', label: 'Problem' },
    { key: 'current_spend', label: 'Current spend' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'budget', label: 'Budget' },
    { key: 'fit_score', label: 'Fit' },
  ];
  const captured = fields.filter((f) => lead[f.key]);
  if (captured.length === 0) return null;
  return (
    <div className="border-t border-white/10 px-4 py-3 flex flex-col gap-2">
      <div className="text-xs font-medium text-white/30 uppercase tracking-wider">
        Captured
      </div>
      {captured.map(({ key, label }) => (
        <div key={key} className="flex gap-2 text-xs">
          <span className="text-white/40 w-24 shrink-0">{label}</span>
          <span className="text-white/80">{lead[key]}</span>
        </div>
      ))}
    </div>
  );
}

interface FounderPanelProps {
  view: FounderView;
  lead: LeadPanelState;
}

export function FounderPanel({ view, lead }: FounderPanelProps) {
  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/10 
                    bg-black/40 backdrop-blur overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <div className="text-xs font-semibold text-white/40 uppercase tracking-widest">
          Maneuver
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {view.type === 'idle' && (
          <div className="flex items-center justify-center h-full p-8 text-center">
            <div className="text-white/20 text-sm">
              Visuals will appear here as we talk
            </div>
          </div>
        )}
        {view.type === 'services_overview' && <ServicesOverview />}
        {view.type === 'service_detail' && (
          <ServiceDetail service={view.service} />
        )}
        {view.type === 'process' && <ProcessSlide />}
      </div>

      <LeadPanel lead={lead} />
    </div>
  );
}
