/**
 * API Service for Flask backend integration
 * Handles all HTTP requests to the LeapFrog backend API
 * @module ApiService
 */

// Use environment variable for production, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api`
    : 'http://localhost:9000/api';

console.log('API Base URL:', API_BASE_URL);

/**
 * API Service class for making authenticated requests to backend
 * @class
 */
class ApiService {
    /**
     * Creates an instance of ApiService
     * @constructor
     */
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    /**
     * Set authentication token
     * @param {string} token - JWT access token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    /**
     * Clear authentication token from storage
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    /**
     * Get headers with authentication token
     * @returns {Object} Headers object with Content-Type and Authorization
     */
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': this.token ? `Bearer ${this.token}` : ''
        };
    }

    /**
     * Generic request method for making API calls
     * @param {string} endpoint - API endpoint path (e.g., '/users/me')
     * @param {Object} options - Fetch options (method, body, headers, etc.)
     * @returns {Promise<Object>} Response data as JSON
     * @throws {Error} If request fails or returns non-2xx status
     */
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

    // ==================== Authentication Methods ====================
    
    /**
     * Login user and store access token
     * @param {Object} credentials - Login credentials
     * @param {string} credentials.email - User email
     * @param {string} credentials.password - User password
     * @returns {Promise<Object>} Response with access_token, refresh_token, and user data
     * @example
     * await apiService.login({
     *   email: 'test@example.com',
     *   password: 'password123'
     * });
     */
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

    /**
     * Register a new user (patient or doctor)
     * @param {Object} userData - User registration data
     * @param {string} userData.name - Full name
     * @param {string} userData.email - Email address
     * @param {string} userData.password - Password
     * @param {string} userType - User type ('patient' or 'doctor')
     * @returns {Promise<Object>} Registration response
     * @example
     * await apiService.register({
     *   name: 'John Doe',
     *   email: 'john@example.com',
     *   password: 'secure123'
     * }, 'patient');
     */
    async register(userData, userType) {
        const endpoint = userType === 'doctor' ? '/auth/register/doctor' : '/auth/register/patient';
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    /**
     * Get current authenticated user's information
     * @returns {Promise<Object>} User object with profile data
     * @throws {Error} If user is not authenticated
     */
    async getCurrentUser() {
        return this.request('/users/me');
    }

    // Patient endpoints
    async getPatientProfile() {
        return this.request('/users/profile');
    }

    async updatePatientProfile(profileData) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async updateHealthFeatures(healthData) {
        // Health features are stored in user profile
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify({ health_features: healthData })
        });
    }

    async getPatientRecommendations() {
        return this.request('/recommendations/recommendations');
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

    // Analytics endpoints (using health-analytics namespace)
    async getAnalytics() {
        return this.request('/health-analytics/metrics');
    }

    async getTrends() {
        return this.request('/health-analytics/trends');
    }

    async getDoctorPerformance() {
        return this.request('/health-analytics/doctor-performance');
    }

    // Feedback endpoints (corrected to match backend)
    async submitDoctorFeedback(feedbackData) {
        return this.request('/feedback/doctor_feedback', {
            method: 'POST',
            body: JSON.stringify(feedbackData)
        });
    }

    async getFeedbackStats() {
        return this.request('/feedback/feedback_stats');
    }

    async getPendingReviews() {
        return this.request('/feedback/pending_reviews');
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
            const healthUrl = import.meta.env.VITE_API_URL 
                ? `${import.meta.env.VITE_API_URL}/health`
                : 'http://localhost:9000/health';
            const response = await fetch(healthUrl);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
