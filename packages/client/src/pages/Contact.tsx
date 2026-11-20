import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

interface ContactProps {
  onNavigateToDashboard?: () => void;
}

export default function Contact({ onNavigateToDashboard }: ContactProps) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast('Please fill in all required fields (Name, Email, Message)', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || 'General Inquiry from Website',
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        showToast('Your message has been sent to the team at thejaswini@reviveaiapp.com', 'success');
      } else {
        showToast(data.error || 'Failed to send message', 'error');
      }
    } catch (err: any) {
      showToast('Network error sending message. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page" style={{ padding: '2.5rem 2rem', maxWidth: '720px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Contact Us
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '560px', margin: '0 auto' }}>
          Have questions about ReviveAI, custom integrations, or partnerships? Send us a message and our team will get back to you shortly.
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '0.875rem',
          padding: '0.35rem 0.85rem',
          borderRadius: '9999px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)'
        }}>
          <span>✉️</span>
          <span>Domain Mailbox: <strong>thejaswini@reviveaiapp.com</strong></span>
        </div>
      </div>

      {submitted ? (
        <div style={{
          background: 'var(--bg-primary, white)',
          border: '1.5px solid #10b981',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: '#065f46', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Message Sent Successfully
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.9375rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 1.75rem auto' }}>
            Thank you for reaching out! Your message has been delivered to <strong>thejaswini@reviveaiapp.com</strong>. We typically respond within 24 hours.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setSubmitted(false);
                setName('');
                setEmail('');
                setSubject('');
                setMessage('');
              }}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Send Another Message
            </button>
            {onNavigateToDashboard && (
              <button
                onClick={onNavigateToDashboard}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{
          background: 'var(--bg-primary, white)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '2rem 2.25rem',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                Your Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '0.9375rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                Email Address <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '0.9375rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              Subject
            </label>
            <input
              type="text"
              placeholder="e.g. Inquiry regarding ReviveAI enterprise deployment"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '0.9375rem' }}
            />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              Message <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              required
              rows={5}
              placeholder="How can we help you? Write your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1.5px solid var(--border)', fontSize: '0.9375rem', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              transition: 'all 0.2s ease',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Sending Message...' : '✉️ Send Message'}
          </button>
        </form>
      )}
    </div>
  );
}
