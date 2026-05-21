'use client';

import { motion, AnimatePresence } from 'motion/react';
import { type FounderView, type LeadPanelState } from '@/hooks/useFounderSync';

const ACCENT_STYLES: Record<string, { border: string; price: string; dot: string }> = {
  blue:   { border: '#3b82f6', price: '#60a5fa', dot: '#3b82f6' },
  purple: { border: '#8b5cf6', price: '#a78bfa', dot: '#8b5cf6' },
  teal:   { border: '#14b8a6', price: '#2dd4bf', dot: '#14b8a6' },
  amber:  { border: '#f59e0b', price: '#fbbf24', dot: '#f59e0b' },
};

const DEFAULT_SERVICES = [
  {
    slug: 'paid_media',
    headline: 'Paid Media',
    why_it_fits: 'Full-funnel campaign management on Meta + Google.',
    bullets: [
      'Min spend $10K/month',
      'Weekly reporting + optimizations',
      'Creative briefing included',
    ],
    price: '12% of spend + $2k/mo',
    accent: 'blue',
  },
  {
    slug: 'growth_sprint',
    headline: 'Growth Sprint',
    why_it_fits: 'A 3-week intensive to find your top growth levers.',
    bullets: [
      'Full funnel audit',
      '90-day execution roadmap',
      'No ongoing commitment needed',
    ],
    price: '$8,000 flat',
    accent: 'purple',
  },
  {
    slug: 'creative_studio',
    headline: 'Creative Studio',
    why_it_fits: 'Performance creative for paid channels.',
    bullets: [
      'Up to 20 assets/month',
      'Static, video, UGC briefs',
      'Briefed by our strategists',
    ],
    price: '$3,500/month',
    accent: 'teal',
  },
  {
    slug: 'full_stack_retainer',
    headline: 'Full-Stack Retainer',
    why_it_fits: 'Media + Creative + Strategy under one roof.',
    bullets: [
      'For brands spending $30K+/month',
      'Dedicated team of 4',
      'Weekly calls + Slack channel',
    ],
    price: '$8K–$15K/month',
    accent: 'amber',
  },
];

interface ServiceData {
  slug: string;
  headline: string;
  why_it_fits: string;
  bullets: string[];
  price: string;
  accent: string;
}

function ServiceCard({ service, index }: { service: ServiceData; index: number }) {
  const accent = ACCENT_STYLES[service.accent] ?? ACCENT_STYLES.blue;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08, ease: 'easeOut' }}
      style={{
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: `3px solid ${accent.border}`,
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{
        fontSize: '13px',
        fontWeight: 600,
        color: '#ffffff',
        lineHeight: 1.3,
      }}>
        {service.headline}
      </div>

      <div style={{
        fontSize: '11px',
        color: 'rgba(255,255,255,0.45)',
        lineHeight: 1.5,
      }}>
        {service.why_it_fits}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {service.bullets.map((bullet, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.4,
          }}>
            <div style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: accent.dot,
              marginTop: '5px',
              flexShrink: 0,
            }} />
            {bullet}
          </div>
        ))}
      </div>

      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        color: accent.price,
        marginTop: '4px',
      }}>
        {service.price}
      </div>
    </motion.div>
  );
}

function ServicesOverview({ services }: { services: ServiceData[] }) {
  const display = services.length > 0 ? services : DEFAULT_SERVICES;
  const isGrid = display.length > 1;
  return (
    <div style={{
      padding: '12px',
      display: isGrid ? 'grid' : 'flex',
      gridTemplateColumns: isGrid ? '1fr 1fr' : undefined,
      flexDirection: isGrid ? undefined : 'column',
      gap: '10px',
    }}>
      {display.map((s, i) => (
        <ServiceCard key={s.slug} service={s} index={i} />
      ))}
    </div>
  );
}

function ProcessSlide() {
  const steps = [
    { n: '01', title: 'Discovery', desc: 'Understand your business, goals, unit economics' },
    { n: '02', title: 'Audit', desc: 'Review ad accounts, creatives, attribution' },
    { n: '03', title: 'Strategy', desc: '90-day plan with channel mix and KPIs' },
    { n: '04', title: 'Onboarding', desc: 'Account access, creative intake, dashboard setup' },
    { n: '05', title: 'Execution', desc: 'Weekly optimizations, bi-weekly strategy calls' },
    { n: '06', title: 'Reporting', desc: 'Custom dashboard + dedicated Slack channel' },
  ];
  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
        How we work
      </div>
      {steps.map((step, i) => (
        <motion.div
          key={step.n}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
          style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#3b82f6', width: '18px', paddingTop: '2px', flexShrink: 0 }}>
            {step.n}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>{step.title}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{step.desc}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function LeadPanel({ lead }: { lead: LeadPanelState }) {
  const fields: { key: keyof LeadPanelState; label: string; accent: string }[] = [
    { key: 'name', label: 'Name', accent: '#3b82f6' },
    { key: 'company', label: 'Company', accent: '#8b5cf6' },
    { key: 'role', label: 'Role', accent: '#14b8a6' },
    { key: 'problem', label: 'Problem', accent: '#f59e0b' },
    { key: 'current_spend', label: 'Spend', accent: '#3b82f6' },
    { key: 'timeline', label: 'Timeline', accent: '#8b5cf6' },
    { key: 'budget', label: 'Budget', accent: '#14b8a6' },
    { key: 'fit_score', label: 'Fit', accent: '#f59e0b' },
  ];
  const captured = fields.filter((f) => lead[f.key]);
  if (captured.length === 0) return null;
  return (
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '10px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Captured
      </div>
      {captured.map(({ key, label, accent }) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '11px' }}
        >
          <div style={{ color: accent, width: '60px', flexShrink: 0, fontWeight: 500 }}>
            {label}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
            {lead[key]}
          </div>
        </motion.div>
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(12px)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: '10px',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}>
        Maneuver
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {view.type === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '200px',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)' }}>
                Visuals will appear here as we talk
              </div>
            </motion.div>
          )}

          {view.type === 'services_overview' && (
            <motion.div
              key="services"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ServicesOverview services={view.services ?? []} />
            </motion.div>
          )}

          {view.type === 'service_detail' && (
            <motion.div
              key={`detail-${view.service}`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ServicesOverview services={view.services ?? []} />
            </motion.div>
          )}

          {view.type === 'process' && (
            <motion.div
              key="process"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProcessSlide />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LeadPanel lead={lead} />
    </div>
  );
}
