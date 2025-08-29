import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';

const formatDateLabel = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function generateMockProgress(days) {
  const result = [];
  const today = new Date();
  // Base trends
  let mental = 60;
  let physical = 65;
  let mood = 3.2;
  let activity = 30;
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    // Weekly cycles and noise
    const weekly = Math.sin((2 * Math.PI * (days - i)) / 7) * 5;
    const noise = (Math.random() - 0.5) * 6;
    const symptomsBase = Math.max(0, Math.round(3 - weekly / 3 + (Math.random() - 0.5) * 2));

    // Correlations
    activity = Math.max(10, Math.min(90, activity + weekly + noise));
    mood = Math.max(1, Math.min(5, mood + weekly / 10 + noise / 20));
    mental = Math.max(20, Math.min(95, mental + weekly + noise - symptomsBase));
    physical = Math.max(20, Math.min(95, physical + weekly / 2 + noise / 2 - symptomsBase / 2));

    const symptoms = Math.max(0, Math.min(8, Math.round(symptomsBase + (5 - mood) / 2)));

    // Occasionally flag care team alerts if sharp drop
    const flagged = mental < 45 || mood <= 2 || symptoms >= 6;

    result.push({
      date: d.toISOString().slice(0, 10),
      mentalScore: Math.round(mental),
      physicalScore: Math.round(physical),
      moodScore: Math.round(mood * 10) / 10,
      activityMinutes: Math.round(activity),
      symptomsCount: symptoms,
      flagged,
    });
  }
  return { days: result };
}

function generateMockSymptoms(days) {
  const types = ['Headache', 'Fatigue', 'Nausea', 'Anxiety', 'Insomnia', 'Pain'];
  const logs = [];
  days.forEach((d) => {
    const count = Math.min(3, d.symptomsCount);
    for (let i = 0; i < count; i += 1) {
      const type = types[Math.floor(Math.random() * types.length)];
      logs.push({
        id: `${d.date}-${i}`,
        date: d.date,
        type,
        severity: Math.min(10, Math.max(1, Math.round(4 + (5 - d.moodScore) + Math.random() * 3))),
        notes: Math.random() < 0.3 ? 'Noted during afternoon.' : undefined,
      });
    }
  });
  return logs;
}

function useProgressData(range) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Simulate API
    const timeout = setTimeout(() => {
      try {
        const full = generateMockProgress(90);
        const sliced = full.days.slice(-range);
        setData({ days: sliced });
        setLoading(false);
      } catch (e) {
        setError('Failed to load progress');
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [range]);

  return { data, loading, error };
}

function useSymptomLogs(days) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const timeout = setTimeout(() => {
      try {
        const logs = generateMockSymptoms(days || []);
        setData(logs);
        setLoading(false);
      } catch {
        setError('Failed to load symptom logs');
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [days]);

  return { data, loading, error };
}

const StatCard = ({ title, value, sub, color }) => (
  <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
    <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
    <p className={`text-lg font-semibold mt-1 ${color || 'text-sky-700'}`}>{value}</p>
    {sub ? <p className="text-xs text-gray-500 mt-1">{sub}</p> : null}
  </div>
);

const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex space-x-2 bg-white rounded-lg p-1 shadow-sm border border-gray-100">
    {tabs.map((t) => {
      const isActive = active === t;
      return (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-3 py-1.5 text-sm rounded-md transition ${
            isActive ? 'bg-sky-600 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {t}
        </button>
      );
    })}
  </div>
);

const DateRangePicker = ({ value, onChange }) => {
  const options = [7, 30, 90];
  return (
    <div className="inline-flex rounded-md overflow-hidden border border-gray-200">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 text-sm ${value === opt ? 'bg-sky-600 text-white' : 'bg-white hover:bg-gray-50'}`}
        >
          {opt}d
        </button>
      ))}
    </div>
  );
};

const QuickActions = ({ onSymptom, onMood, onPhoto, onVoice }) => (
  <div className="space-y-2">
    <button onClick={onSymptom} className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-md shadow-sm text-sm hover:bg-gray-50">
      <span className="flex items-center space-x-2"><span>📝</span><span>Log Symptom</span></span>
      <span className="text-sky-600">New</span>
    </button>
    <button onClick={onMood} className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-md shadow-sm text-sm hover:bg-gray-50">
      <span className="flex items-center space-x-2"><span>🙂</span><span>Record Mood</span></span>
      <span className="text-sky-600">New</span>
    </button>
    <button onClick={onPhoto} className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-md shadow-sm text-sm hover:bg-gray-50">
      <span className="flex items-center space-x-2"><span>📷</span><span>Add Photo</span></span>
      <span className="text-sky-600">New</span>
    </button>
    <button onClick={onVoice} className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-md shadow-sm text-sm hover:bg-gray-50">
      <span className="flex items-center space-x-2"><span>🎤</span><span>Voice Note</span></span>
      <span className="text-sky-600">New</span>
    </button>
  </div>
);

const Modal = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md mx-auto rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const OverviewTab = ({ data, symptoms }) => {
  const last3 = useMemo(() => data.slice(-3).reverse(), [data]);
  const milestones = useMemo(() => {
    const streak = computeStreak(data);
    const out = [];
    if (streak >= 3) out.push('3-day logging streak');
    if (streak >= 7) out.push('1-week streak');
    const avgActivity = Math.round(data.slice(-7).reduce((s, d) => s + d.activityMinutes, 0) / Math.max(1, Math.min(7, data.length)));
    if (avgActivity >= 45) out.push('Great activity levels this week');
    if (data[data.length - 1]?.mentalScore > data[0]?.mentalScore) out.push('Improved mental health trend');
    return out;
  }, [data]);

  const recommendations = useMemo(() => {
    const today = data[data.length - 1];
    const recs = [];
    if (!today) return recs;
    if (today.symptomsCount >= 5) recs.push('Consider a short rest and hydration');
    if (today.activityMinutes < 20) recs.push('Try a 15-minute walk to boost energy');
    if (today.moodScore <= 2.5) recs.push('Guided breathing for 5 minutes');
    if (recs.length === 0) recs.push('Keep up the great routine today');
    return recs;
  }, [data]);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-800">Combined Progress</h3>
          <Legend />
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 6, right: 6, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="mental" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="physical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip labelFormatter={(l) => formatDateLabel(String(l))} />
              <Area type="monotone" dataKey="mentalScore" name="Mental" stroke="#0ea5e9" fill="url(#mental)" />
              <Area type="monotone" dataKey="physicalScore" name="Physical" stroke="#10b981" fill="url(#physical)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Recent Entries (Last 3 days)</h3>
          <ul className="divide-y">
            {last3.map((d) => (
              <li key={d.date} className="py-2 text-sm text-gray-700 flex items-center justify-between">
                <span className="text-gray-500 w-32">{formatDateLabel(d.date)}</span>
                <span>Mental {d.mentalScore}</span>
                <span>Physical {d.physicalScore}</span>
                <span>Mood {d.moodScore}</span>
                <span>Symptoms {d.symptomsCount}</span>
                <span className={`text-xs ${d.flagged ? 'text-rose-600' : 'text-emerald-600'}`}>{d.flagged ? 'Flagged' : 'OK'}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Milestones & Achievements</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {milestones.map((m) => (
              <li key={m}>{m}</li>
            ))}
            {milestones.length === 0 ? <li>No milestones yet. Keep logging daily!</li> : null}
          </ul>
          <h4 className="font-medium text-gray-800 mt-4 mb-2">Next Recommended Actions</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

function computeStreak(days) {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    const d = days[i];
    const hasAny = d.symptomsCount > 0 || d.activityMinutes > 0 || d.moodScore > 0;
    if (hasAny) streak += 1; else break;
  }
  return streak;
}

const ProgressTracking = () => {
  const [range, setRange] = useState(30);
  const [tab, setTab] = useState('Overview');

  const { data, loading, error } = useProgressData(range);
  const baseDays = data?.days || [];
  const symptomsHook = useSymptomLogs(baseDays);

  // Local overlay state for new user actions
  const [extraLogs, setExtraLogs] = useState([]);
  const [overrides, setOverrides] = useState({}); // { [date]: { symptomsDelta?: number, mood?: number } }

  const todayIso = useMemo(() => {
    if (!baseDays.length) return new Date().toISOString().slice(0, 10);
    return baseDays[baseDays.length - 1].date;
  }, [baseDays]);

  const days = useMemo(() => {
    // Apply overrides to base days
    return baseDays.map((d) => {
      const o = overrides[d.date];
      if (!o) return d;
      return {
        ...d,
        symptomsCount: d.symptomsCount + (o.symptomsDelta || 0),
        moodScore: typeof o.mood === 'number' ? o.mood : d.moodScore,
      };
    });
  }, [baseDays, overrides]);

  const combinedLogs = useMemo(() => {
    return [...(symptomsHook.data || []), ...extraLogs];
  }, [symptomsHook.data, extraLogs]);

  const todayCount = useMemo(() => {
    const today = days[days.length - 1];
    if (!today) return 0;
    // Count distinct categories logged today
    let count = 0;
    if (today.symptomsCount > 0) count += 1;
    if (typeof overrides[todayIso]?.mood === 'number') count += 1;
    if (today.activityMinutes > 0) count += 1;
    return count;
  }, [days, overrides, todayIso]);

  const weeklyStreak = useMemo(() => computeStreak(days), [days]);

  const monthImprovement = useMemo(() => {
    if (days.length < 7) return 0;
    const start = days[0]?.mentalScore + days[0]?.physicalScore;
    const end = days[days.length - 1]?.mentalScore + days[days.length - 1]?.physicalScore;
    const pct = Math.max(-100, Math.min(100, Math.round(((end - start) / Math.max(1, start)) * 100)));
    return pct;
  }, [days]);

  const careAlerts = useMemo(() => days.filter((d) => d.flagged || d.symptomsCount >= 6).length, [days]);

  // Quick actions modal state
  const [openSymptom, setOpenSymptom] = useState(false);
  const [openMood, setOpenMood] = useState(false);
  const [openPhoto, setOpenPhoto] = useState(false);
  const [openVoice, setOpenVoice] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleAddSymptom = (payload) => {
    const newLog = {
      id: `${todayIso}-extra-${Date.now()}`,
      date: todayIso,
      type: payload.type,
      severity: payload.severity,
      notes: payload.notes,
    };
    setExtraLogs((prev) => [...prev, newLog]);
    setOverrides((prev) => ({
      ...prev,
      [todayIso]: { ...prev[todayIso], symptomsDelta: (prev[todayIso]?.symptomsDelta || 0) + 1 },
    }));
    showToast('Symptom logged');
  };

  const handleRecordMood = (m) => {
    setOverrides((prev) => ({ ...prev, [todayIso]: { ...prev[todayIso], mood: m } }));
    showToast('Mood recorded');
  };

  const handleAddPhoto = () => {
    showToast('Photo added');
  };

  const handleVoiceNote = () => {
    showToast('Voice note saved');
  };

  return (
    <div className="min-h-screen bg-white">
      {toast ? (
        <div className="fixed top-4 right-4 z-50 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-2 py-1 shadow text-sm">
          {toast}
        </div>
      ) : null}
      <div className="w-full px-3 sm:px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg sm:text-xl font-semibold text-sky-800">Progress Tracking</h1>
          <div className="flex items-center space-x-2">
            <DateRangePicker value={range} onChange={setRange} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          <StatCard title="Today's Entries" value={todayCount} sub="Items logged today" />
          <StatCard title="Weekly Streak" value={`${weeklyStreak} days`} sub="Consecutive logging" color="text-emerald-700" />
          <StatCard title="Overall Progress" value={`${monthImprovement}%`} sub="This range" color="text-sky-700" />
          <StatCard title="Care Team Alerts" value={careAlerts} sub="Flagged entries" color="text-rose-700" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-9 space-y-4">
            <div className="flex items-center justify-between">
              <Tabs tabs={["Overview", "Symptoms", "Mood", "Activity", "Insights"]} active={tab} onChange={setTab} />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
              {loading && <div className="text-gray-500 text-sm">Loading progress...</div>}
              {error && <div className="text-rose-600 text-sm">{error}</div>}
              {!loading && !error && (
                <div className="space-y-3">
                  {tab === 'Overview' && (
                    <OverviewTab data={days} symptoms={combinedLogs} />
                  )}

                  {tab === 'Symptoms' && (
                    <div className="space-y-4">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={days}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip labelFormatter={(l) => formatDateLabel(String(l))} />
                            <Bar dataKey="symptomsCount" name="Symptoms" fill="#f59e0b" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800 mb-2">Logs</h3>
                        {symptomsHook.loading && <p className="text-sm text-gray-500">Loading symptoms...</p>}
                        {symptomsHook.error && <p className="text-sm text-rose-600">{symptomsHook.error}</p>}
                        <ul className="divide-y">
                          {combinedLogs.slice(-20).reverse().map((s) => (
                            <li key={s.id} className="py-2 text-sm text-gray-700 flex items-center justify-between">
                              <span className="text-gray-500 w-28">{formatDateLabel(s.date)}</span>
                              <span className="w-40">{s.type}</span>
                              <span className="w-24">Severity {s.severity}</span>
                              <span className="flex-1 truncate text-gray-500">{s.notes || ''}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {tab === 'Mood' && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={days}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" domain={[1, 5]} />
                          <Tooltip labelFormatter={(l) => formatDateLabel(String(l))} />
                          <Line type="monotone" dataKey="moodScore" name="Mood" stroke="#6366f1" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {tab === 'Activity' && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={days}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip labelFormatter={(l) => formatDateLabel(String(l))} />
                          <Area type="monotone" dataKey="activityMinutes" name="Minutes" stroke="#22c55e" fill="#22c55e33" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {tab === 'Insights' && (
                    <div className="text-sm text-gray-700 space-y-2">
                      <p>
                        Activity and mood show a positive correlation in your recent logs. On days with over 30 minutes of
                        activity, average mood was higher by approximately 0.6.
                      </p>
                      <p>
                        Symptom spikes typically occur after low-activity days. Consider a consistent light routine to smooth trends.
                      </p>
                      <p>
                        Your mental and physical scores improved {monthImprovement}% over this range.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Quick Actions</h3>
              <QuickActions
                onSymptom={() => setOpenSymptom(true)}
                onMood={() => setOpenMood(true)}
                onPhoto={() => setOpenPhoto(true)}
                onVoice={() => setOpenVoice(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Symptom Modal */}
      <Modal open={openSymptom} title="Log Symptom" onClose={() => setOpenSymptom(false)}>
        <SymptomForm
          onCancel={() => setOpenSymptom(false)}
          onSave={(p) => {
            handleAddSymptom(p);
            setOpenSymptom(false);
          }}
        />
      </Modal>

      {/* Mood Modal */}
      <Modal open={openMood} title="Record Mood" onClose={() => setOpenMood(false)}>
        <MoodForm
          defaultValue={overrides[todayIso]?.mood ?? (days[days.length - 1]?.moodScore || 3)}
          onCancel={() => setOpenMood(false)}
          onSave={(m) => {
            handleRecordMood(m);
            setOpenMood(false);
          }}
        />
      </Modal>

      {/* Photo Modal */}
      <Modal open={openPhoto} title="Add Photo" onClose={() => setOpenPhoto(false)}>
        <PhotoForm
          onCancel={() => setOpenPhoto(false)}
          onSave={() => {
            handleAddPhoto();
            setOpenPhoto(false);
          }}
        />
      </Modal>

      {/* Voice Modal */}
      <Modal open={openVoice} title="Voice Note" onClose={() => setOpenVoice(false)}>
        <VoiceForm
          onCancel={() => setOpenVoice(false)}
          onSave={() => {
            handleVoiceNote();
            setOpenVoice(false);
          }}
        />
      </Modal>
    </div>
  );
};

const SymptomForm = ({ onCancel, onSave }) => {
  const [type, setType] = useState('Headache');
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ type, severity: Number(severity), notes });
      }}
      className="space-y-3"
    >
      <div>
        <label className="text-sm text-gray-700">Symptom</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border rounded p-2 mt-1">
          {['Headache', 'Fatigue', 'Nausea', 'Anxiety', 'Insomnia', 'Pain'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm text-gray-700">Severity: {severity}</label>
        <input type="range" min="1" max="10" value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full" />
      </div>
      <div>
        <label className="text-sm text-gray-700">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded p-2 mt-1" placeholder="Optional" />
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 text-sm rounded border">Cancel</button>
        <button type="submit" className="px-3 py-2 text-sm rounded bg-sky-600 text-white">Save</button>
      </div>
    </form>
  );
};

const MoodForm = ({ defaultValue, onCancel, onSave }) => {
  const [mood, setMood] = useState(defaultValue || 3);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(Number(mood));
      }}
      className="space-y-3"
    >
      <div>
        <label className="text-sm text-gray-700">Mood: {mood}</label>
        <input type="range" min="1" max="5" step="0.1" value={mood} onChange={(e) => setMood(e.target.value)} className="w-full" />
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 text-sm rounded border">Cancel</button>
        <button type="submit" className="px-3 py-2 text-sm rounded bg-sky-600 text-white">Save</button>
      </div>
    </form>
  );
};

const PhotoForm = ({ onCancel, onSave }) => {
  const [fileName, setFileName] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(fileName);
      }}
      className="space-y-3"
    >
      <div>
        <label className="text-sm text-gray-700">Upload Photo</label>
        <input type="file" accept="image/*" onChange={(e) => setFileName(e.target.files?.[0]?.name || '')} className="w-full mt-1" />
        {fileName ? <p className="text-xs text-gray-500 mt-1">Selected: {fileName}</p> : null}
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 text-sm rounded border">Cancel</button>
        <button type="submit" className="px-3 py-2 text-sm rounded bg-sky-600 text-white">Save</button>
      </div>
    </form>
  );
};

const VoiceForm = ({ onCancel, onSave }) => {
  const [note, setNote] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(note);
      }}
      className="space-y-3"
    >
      <div>
        <label className="text-sm text-gray-700">Voice Note (text)</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full border rounded p-2 mt-1" placeholder="Transcribe or jot a quick note" />
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 text-sm rounded border">Cancel</button>
        <button type="submit" className="px-3 py-2 text-sm rounded bg-sky-600 text-white">Save</button>
      </div>
    </form>
  );
};

export default ProgressTracking;
