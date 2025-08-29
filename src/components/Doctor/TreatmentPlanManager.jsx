import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const TreatmentPlanManager = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCollaborativeEditor, setShowCollaborativeEditor] = useState(false);
  const [planHistory, setPlanHistory] = useState([]);
  const [patientFeedback, setPatientFeedback] = useState([]);

  const { fetchWithAuth } = useAuth();

  useEffect(() => {
    loadTreatmentPlans();
    loadPatients();
  }, []);

  const loadTreatmentPlans = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/treatment-plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      } else {
        // Fallback demo data
        setPlans([
          {
            id: 1,
            patientId: 'demo-patient-1',
            patientName: 'Sarah Johnson',
            title: 'Diabetes Management Plan',
            description: 'Comprehensive diabetes care including medication, diet, and exercise',
            status: 'active',
            priority: 'high',
            startDate: '2024-01-15',
            endDate: '2024-12-15',
            medications: ['Metformin 500mg', 'Insulin Glargine'],
            therapies: ['Nutritional Counseling', 'Exercise Therapy'],
            goals: ['HbA1c < 7%', 'Weight loss 10lbs', 'Blood glucose monitoring'],
            progress: 75,
            lastUpdated: '2024-08-25',
            collaborators: ['Dr. Smith', 'Nurse Maria', 'Dietitian Jones']
          },
          {
            id: 2,
            patientId: 'demo-patient-2',
            patientName: 'Robert Chen',
            title: 'Hypertension Control',
            description: 'Blood pressure management with lifestyle modifications',
            status: 'active',
            priority: 'medium',
            startDate: '2024-02-01',
            endDate: '2024-11-01',
            medications: ['Lisinopril 10mg', 'Amlodipine 5mg'],
            therapies: ['Cardiac Rehabilitation', 'Stress Management'],
            goals: ['BP < 130/80', 'Daily exercise 30min', 'Low sodium diet'],
            progress: 60,
            lastUpdated: '2024-08-20',
            collaborators: ['Dr. Johnson', 'Cardio Specialist']
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading treatment plans:', error);
      // Fallback demo data on error
      setPlans([
        {
          id: 1,
          patientName: 'Demo Patient',
          title: 'Sample Treatment Plan',
          description: 'Demo plan for system testing',
          status: 'active',
          priority: 'medium',
          progress: 50,
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await fetchWithAuth('/api/doctors/patients');
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
      } else {
        // Fallback demo patients
        setPatients([
          { id: 'demo-patient-1', name: 'Sarah Johnson', age: 45, condition: 'Diabetes Type 2' },
          { id: 'demo-patient-2', name: 'Robert Chen', age: 62, condition: 'Hypertension' },
          { id: 'demo-patient-3', name: 'Emily Davis', age: 34, condition: 'Asthma' },
          { id: 'demo-patient-4', name: 'Michael Brown', age: 58, condition: 'Arthritis' }
        ]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      // Fallback demo patients on error
      setPatients([
        { id: 'demo-patient-1', name: 'Demo Patient 1', age: 45, condition: 'General Care' },
        { id: 'demo-patient-2', name: 'Demo Patient 2', age: 35, condition: 'Routine Checkup' }
      ]);
    }
  };

  const loadPlanHistory = async (planId) => {
    try {
      const res = await fetchWithAuth(`/api/treatment-plans/${planId}/history`);
      if (res.ok) {
        const data = await res.json();
        setPlanHistory(data);
      }
    } catch (error) {
      console.error('Error loading plan history:', error);
    }
  };

  const loadPatientFeedback = async (planId) => {
    try {
      const res = await fetchWithAuth(`/api/treatment-plans/${planId}/feedback`);
      if (res.ok) {
        const data = await res.json();
        setPatientFeedback(data);
      }
    } catch (error) {
      console.error('Error loading patient feedback:', error);
    }
  };

  const createTreatmentPlan = async (planData) => {
    try {
      const res = await fetchWithAuth('/api/treatment-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });

      if (res.ok) {
        await loadTreatmentPlans();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating treatment plan:', error);
    }
  };

  const updateTreatmentPlan = async (planId, updates) => {
    try {
      const res = await fetchWithAuth(`/api/treatment-plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (res.ok) {
        await loadTreatmentPlans();
        if (selectedPlan?.id === planId) {
          const updatedPlan = { ...selectedPlan, ...updates };
          setSelectedPlan(updatedPlan);
        }
      }
    } catch (error) {
      console.error('Error updating treatment plan:', error);
    }
  };

  const addCollaborativeComment = async (planId, comment) => {
    try {
      const res = await fetchWithAuth(`/api/treatment-plans/${planId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment,
          timestamp: new Date().toISOString(),
          type: 'doctor_comment'
        })
      });

      if (res.ok) {
        await loadPlanHistory(planId);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const CreatePlanModal = () => {
    const [formData, setFormData] = useState({
      patient_id: '',
      plan_name: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      priority: 'medium',
      medications: [''],
      therapies: [''],
      lifestyle_recommendations: [''],
      goals: [''],
      follow_up_schedule: ['']
    });

    const handleArrayFieldChange = (field, index, value) => {
      const newArray = [...formData[field]];
      newArray[index] = value;
      setFormData({ ...formData, [field]: newArray });
    };

    const addArrayField = (field) => {
      setFormData({
        ...formData,
        [field]: [...formData[field], '']
      });
    };

    const removeArrayField = (field, index) => {
      const newArray = formData[field].filter((_, i) => i !== index);
      setFormData({ ...formData, [field]: newArray });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      const cleanedData = {
        ...formData,
        medications: formData.medications.filter(m => m.trim()),
        therapies: formData.therapies.filter(t => t.trim()),
        lifestyle_recommendations: formData.lifestyle_recommendations.filter(l => l.trim()),
        goals: formData.goals.filter(g => g.trim()),
        follow_up_schedule: formData.follow_up_schedule.filter(f => f.trim())
      };
      createTreatmentPlan(cleanedData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Create Treatment Plan</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient
                </label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={formData.plan_name}
                  onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Dynamic Array Fields */}
            {['medications', 'therapies', 'lifestyle_recommendations', 'goals'].map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {field.replace('_', ' ')}
                </label>
                {formData[field].map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayFieldChange(field, index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter ${field.slice(0, -1)}`}
                    />
                    {formData[field].length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField(field, index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField(field)}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add {field.slice(0, -1)}
                </button>
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Plan
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const CollaborativeEditor = () => {
    const [comment, setComment] = useState('');
    const [changeLog, setChangeLog] = useState('');

    const handleSaveChanges = () => {
      if (selectedPlan && changeLog.trim()) {
        addCollaborativeComment(selectedPlan.id, changeLog);
        setChangeLog('');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Collaborative Editor - {selectedPlan?.plan_name}
              </h3>
              <button
                onClick={() => setShowCollaborativeEditor(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-12 h-full">
              {/* Plan Editor */}
              <div className="col-span-8 p-6 overflow-y-auto">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Plan Details</h4>
                
                {/* Editable plan sections */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      defaultValue={selectedPlan?.description}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Change Log
                    </label>
                    <textarea
                      value={changeLog}
                      onChange={(e) => setChangeLog(e.target.value)}
                      placeholder="Describe the changes you're making to this plan..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveChanges}
                      disabled={!changeLog.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>

              {/* History & Feedback */}
              <div className="col-span-4 border-l border-gray-200 p-6 bg-gray-50 overflow-y-auto">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  History & Feedback
                </h4>

                {/* Plan History */}
                <div className="mb-6">
                  <h5 className="font-medium text-gray-900 mb-2">Recent Changes</h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {planHistory.map((entry, idx) => (
                      <div key={idx} className="bg-white rounded p-3 text-sm">
                        <p className="text-gray-900">{entry.change_description}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Patient Feedback */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Patient Feedback</h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {patientFeedback.map((feedback, idx) => (
                      <div key={idx} className="bg-white rounded p-3 text-sm">
                        <p className="text-gray-900">{feedback.message}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-500 text-xs">
                            {new Date(feedback.timestamp).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            feedback.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                            feedback.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {feedback.sentiment}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Treatment Plan Manager</h2>
          <p className="text-gray-600">Create and manage personalized treatment plans</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div
            key={plan.id}
            className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedPlan(plan)}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {plan.plan_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {plan.patient_name}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(plan.status)}`}>
                    {plan.status}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(plan.priority)}`}>
                    {plan.priority}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {plan.description}
              </p>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {plan.start_date} - {plan.end_date}
                </span>
                <span className="flex items-center">
                  <DocumentTextIcon className="w-4 h-4 mr-1" />
                  {plan.medications?.length || 0} meds
                </span>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan);
                    setShowCollaborativeEditor(true);
                    loadPlanHistory(plan.id);
                    loadPatientFeedback(plan.id);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                >
                  <PencilIcon className="w-4 h-4 inline mr-1" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Add collaboration features
                  }}
                  className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700"
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4 inline mr-1" />
                  Collaborate
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showCreateModal && <CreatePlanModal />}
      {showCollaborativeEditor && <CollaborativeEditor />}
    </div>
  );
};

export default TreatmentPlanManager;
