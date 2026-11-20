export default function LeadModal({
  lead,
  isOpen,
  onClose,
  onUpdateStatus,
  onOptOut
}: {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (leadId: string, status: string) => void;
  onOptOut: (leadId: string) => void;
}) {
  if (!isOpen || !lead) return null;

  const statusOptions = [
    { value: 'CONTACTED', label: 'Mark as Contacted' },
    { value: 'RECOVERED', label: 'Mark as Recovered' },
    { value: 'DECLINED', label: 'Mark as Declined' }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = (newStatus: string) => {
    onUpdateStatus(lead.id, newStatus);
  };

  const handleOptOut = () => {
    onOptOut(lead.id);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '600px',
        maxWidth: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>{lead.name}</h2>
            <p style={{ margin: '8px 0 0', color: '#6b7280' }}>{lead.id}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              border: 'none',
              background: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#9ca3af'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>Contact</h3>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>{lead.email}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>{lead.phone}</p>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>Details</h3>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>Service: {lead.enquiry_type || 'N/A'}</p>
              <p style={{ margin: '4px 0', fontSize: '14px' }}>Value: {formatCurrency(lead.potential_value)}</p>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>Enquiry</h3>
            <div style={{
              padding: '12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              fontSize: '14px',
              lineHeight: '1.5',
              color: '#374151'
            }}>
              {lead.message}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>Current Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                padding: '6px 12px',
                borderRadius: '4px',
                backgroundColor: getStatusColor(lead.status) + '20',
                color: getStatusColor(lead.status),
                fontWeight: '600'
              }}>
                {lead.status}
              </span>
              {lead.last_contacted_at && (
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  Last contacted: {formatDate(lead.last_contacted_at)}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: '#6b7280' }}>Update Status</label>
              <select
                onChange={(e) => handleStatusChange(e.target.value)}
                value=""
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px'
                }}
              >
                <option value="">Select status...</option>
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOptOut}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Opt Out
            </button>
          </div>
        </div>

        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              backgroundColor: '#6b7280',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
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
}
