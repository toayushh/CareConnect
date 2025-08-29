import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const ApiContext = createContext();

export const useApi = () => {
    const context = useContext(ApiContext);
    if (!context) {
        throw new Error('useApi must be used within an ApiProvider');
    }
    return context;
};

export const ApiProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('checking');
    const [user, setUser] = useState(null);
    const [userType, setUserType] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Check backend connection on mount
    useEffect(() => {
        checkBackendConnection();
    }, []);

    // Check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            checkCurrentUser();
        }
    }, []);

    const checkBackendConnection = async () => {
        try {
            setConnectionStatus('checking');
            const isHealthy = await apiService.healthCheck();
            setIsConnected(isHealthy);
            setConnectionStatus(isHealthy ? 'connected' : 'disconnected');
        } catch (error) {
            setIsConnected(false);
            setConnectionStatus('error');
            console.error('Backend connection check failed:', error);
        }
    };

    const checkCurrentUser = async () => {
        try {
            const userData = await apiService.getCurrentUser();
            setUser(userData);
            setUserType(userData.role || userData.type);
        } catch (error) {
            console.error('Failed to get current user:', error);
            // Clear invalid token
            apiService.clearToken();
            setUser(null);
            setUserType(null);
        }
    };

    const login = async (credentials) => {
        setIsLoading(true);
        try {
            const response = await apiService.login(credentials);
            setUser(response.user);
            setUserType(response.user.role || response.user.type);
            setIsLoading(false);
            return response;
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const logout = () => {
        apiService.clearToken();
        setUser(null);
        setUserType(null);
    };

    const register = async (userData, userType) => {
        setIsLoading(true);
        try {
            const response = await apiService.register(userData, userType);
            setIsLoading(false);
            return response;
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const updateUserProfile = async (profileData) => {
        setIsLoading(true);
        try {
            let response;
            if (userType === 'doctor') {
                response = await apiService.updateDoctorProfile(profileData);
            } else {
                response = await apiService.updatePatientProfile(profileData);
            }
            
            // Update local user state
            setUser(prev => ({ ...prev, ...response }));
            setIsLoading(false);
            return response;
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const getMLPrediction = async (patientId, healthFeatures) => {
        setIsLoading(true);
        try {
            const response = await apiService.getMLPrediction(patientId, healthFeatures);
            setIsLoading(false);
            return response;
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const trainMLModel = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.trainMLModel();
            setIsLoading(false);
            return response;
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const submitFeedback = async (feedbackData) => {
        setIsLoading(true);
        try {
            const response = await apiService.submitDoctorFeedback(feedbackData);
            setIsLoading(false);
            return response;
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const getAnalytics = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getAnalytics();
            setIsLoading(false);
            return response;
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const getDoctorPatients = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getDoctorPatients();
            setIsLoading(false);
            return response;
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const getPatientRecommendations = async () => {
        setIsLoading(true);
        try {
            const response = await apiService.getPatientRecommendations();
            setIsLoading(false);
            return response;
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const updateHealthFeatures = async (healthData) => {
        setIsLoading(true);
        try {
            const response = await apiService.updateHealthFeatures(healthData);
            setIsLoading(false);
            return response;
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const value = {
        // State
        isConnected,
        connectionStatus,
        user,
        userType,
        isLoading,
        
        // Methods
        checkBackendConnection,
        login,
        logout,
        register,
        updateUserProfile,
        getMLPrediction,
        trainMLModel,
        submitFeedback,
        getAnalytics,
        getDoctorPatients,
        getPatientRecommendations,
        updateHealthFeatures,
        
        // Direct API access
        apiService
    };

    return (
        <ApiContext.Provider value={value}>
            {children}
        </ApiContext.Provider>
    );
};
