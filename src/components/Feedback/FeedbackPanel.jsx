import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:9000/api';

const FeedbackPanel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ category: 'general', message: '', rating: 5 });

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/feedback`);
      if (!res.ok) throw new Error('Failed to load feedback');
      setItems(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const submitFeedback = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          source: 'web',
          category: form.category,
          message: form.message,
          rating: Number(form.rating) || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      setForm({ category: 'general', message: '', rating: 5 });
      fetchItems();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Feedback</h2>
        <button className="text-sm text-indigo-600 hover:underline" onClick={fetchItems}>Refresh</button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <ul className="divide-y">
            {items.map((f) => (
              <li key={f.id} className="py-3">
                <div className="text-gray-800 text-sm">[{f.category}] {f.message}</div>
                <div className="text-gray-500 text-xs">Rating: {f.rating || '-'} · {new Date(f.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={submitFeedback} className="bg-white p-4 rounded-lg shadow-sm space-y-3">
        <h3 className="font-medium text-gray-800">Submit Feedback</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="border rounded p-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="general">general</option>
            <option value="ux">ux</option>
            <option value="bug">bug</option>
            <option value="compliment">compliment</option>
            <option value="suggestion">suggestion</option>
          </select>
          <input className="border rounded p-2" type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
        </div>
        <textarea className="w-full border rounded p-2" placeholder="Your feedback" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Send</button>
      </form>
    </div>
  );
};

export default FeedbackPanel;


