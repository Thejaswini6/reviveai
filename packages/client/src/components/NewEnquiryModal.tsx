import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

interface NewEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (leadId: string) => void;
}

export default function NewEnquiryModal({ isOpen, onClose, onSuccess }: NewEnquiryModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('AC servicing');
  const [value, setValue] = useState('6500');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      showToast('Customer Name and Email are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || '+91-98765-00000',
          service,
          potential_value: Number(value) || 5000,
          message: message.trim() || 'Inbound service request',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Lead ${data.lead_id} successfully added to pipeline!`, 'success');
        onSuccess(data.lead_id);
        onClose();
        // Reset form
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
        setValue('6500');
      } else {
        showToast(data.error || 'Failed to create enquiry', 'error');
      }
    } catch (err: any) {
      showToast('Network error creating enquiry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadPreset = (presetType: 'urgent' | 'corporate' | 'residential') => {
    if (presetType === 'urgent') {
      setName('Ananya Deshmukh');
      setEmail('ananya.deshmukh@example.com');
      setPhone('+91-98765-43210');
      setService('AC repair');
      setValue('4500');
      setMessage('Urgent: Master bedroom split AC stopped cooling suddenly. Compressor makes clicking sound. Need a technician visit today.');
    } else if (presetType === 'corporate') {
      setName('Kunal Kapoor');
      setEmail('kunal.k@growthhub.invalid');
      setPhone('+91-98765-54321');
      setService('Central AC maintenance');
      setValue('28000');
      setMessage('Seeking annual maintenance contract (AMC) for 2,500 sq ft office in Indiranagar. 6 cassette AC units.');
    } else {
      setName('Rohit Saxena');
      setEmail('rohit.saxena@homemail.invalid');
      setPhone('+91-98765-67890');
      setService('AC installation');
      setValue('38000');
      setMessage('Looking to install 2 inverter split ACs in newly renovated apartment. Need piping, outdoor stand, and installation.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary, white)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              New Customer Enquiry
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              CoolCare AC Services — Ingest lead into ReviveAI recovery pipeline
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              padding: '0.25rem 0.5rem',
              borderRadius: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {/* Quick Presets */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Quick Fill Demo Presets:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => loadPreset('urgent')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem', borderRadius: '6px', border: '1px solid #fcd34d', background: '#fef3c7', color: '#92400e', cursor: 'pointer', fontWeight: 500 }}
              >
                ⚡ Urgent AC Repair
              </button>
              <button
                type="button"
                onClick={() => loadPreset('corporate')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem', borderRadius: '6px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1e40af', cursor: 'pointer', fontWeight: 500 }}
              >
                🏢 Corporate Central AC (₹28K)
              </button>
              <button
                type="button"
                onClick={() => loadPreset('residential')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem', borderRadius: '6px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', cursor: 'pointer', fontWeight: 500 }}
              >
                🏠 Home Multi-Split (₹38K)
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Customer Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ananya Deshmukh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Customer Email <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. ananya@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91-98765-43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Service Type
              </label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '0.875rem' }}
              >
                <option value="AC servicing">AC Servicing</option>
                <option value="AC repair">Emergency Repair</option>
                <option value="AC installation">New Installation</option>
                <option value="Central AC maintenance">Central AC AMC</option>
                <option value="Duct cleaning">Duct Deep Cleaning</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                Estimated Value (₹)
              </label>
              <input
                type="number"
                placeholder="6500"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Service Notes / Customer Requirements
            </label>
            <textarea
              rows={3}
              placeholder="Describe issue, room specifications, technician availability..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Creating Lead...' : '+ Ingest Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
