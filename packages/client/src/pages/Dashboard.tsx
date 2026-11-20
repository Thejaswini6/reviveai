import { useState, useEffect } from 'react';
import SummaryCards from '../components/SummaryCards';
import LeadTable from '../components/LeadTable';
import LeadModal from '../components/LeadModal';
import { getLeads, getAnalytics, getStaleleads, updateLead, optOutLead } from '../api';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  received_at: string;
  potential_value: number;
}

interface Analytics {
  total_leads: number;
  new_leads: number;
  stale_leads: number;
  recovered_leads: number;
  declined_leads: number;
  opted_out_leads: number;
  recovery_rate_percent: number;
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [staleLeadIds, setStaleLeadIds] = useState<Set<string>>(new Set());
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [analyticsData, leadsData, staleData] = await Promise.all([
        getAnalytics(),
        getLeads(),
        getStaleleads()
      ]);
      
      setAnalytics(analyticsData);
      setLeads(leadsData);
      
      const staleIds = new Set(staleData.map((l: Lead) => l.id));
      setStaleLeadIds(staleIds);
    } catch (err) {
      setError('Failed to load data. Server may not be running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLead(null);
  };

  const handleUpdateLead = async (leadId: string, status: string) => {
    try {
      await updateLead(leadId, { status });
      setLeads(leads.map(l => l.id === leadId ? { ...l, status } : l));
      setShowModal(false);
      setSelectedLead(null);
      fetchAllData();
    } catch (err) {
      setError('Failed to update lead');
    }
  };

  const handleOptOut = async (leadId: string) => {
    try {
      await optOutLead(leadId);
      setLeads(leads.filter(l => l.id !== leadId));
      setShowModal(false);
      setSelectedLead(null);
      fetchAllData();
    } catch (err) {
      setError('Failed to opt out lead');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '10px', color: '#333' }}>🚀 ReviveAI - Revenue Recovery Agent</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>AI-powered lead recovery with human approval</p>

        {error && (
          <div style={{ padding: '12px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <>
            <SummaryCards
              total={analytics?.total_leads || 0}
              newLeads={analytics?.new_leads || 0}
              stale={analytics?.stale_leads || 0}
              recovered={analytics?.recovered_leads || 0}
              recoveryRate={analytics?.recovery_rate_percent || 0}
            />

            <div style={{ marginTop: '30px' }}>
              <h2>Active Leads ({leads.length})</h2>
              <LeadTable
                leads={leads}
                staleLeadIds={staleLeadIds}
                onViewLead={handleViewLead}
              />
            </div>

            {selectedLead && (
              <LeadModal
                lead={selectedLead}
                isOpen={showModal}
                onClose={handleCloseModal}
                onUpdateStatus={handleUpdateLead}
                onOptOut={handleOptOut}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
