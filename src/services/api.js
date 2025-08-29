// API service for Flask backend integration
const API_BASE_URL = 'http://localhost:9000/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    // Set auth token
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Clear auth token
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Get auth headers
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': this.token ? `Bearer ${this.token}` : ''
        };
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                this.clearToken();
                throw new Error('Unauthorized - Please login again');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication endpoints
    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (response.access_token) {
            this.setToken(response.access_token);
        }
        
        return response;
    }

    async register(userData, userType) {
        const endpoint = userType === 'doctor' ? '/auth/register/doctor' : '/auth/register/patient';
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async getCurrentUser() {
        return this.request('/users/me');
    }

    // Patient endpoints
    async getPatientProfile() {
        return this.request('/patients/me');
    }

    async updatePatientProfile(profileData) {
        return this.request('/patients/me', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async updateHealthFeatures(healthData) {
        return this.request('/patients/health_features', {
            method: 'PUT',
            body: JSON.stringify(healthData)
        });
    }

    async getPatientRecommendations() {
        return this.request('/patients/recommendations');
    }

    // Doctor endpoints
    async getDoctorProfile() {
        return this.request('/doctors/me');
    }

    async updateDoctorProfile(profileData) {
        return this.request('/doctors/me', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async getDoctorPatients() {
        return this.request('/doctors/patients');
    }

    async getDoctorStats() {
        return this.request('/doctors/stats');
    }

    // ML endpoints
    async getMLPrediction(patientId, healthFeatures) {
        return this.request(`/ai/predict`, {
            method: 'POST',
            body: JSON.stringify({
                patient_id: patientId,
                health_features: healthFeatures
            })
        });
    }

    async trainMLModel() {
        return this.request('/ai/train_model', {
            method: 'POST'
        });
    }

    async getMLStatus() {
        return this.request('/ai/status');
    }

    async retrainMLModel() {
        return this.request('/ai/retrain_model', {
            method: 'POST'
        });
    }

    // Analytics endpoints
    async getAnalytics() {
        return this.request('/analytics/accuracy_vs_feedback');
    }

    async getTrends() {
        return this.request('/analytics/trends');
    }

    async getDoctorPerformance() {
        return this.request('/analytics/doctor_performance');
    }

    // Feedback endpoints
    async submitDoctorFeedback(feedbackData) {
        return this.request('/feedback/submit', {
            method: 'POST',
            body: JSON.stringify(feedbackData)
        });
    }

    async getFeedbackStats() {
        return this.request('/feedback/stats');
    }

    async getPendingReviews() {
        return this.request('/feedback/pending');
    }

    // Health data endpoints
    async addTrainingData(healthData) {
        return this.request('/health/training_data', {
            method: 'POST',
            body: JSON.stringify(healthData)
        });
    }

    async getTrainingData() {
        return this.request('/health/training_data');
    }

    async validateTrainingData(dataId, validationData) {
        return this.request(`/health/training_data/${dataId}/validate`, {
            method: 'PUT',
            body: JSON.stringify(validationData)
        });
    }

    async getPatientHealthSummary(patientId) {
        return this.request(`/health/patient_summary/${patientId}`);
    }

    async getRiskAssessment(patientId) {
        return this.request(`/health/risk_assessment/${patientId}`);
    }

    // Health check
    async healthCheck() {
        try {
            const response = await fetch('http://localhost:9000/health');
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
