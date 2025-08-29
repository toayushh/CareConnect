import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:9000/api';

const PartnersPanel = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    organization_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    status: 'prospect',
    metadataText: '{\n  "source": "ui"\n}',
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  const fetchPartners = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/partners/partners`);
      if (!res.ok) throw new Error('Failed to load partners');
      const data = await res.json();
      setPartners(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const submitPartner = async (e) => {
    e.preventDefault();
    setError('');
    let metadata;
    try {
      metadata = form.metadataText ? JSON.parse(form.metadataText) : undefined;
    } catch (e) {
      setError('Invalid JSON in metadata');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/partners/partners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          organization_name: form.organization_name,
          contact_name: form.contact_name || undefined,
          contact_email: form.contact_email || undefined,
          contact_phone: form.contact_phone || undefined,
          status: form.status,
          metadata,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create partner (requires login)');
      }
      setForm({
        organization_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        status: 'prospect',
        metadataText: '{\n  "source": "ui"\n}',
      });
      fetchPartners();
    } catch (e) {
      setError(e.message);
    }
  };

  const [appForm, setAppForm] = useState({
    organization_name: '',
    submitted_by: '',
    email: '',
    phone: '',
    notes: '',
  });

  const submitApplication = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/partners/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_name: appForm.organization_name,
          submitted_by: appForm.submitted_by || undefined,
          email: appForm.email || undefined,
          phone: appForm.phone || undefined,
          notes: appForm.notes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to submit application');
      }
      setAppForm({ organization_name: '', submitted_by: '', email: '', phone: '', notes: '' });
      fetchPartners();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Partners</h2>
        <button
          className="text-sm text-indigo-600 hover:underline"
          onClick={fetchPartners}
        >
          Refresh
        </button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Organization</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-2 pr-4">{p.organization_name}</td>
                    <td className="py-2 pr-4">
                      <div className="text-gray-800">{p.contact_name || '-'}</div>
                      <div className="text-gray-500">{p.contact_email || p.contact_phone || ''}</div>
                    </td>
                    <td className="py-2 pr-4">
                      <span className="px-2 py-1 text-xs rounded bg-indigo-50 text-indigo-700">{p.status}</span>
                    </td>
                    <td className="py-2 pr-4 text-gray-500">{new Date(p.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={submitPartner} className="bg-white p-4 rounded-lg shadow-sm space-y-3">
          <h3 className="font-medium text-gray-800">Create Partner</h3>
          <input
            className="w-full border rounded p-2"
            placeholder="Organization Name"
            value={form.organization_name}
            onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded p-2" placeholder="Contact Name" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
            <input className="border rounded p-2" placeholder="Contact Email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            <input className="border rounded p-2" placeholder="Contact Phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            <select className="border rounded p-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="prospect">prospect</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="declined">declined</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Metadata (JSON)</label>
            <textarea
              className="w-full border rounded p-2 font-mono text-xs h-28"
              value={form.metadataText}
              onChange={(e) => setForm({ ...form, metadataText: e.target.value })}
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Create</button>
        </form>

        <form onSubmit={submitApplication} className="bg-white p-4 rounded-lg shadow-sm space-y-3">
          <h3 className="font-medium text-gray-800">Submit Partner Application</h3>
          <input className="w-full border rounded p-2" placeholder="Organization Name" value={appForm.organization_name} onChange={(e) => setAppForm({ ...appForm, organization_name: e.target.value })} required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded p-2" placeholder="Submitted By" value={appForm.submitted_by} onChange={(e) => setAppForm({ ...appForm, submitted_by: e.target.value })} />
            <input className="border rounded p-2" placeholder="Email" value={appForm.email} onChange={(e) => setAppForm({ ...appForm, email: e.target.value })} />
            <input className="border rounded p-2" placeholder="Phone" value={appForm.phone} onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })} />
          </div>
          <textarea className="w-full border rounded p-2" placeholder="Notes" value={appForm.notes} onChange={(e) => setAppForm({ ...appForm, notes: e.target.value })} />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default PartnersPanel;


