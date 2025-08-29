import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const DoctorSchedule = () => {
  const { fetchWithAuth } = useAuth();
  const [schedule, setSchedule] = useState({
    monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    saturday: { enabled: false, startTime: '09:00', endTime: '13:00' },
    sunday: { enabled: false, startTime: '09:00', endTime: '13:00' }
  });

  const [breaks, setBreaks] = useState([
    { id: 1, day: 'all', startTime: '12:00', endTime: '13:00', label: 'Lunch Break' }
  ]);

  const [blockedDates, setBlockedDates] = useState([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchWithAuth('/api/doctors/me');
        if (res.ok) {
          const d = await res.json();
          if (d.availability) {
            try {
              const avail = JSON.parse(d.availability);
              if (avail.schedule) setSchedule(avail.schedule);
              if (avail.breaks) setBreaks(avail.breaks);
              if (avail.blockedDates) setBlockedDates(avail.blockedDates);
            } catch (_) {
              // if plain string, ignore
            }
          }
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchWithAuth]);

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const handleScheduleChange = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSaveSchedule = async () => {
    try {
      setLoading(true);
      setError('');
      const payload = {
        availability: JSON.stringify({ schedule, breaks, blockedDates }),
      };
      const res = await fetchWithAuth('/api/doctors/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save schedule');
      alert('Schedule updated successfully!');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const addBlockedDate = () => {
    if (newBlockedDate) {
      setBlockedDates(prev => [...prev, { date: newBlockedDate, reason: 'Blocked' }]);
      setNewBlockedDate('');
    }
  };

  const removeBlockedDate = (dateToRemove) => {
    setBlockedDates(prev => prev.filter(blocked => blocked.date !== dateToRemove));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Management</h1>
          <p className="text-gray-600">Set your availability and manage your working hours</p>
        </div>
        <button
          onClick={handleSaveSchedule}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Schedule */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
          <div className="space-y-4">
            {daysOfWeek.map(day => (
              <div key={day.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={schedule[day.key].enabled}
                    onChange={(e) => handleScheduleChange(day.key, 'enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="font-medium text-gray-900 w-20">{day.label}</span>
                </div>
                
                {schedule[day.key].enabled && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={schedule[day.key].startTime}
                      onChange={(e) => handleScheduleChange(day.key, 'startTime', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={schedule[day.key].endTime}
                      onChange={(e) => handleScheduleChange(day.key, 'endTime', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                )}

                {!schedule[day.key].enabled && (
                  <span className="text-gray-400 text-sm">Not available</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Breaks & Blocked Dates */}
        <div className="space-y-6">
          {/* Break Times */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Break Times</h3>
            <div className="space-y-3">
              {breaks.map(breakTime => (
                <div key={breakTime.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{breakTime.label}</span>
                    <p className="text-sm text-gray-600">
                      {breakTime.startTime} - {breakTime.endTime}
                    </p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Daily
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Blocked Dates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Blocked Dates</h3>
            
            {/* Add new blocked date */}
            <div className="flex space-x-2 mb-4">
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addBlockedDate}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Block
              </button>
            </div>

            {/* List of blocked dates */}
            <div className="space-y-2">
              {blockedDates.length === 0 ? (
                <p className="text-sm text-gray-500">No blocked dates</p>
              ) : (
                blockedDates.map((blocked, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">
                        {new Date(blocked.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <p className="text-sm text-gray-600">{blocked.reason}</p>
                    </div>
                    <button
                      onClick={() => removeBlockedDate(blocked.date)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200">
                📅 Import schedule from calendar
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200">
                📋 Copy last week's schedule
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200">
                🔄 Set recurring availability
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Preview */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Preview</h3>
        <div className="grid grid-cols-7 gap-4">
          {daysOfWeek.map(day => (
            <div key={day.key} className="text-center">
              <div className="font-medium text-gray-900 mb-2">{day.label.slice(0, 3)}</div>
              <div className={`p-3 rounded-lg text-sm ${
                schedule[day.key].enabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {schedule[day.key].enabled 
                  ? `${schedule[day.key].startTime} - ${schedule[day.key].endTime}`
                  : 'Not available'
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorSchedule;