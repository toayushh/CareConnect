import React from 'react';
import { useApi } from '../contexts/ApiContext';

const BackendStatus = () => {
    const { isConnected, connectionStatus, checkBackendConnection } = useApi();

    // Only show the status component when there are connection issues
    if (connectionStatus === 'connected') {
        return null;
    }

    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'disconnected':
                return 'bg-red-500';
            case 'error':
                return 'bg-red-600';
            case 'checking':
                return 'bg-yellow-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusText = () => {
        switch (connectionStatus) {
            case 'disconnected':
                return 'Backend Disconnected';
            case 'error':
                return 'Connection Error';
            case 'checking':
                return 'Checking Connection...';
            default:
                return 'Unknown Status';
        }
    };

    const getStatusIcon = () => {
        switch (connectionStatus) {
            case 'disconnected':
                return '❌';
            case 'error':
                return '⚠️';
            case 'checking':
                return '⏳';
            default:
                return '❓';
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50">
            <div className="flex items-center space-x-2 bg-white rounded-lg shadow-lg px-4 py-2 border">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                <span className="text-sm font-medium text-gray-700">
                    {getStatusIcon()} {getStatusText()}
                </span>
                {connectionStatus !== 'checking' && (
                    <button
                        onClick={checkBackendConnection}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
};

export default BackendStatus;
