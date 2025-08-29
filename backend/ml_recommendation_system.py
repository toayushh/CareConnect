"""
Healthcare AI Recommendation System
Training and prediction module for patient health recommendations
Compatible with Flask backend
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os
from datetime import datetime
from pathlib import Path

class HealthcareRecommendationModel:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        
    def create_synthetic_dataset(self, n_samples=1000):
        """Create a synthetic healthcare dataset for training"""
        np.random.seed(42)
        
        # Generate synthetic patient data
        ages = np.random.normal(45, 15, n_samples).clip(18, 90)
        bmis = np.random.normal(26, 5, n_samples).clip(18, 45)
        blood_pressures_sys = np.random.normal(130, 20, n_samples).clip(90, 200)
        blood_pressures_dia = np.random.normal(85, 15, n_samples).clip(60, 120)
        glucose_levels = np.random.normal(100, 25, n_samples).clip(70, 300)
        cholesterol = np.random.normal(200, 40, n_samples).clip(120, 350)
        
        # Generate symptoms (0-10 scale)
        fatigue = np.random.randint(0, 11, n_samples)
        chest_pain = np.random.randint(0, 11, n_samples)
        shortness_breath = np.random.randint(0, 11, n_samples)
        headache = np.random.randint(0, 11, n_samples)
        
        # Generate lifestyle factors
        exercise_hours = np.random.exponential(2, n_samples).clip(0, 15)
        smoking = np.random.choice([0, 1], n_samples, p=[0.7, 0.3])
        alcohol_units = np.random.exponential(3, n_samples).clip(0, 20)
        
        # Create treatment effectiveness based on health indicators
        health_scores = []
        treatments = []
        
        for i in range(n_samples):
            # Calculate base health score
            health_score = 100
            
            # Age factor
            if ages[i] > 65:
                health_score -= 10
            elif ages[i] > 50:
                health_score -= 5
                
            # BMI factor
            if bmis[i] > 30:
                health_score -= 15
            elif bmis[i] > 25:
                health_score -= 5
                
            # Blood pressure factor
            if blood_pressures_sys[i] > 140:
                health_score -= 10
            if blood_pressures_dia[i] > 90:
                health_score -= 5
                
            # Glucose factor
            if glucose_levels[i] > 126:
                health_score -= 10
            elif glucose_levels[i] > 100:
                health_score -= 3
                
            # Symptom factors
            health_score -= (fatigue[i] + chest_pain[i] + shortness_breath[i] + headache[i]) * 0.5
            
            # Lifestyle factors
            health_score += exercise_hours[i] * 2
            health_score -= smoking[i] * 10
            health_score -= alcohol_units[i] * 0.5
            
            # Ensure score is between 0-100
            health_score = max(0, min(100, health_score))
            health_scores.append(health_score)
            
            # Determine best treatment based on health indicators
            if health_score >= 80:
                treatment = "Lifestyle Modification"
            elif health_score >= 60:
                if bmis[i] > 30:
                    treatment = "Diet & Exercise Program"
                elif blood_pressures_sys[i] > 140:
                    treatment = "Hypertension Management"
                elif glucose_levels[i] > 126:
                    treatment = "Diabetes Management"
                else:
                    treatment = "Preventive Care"
            elif health_score >= 40:
                if chest_pain[i] > 6:
                    treatment = "Cardiology Consultation"
                elif glucose_levels[i] > 180:
                    treatment = "Intensive Diabetes Care"
                elif blood_pressures_sys[i] > 160:
                    treatment = "Medication Therapy"
                else:
                    treatment = "Comprehensive Care Plan"
            else:
                treatment = "Immediate Medical Attention"
                
            treatments.append(treatment)
        
        # Create DataFrame
        data = pd.DataFrame({
            'age': ages,
            'bmi': bmis,
            'systolic_bp': blood_pressures_sys,
            'diastolic_bp': blood_pressures_dia,
            'glucose': glucose_levels,
            'cholesterol': cholesterol,
            'fatigue': fatigue,
            'chest_pain': chest_pain,
            'shortness_breath': shortness_breath,
            'headache': headache,
            'exercise_hours': exercise_hours,
            'smoking': smoking,
            'alcohol_units': alcohol_units,
            'health_score': health_scores,
            'recommended_treatment': treatments
        })
        
        return data
    
    def preprocess_data(self, data):
        """Preprocess the data for training"""
        # Features for prediction
        feature_columns = [
            'age', 'bmi', 'systolic_bp', 'diastolic_bp', 'glucose', 'cholesterol',
            'fatigue', 'chest_pain', 'shortness_breath', 'headache',
            'exercise_hours', 'smoking', 'alcohol_units', 'health_score'
        ]
        
        X = data[feature_columns]
        y = data['recommended_treatment']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Encode labels
        y_encoded = self.label_encoder.fit_transform(y)
        
        return X_scaled, y_encoded, feature_columns
    
    def train_model(self, data=None):
        """Train the recommendation model"""
        if data is None:
            print("Creating synthetic dataset...")
            data = self.create_synthetic_dataset(3000)
        
        print("Preprocessing data...")
        X, y, feature_columns = self.preprocess_data(data)
        
        # Split data (check if stratification is possible)
        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
        except ValueError:
            # If stratification fails, split without it
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
        
        print("Training model...")
        self.model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        print(f"Model accuracy: {accuracy:.3f}")
        
        # Print classification report
        print("\nClassification Report:")
        try:
            print(classification_report(y_test, y_pred))
        except Exception as e:
            print(f"Classification report error: {e}")
            
        # Print unique classes
        print(f"\nUnique treatments in model: {len(self.label_encoder.classes_)}")
        for i, treatment in enumerate(self.label_encoder.classes_):
            print(f"  {i}: {treatment}")
        
        self.is_trained = True
        self.feature_columns = feature_columns
        
        # Save model
        self.save_model()
        
        return accuracy
    
    def predict_treatment(self, patient_data):
        """Predict treatment recommendation for a patient"""
        if not self.is_trained:
            raise ValueError("Model not trained yet. Please train the model first.")
        
        # Ensure patient_data has all required features
        required_features = [
            'age', 'bmi', 'systolic_bp', 'diastolic_bp', 'glucose', 'cholesterol',
            'fatigue', 'chest_pain', 'shortness_breath', 'headache',
            'exercise_hours', 'smoking', 'alcohol_units', 'health_score'
        ]
        
        # Create feature array
        features = []
        for feature in required_features:
            features.append(patient_data.get(feature, 0))
        
        # Scale features
        features_scaled = self.scaler.transform([features])
        
        # Predict
        prediction = self.model.predict(features_scaled)[0]
        probabilities = self.model.predict_proba(features_scaled)[0]
        
        # Get treatment name
        treatment = self.label_encoder.inverse_transform([prediction])[0]
        
        # Get confidence score
        confidence = probabilities.max()
        
        # Get top 3 recommendations
        top_indices = np.argsort(probabilities)[::-1][:3]
        recommendations = []
        
        for i, idx in enumerate(top_indices):
            treatment_name = self.label_encoder.inverse_transform([idx])[0]
            recommendations.append({
                'id': i + 1,
                'treatment': treatment_name,
                'confidence': float(probabilities[idx])
            })
        
        return {
            'primary_treatment': treatment,
            'confidence': float(confidence),
            'health_score': float(patient_data.get('health_score', 0)),
            'recommendations': recommendations
        }
    
    def save_model(self, filepath=None):
        """Save the trained model"""
        if filepath is None:
            # Use Path for better compatibility
            models_dir = Path(__file__).parent / "models"
            models_dir.mkdir(exist_ok=True)
            filepath = models_dir / "healthcare_model.joblib"
        
        # Ensure directory exists
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'feature_columns': self.feature_columns,
            'is_trained': self.is_trained,
            'trained_at': datetime.now().isoformat()
        }
        
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath=None):
        """Load a trained model"""
        if filepath is None:
            models_dir = Path(__file__).parent / "models"
            filepath = models_dir / "healthcare_model.joblib"
        
        if not Path(filepath).exists():
            print(f"Model file not found at {filepath}. Training new model...")
            self.train_model()
            return
        
        model_data = joblib.load(filepath)
        
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.label_encoder = model_data['label_encoder']
        self.feature_columns = model_data['feature_columns']
        self.is_trained = model_data['is_trained']
        
        print(f"Model loaded from {filepath}")
        print(f"Model trained at: {model_data.get('trained_at', 'Unknown')}")

# Global model instance
healthcare_model = HealthcareRecommendationModel()

def initialize_model():
    """Initialize the healthcare model"""
    try:
        healthcare_model.load_model()
    except Exception as e:
        print(f"Error loading model: {e}")
        print("Training new model...")
        healthcare_model.train_model()

def get_health_recommendations(patient_data):
    """Get health recommendations for a patient"""
    if not healthcare_model.is_trained:
        initialize_model()
    
    return healthcare_model.predict_treatment(patient_data)

if __name__ == "__main__":
    # Train the model when run directly
    model = HealthcareRecommendationModel()
    accuracy = model.train_model()
    print(f"\nModel training completed with accuracy: {accuracy:.3f}")
    
    # Test prediction
    test_patient = {
        'age': 45,
        'bmi': 28,
        'systolic_bp': 140,
        'diastolic_bp': 90,
        'glucose': 110,
        'cholesterol': 220,
        'fatigue': 6,
        'chest_pain': 3,
        'shortness_breath': 4,
        'headache': 2,
        'exercise_hours': 2,
        'smoking': 0,
        'alcohol_units': 3,
        'health_score': 65
    }
    
    prediction = model.predict_treatment(test_patient)
    print(f"\nTest prediction for patient:")
    print(f"Health Score: {prediction['health_score']}")
    print(f"Primary Treatment: {prediction['primary_treatment']}")
    print(f"Confidence: {prediction['confidence']:.3f}")
    print("\nTop Recommendations:")
    for rec in prediction['recommendations']:
        print(f"  {rec['id']}. {rec['treatment']} (confidence: {rec['confidence']:.3f})")
