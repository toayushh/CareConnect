import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const DoctorPatients = () => {
  const { fetchWithAuth } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchWithAuth('/api/appointments');
        if (!res.ok) throw new Error('Failed to load appointments');
        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchWithAuth]);

  const patients = useMemo(() => {
    const map = new Map();
    for (const a of appointments) {
      const id = a.patient_id;
      const name = a.patient_name || `Patient ${id}`;
      const key = String(id || name);
      const existing = map.get(key) || { id, name, count: 0, last: null };
      existing.count += 1;
      const t = new Date(a.start_time);
      if (!existing.last || t > existing.last) existing.last = t;
      map.set(key, existing);
    }
    let arr = Array.from(map.values());
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter(p => p.name.toLowerCase().includes(q));
    }
    return arr.sort((a, b) => (b.last?.getTime() || 0) - (a.last?.getTime() || 0));
  }, [appointments, query]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Patients</h1>
          <p className="text-gray-600">Patients you have consulted with</p>
        </div>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search patients..."
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y">
        {patients.length === 0 ? (
          <div className="p-6 text-center text-gray-600">No patients yet.</div>
        ) : (
          patients.map((p) => (
            <div key={p.id || p.name} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{p.name}</div>
                  <div className="text-sm text-gray-600">
                    {p.count} appointment{p.count !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div>Last visit</div>
                <div className="font-medium">{p.last ? p.last.toLocaleDateString() : '—'}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorPatients;

