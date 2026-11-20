export default function LeadTable({
  leads,
  staleLeadIds,
  onViewLead
}: {
  leads: any[];
  staleLeadIds: Set<string>;
  onViewLead: (lead: any) => void;
}) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: '#3b82f6',
      QUOTE_SENT: '#f59e0b',
      BOOKING_PENDING: '#f97316',
      CALLBACK_REQUESTED: '#8b5cf6',
      DECLINED: '#ef4444',
      CONVERTED: '#10b981',
      OPTED_OUT: '#6b7280',
      STALE: '#f97316',
      CONTACTED: '#8b5cf6',
      RECOVERED: '#10b981',
      ESCALATED: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  };

  if (leads.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        No leads found
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f9fafb' }}>
          <tr>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Lead ID</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Name</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Value</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Received</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '12px', fontSize: '13px' }}>{lead.id}</td>
              <td style={{ padding: '12px', fontSize: '13px' }}>
                <div style={{ fontWeight: '500', color: '#374151' }}>{lead.name}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{lead.email}</div>
              </td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  backgroundColor: getStatusColor(lead.status) + '20',
                  color: getStatusColor(lead.status)
                }}>
                  {lead.status}
                </span>
                {staleLeadIds.has(lead.id) && (
                  <span style={{ marginLeft: '8px', fontSize: '11px', color: '#f97316' }}>⏰ Stale</span>
                )}
              </td>
              <td style={{ padding: '12px', fontSize: '13px' }}>{formatCurrency(lead.potential_value)}</td>
              <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>
                {new Date(lead.received_at).toLocaleDateString()}
              </td>
              <td style={{ padding: '12px' }}>
                <button
                  onClick={() => onViewLead(lead)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
