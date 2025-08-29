import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

const DoctorAnalytics = () => {
  const { fetchWithAuth } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [apptRes, docRes, fbRes] = await Promise.all([
          fetchWithAuth('/api/appointments'),
          fetchWithAuth('/api/doctors/me'),
          fetchWithAuth('/api/feedback'),
        ]);
        if (apptRes.ok) setAppointments(await apptRes.json());
        if (docRes.ok) setDoctor(await docRes.json());
        if (fbRes.ok) setRatings((await fbRes.json()).filter(f => typeof f.rating === 'number'));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchWithAuth]);

  const monthKey = (iso) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const appointmentData = useMemo(() => {
    const byMonth = new Map();
    appointments.forEach(a => {
      const key = monthKey(a.start_time);
      const prev = byMonth.get(key) || { appointments: 0, revenue: 0 };
      prev.appointments += 1;
      if (a.status === 'completed' || a.status === 'scheduled' || a.status === 'confirmed') {
        const fee = Number(doctor?.consultation_fee || 0);
        prev.revenue += fee;
      }
      byMonth.set(key, prev);
    });
    // Last 6 months
    const out = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString(undefined, { month: 'short' });
      const v = byMonth.get(key) || { appointments: 0, revenue: 0 };
      out.push({ month: label, appointments: v.appointments, revenue: v.revenue });
    }
    return out;
  }, [appointments, doctor]);

  const appointmentTypeData = useMemo(() => {
    const types = { 'in-person': 0, video: 0, phone: 0 };
    appointments.forEach(a => {
      const t = a.appointment_type || 'in-person';
      if (types[t] === undefined) types[t] = 0;
      types[t] += 1;
    });
    return [
      { name: 'In-Person', value: types['in-person'], color: '#3b82f6' },
      { name: 'Video Call', value: types['video'], color: '#10b981' },
      { name: 'Phone Call', value: types['phone'], color: '#f59e0b' },
    ];
  }, [appointments]);

  const ratingData = useMemo(() => {
    const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(r => {
      const v = Math.max(1, Math.min(5, Math.round(r.rating)));
      buckets[v] += 1;
    });
    return [
      { rating: '5 Stars', count: buckets[5] },
      { rating: '4 Stars', count: buckets[4] },
      { rating: '3 Stars', count: buckets[3] },
      { rating: '2 Stars', count: buckets[2] },
      { rating: '1 Star', count: buckets[1] },
    ];
  }, [ratings]);

  const uniquePatients = useMemo(() => new Set(appointments.map(a => a.patient_id)).size, [appointments]);
  const monthlyRevenue = appointmentData.at(-1)?.revenue || 0;
  const avgRating = useMemo(() => {
    if (!ratings.length) return 0;
    return (ratings.reduce((s, r) => s + Number(r.rating || 0), 0) / ratings.length).toFixed(1);
  }, [ratings]);

  const stats = [
    { title: 'Total Patients', value: String(uniquePatients || 0), change: '', trend: 'up', icon: '👥' },
    { title: 'This Month Revenue', value: `$${monthlyRevenue.toLocaleString()}`, change: '', trend: 'up', icon: '💰' },
    { title: 'Average Rating', value: avgRating ? String(avgRating) : 'N/A', change: '', trend: 'up', icon: '⭐' },
    { title: 'Appointments', value: String(appointments.length), change: '', trend: 'up', icon: '✅' }
  ];

  const recentActivity = useMemo(() => {
    const items = appointments
      .slice()
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      .slice(0, 5)
      .map(a => ({
        time: new Date(a.start_time).toLocaleString(),
        action: `${a.status === 'completed' ? 'Completed' : 'Scheduled'} appointment with ${a.patient_name || 'patient'}`,
        type: a.status === 'completed' ? 'completed' : 'booking',
      }));
    return items;
  }, [appointments]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your performance, patient satisfaction, and revenue</p>
        {loading && <p className="text-sm text-gray-500 mt-2">Loading...</p>}
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointments & Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={appointmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="appointments" stroke="#3b82f6" strokeWidth={2} name="Appointments" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={appointmentTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {appointmentTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Ratings Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ratingData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="rating" type="category" />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                activity.type === 'completed' ? 'bg-green-500' :
                activity.type === 'rating' ? 'bg-yellow-500' :
                activity.type === 'booking' ? 'bg-blue-500' :
                'bg-purple-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorAnalytics;