import { useEffect, useState } from 'react';

export default function SummaryCards({
  total,
  newLeads,
  stale,
  recovered,
  recoveryRate
}: {
  total: number;
  newLeads: number;
  stale: number;
  recovered: number;
  recoveryRate: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '30px' }}>
      <Card title="Total Leads" value={total} subtitle="All leads in system" />
      <Card title="New Leads" value={newLeads} subtitle="Recently received" color="blue" />
      <Card title="Stale Leads" value={stale} subtitle="Need follow-up" color="orange" />
      <Card title="Recovered" value={`${recovered}`} subtitle={`${recoveryRate}% recovery rate`} color="green" />
    </div>
  );
}

function Card({ title, value, subtitle, color = 'gray' }: { title: string; value: string | number; subtitle: string; color?: 'gray' | 'blue' | 'orange' | 'green' }) {
  const colors = {
    gray: 'border-l-4 border-gray-400 bg-white',
    blue: 'border-l-4 border-blue-500 bg-white',
    orange: 'border-l-4 border-orange-500 bg-white',
    green: 'border-l-4 border-green-500 bg-white'
  };

  return (
    <div style={{ padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', ...getCardStyle(color) }}>
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#999' }}>{subtitle}</div>
    </div>
  );
}

function getCardStyle(color: string) {
  switch (color) {
    case 'blue': return { borderLeft: '4px solid #3b82f6', backgroundColor: '#fff' };
    case 'orange': return { borderLeft: '4px solid #f97316', backgroundColor: '#fff' };
    case 'green': return { borderLeft: '4px solid #10b981', backgroundColor: '#fff' };
    default: return { borderLeft: '4px solid #6b7280', backgroundColor: '#fff' };
  }
}
