"""
Custom JSON serializer to handle NaN values and other problematic data types
"""

import json
import math
from datetime import datetime, date
from decimal import Decimal
import numpy as np

class SafeJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles NaN, inf, and other problematic values"""
    
    def default(self, obj):
        # Handle datetime objects
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        
        # Handle Decimal objects
        if isinstance(obj, Decimal):
            return float(obj)
        
        # Handle numpy types
        if hasattr(obj, 'item'):
            return obj.item()
        
        # Handle numpy arrays
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        
        # Handle numpy scalars
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.bool_):
            return bool(obj)
        
        # Let the parent class handle the rest
        return super().default(obj)
    
    def encode(self, obj):
        """Override encode to handle NaN and inf values"""
        if isinstance(obj, dict):
            return self._clean_dict(obj)
        elif isinstance(obj, list):
            return self._clean_list(obj)
        else:
            return super().encode(obj)
    
    def _clean_dict(self, obj):
        """Clean dictionary values to remove NaN and inf"""
        cleaned = {}
        for key, value in obj.items():
            cleaned[key] = self._clean_value(value)
        return cleaned
    
    def _clean_list(self, obj):
        """Clean list values to remove NaN and inf"""
        return [self._clean_value(item) for item in obj]
    
    def _clean_value(self, value):
        """Clean individual values to remove NaN and inf"""
        if isinstance(value, dict):
            return self._clean_dict(value)
        elif isinstance(value, list):
            return self._clean_list(value)
        elif isinstance(value, float):
            # Replace NaN and inf with None (which becomes null in JSON)
            if math.isnan(value) or math.isinf(value):
                return None
            return value
        elif hasattr(value, 'item'):  # numpy scalar
            try:
                scalar_value = value.item()
                if isinstance(scalar_value, float) and (math.isnan(scalar_value) or math.isinf(scalar_value)):
                    return None
                return scalar_value
            except:
                return None
        else:
            return value

def safe_json_dumps(obj, **kwargs):
    """Safe JSON serialization that handles NaN values"""
    return json.dumps(obj, cls=SafeJSONEncoder, **kwargs)

def safe_json_response(data, status_code=200, **kwargs):
    """Create a Flask response with safe JSON serialization"""
    from flask import jsonify
    
    # Clean the data first
    cleaned_data = SafeJSONEncoder()._clean_value(data)
    
    # Use Flask's jsonify which handles most cases well
    response = jsonify(cleaned_data)
    response.status_code = status_code
    
    # Add any additional headers
    for key, value in kwargs.items():
        if key.startswith('header_'):
            response.headers[key[7:]] = value
    
    return response
