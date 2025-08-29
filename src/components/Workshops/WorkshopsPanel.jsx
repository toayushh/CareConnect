import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:9000/api';

const WorkshopsPanel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', start_time: '', end_time: '', location: '', capacity: '' });
  const [notesMap, setNotesMap] = useState({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/workshops`);
      if (!res.ok) throw new Error('Failed to load workshops');
      setItems(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/workshops/${id}/notes`);
      if (!res.ok) throw new Error('Failed to load notes');
      const data = await res.json();
      setNotesMap((prev) => ({ ...prev, [id]: data }));
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const createWorkshop = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/workshops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          start_time: form.start_time,
          end_time: form.end_time,
          location: form.location || undefined,
          capacity: form.capacity ? Number(form.capacity) : undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create workshop (requires login)');
      setForm({ title: '', description: '', start_time: '', end_time: '', location: '', capacity: '' });
      fetchItems();
    } catch (e) {
      setError(e.message);
    }
  };

  const addNote = async (id, content) => {
    try {
      const res = await fetch(`${API_BASE}/workshops/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to add note (requires login)');
      fetchNotes(id);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Workshops</h2>
        <button className="text-sm text-indigo-600 hover:underline" onClick={fetchItems}>Refresh</button>
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
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Start</th>
                  <th className="py-2 pr-4">End</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Capacity</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((w) => (
                  <tr key={w.id} className="border-t align-top">
                    <td className="py-2 pr-4">
                      <div className="font-medium text-gray-800">{w.title}</div>
                      <div className="text-gray-500 text-xs">{w.description || '-'}</div>
                    </td>
                    <td className="py-2 pr-4">{new Date(w.start_time).toLocaleString()}</td>
                    <td className="py-2 pr-4">{new Date(w.end_time).toLocaleString()}</td>
                    <td className="py-2 pr-4">{w.location || '-'}</td>
                    <td className="py-2 pr-4">{w.capacity || '-'}</td>
                    <td className="py-2 pr-4">
                      <button className="text-xs text-indigo-600 hover:underline" onClick={() => fetchNotes(w.id)}>View notes</button>
                      <div className="mt-2 space-y-2">
                        {(notesMap[w.id] || []).map((n) => (
                          <div key={n.id} className="text-xs text-gray-700">
                            {n.content}
                            <span className="text-gray-400"> · {new Date(n.created_at).toLocaleString()}</span>
                          </div>
                        ))}
                        {token && (
                          <AddNoteForm onAdd={(content) => addNote(w.id, content)} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form onSubmit={createWorkshop} className="bg-white p-4 rounded-lg shadow-sm space-y-3">
        <h3 className="font-medium text-gray-800">Create Workshop</h3>
        <input className="w-full border rounded p-2" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea className="w-full border rounded p-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded p-2" type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
          <input className="border rounded p-2" type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded p-2" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input className="border rounded p-2" type="number" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        </div>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Create</button>
      </form>
    </div>
  );
};

const AddNoteForm = ({ onAdd }) => {
  const [content, setContent] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!content.trim()) return; onAdd(content); setContent(''); }} className="flex items-center space-x-2">
      <input className="border rounded p-1 text-xs flex-1" placeholder="Add note..." value={content} onChange={(e) => setContent(e.target.value)} />
      <button type="submit" className="text-xs px-2 py-1 bg-indigo-600 text-white rounded">Add</button>
    </form>
  );
};

export default WorkshopsPanel;


