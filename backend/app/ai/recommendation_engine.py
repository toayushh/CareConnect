import numpy as np
import pandas as pd
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional, Tuple
import json
import logging
from sqlalchemy import and_, or_, desc, func

from ..extensions import db
from ..models.patient import PatientProfile
from ..models.progress import SymptomEntry, MoodEntry, ActivityEntry, ProgressGoal
from ..models.recommendations import (
    HealthRecommendation, HealthInsight, RiskAssessment, 
    PersonalizedMetric, HealthPrediction, InterventionTracking
)
from ..models.appointment import Appointment
from ..models.doctor import Doctor


class LeapFrogRecommendationEngine:
    """
    Advanced AI-powered recommendation engine for personalized healthcare
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Risk thresholds
        self.risk_thresholds = {
            "low": 0.3,
            "moderate": 0.5,
            "high": 0.7,
            "very_high": 0.9
        }
        
        # Recommendation categories
        self.categories = [
            "lifestyle", "exercise", "diet", "medication", "mental_health",
            "preventive_care", "specialist_referral", "monitoring"
        ]
    
    def generate_comprehensive_recommendations(self, patient_id: int) -> Dict[str, Any]:
        """
        Generate comprehensive health recommendations for a patient
        """
        try:
            patient = PatientProfile.query.get(patient_id)
            if not patient:
                raise ValueError(f"Patient {patient_id} not found")
            
            # Gather all patient data
            patient_data = self._gather_patient_data(patient_id)
            
            # Generate different types of recommendations
            recommendations = []
            insights = []
            risk_assessments = []
            predictions = []
            
            # 1. Lifestyle recommendations
            lifestyle_recs = self._generate_lifestyle_recommendations(patient_data)
            recommendations.extend(lifestyle_recs)
            
            # 2. Health insights
            health_insights = self._generate_health_insights(patient_data)
            insights.extend(health_insights)
            
            # 3. Risk assessments
            risks = self._generate_risk_assessments(patient_data)
            risk_assessments.extend(risks)
            
            # 4. Health predictions
            health_predictions = self._generate_health_predictions(patient_data)
            predictions.extend(health_predictions)
            
            # 5. Personalized metrics
            personalized_metrics = self._generate_personalized_metrics(patient_data)
            
            # Save to database
            self._save_recommendations(patient_id, recommendations)
            self._save_insights(patient_id, insights)
            self._save_risk_assessments(patient_id, risk_assessments)
            self._save_predictions(patient_id, predictions)
            self._save_personalized_metrics(patient_id, personalized_metrics)
            
            return {
                "patient_id": patient_id,
                "recommendations": recommendations,
                "insights": insights,
                "risk_assessments": risks,
                "predictions": predictions,
                "personalized_metrics": personalized_metrics,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error generating recommendations for patient {patient_id}: {str(e)}")
            raise
    
    def _gather_patient_data(self, patient_id: int) -> Dict[str, Any]:
        """
        Gather comprehensive patient data for analysis
        """
        patient = PatientProfile.query.get(patient_id)
        
        # Get recent data (last 90 days)
        cutoff_date = datetime.utcnow() - timedelta(days=90)
        
        # Symptoms data
        symptoms = SymptomEntry.query.filter(
            and_(
                SymptomEntry.patient_id == patient_id,
                SymptomEntry.created_at >= cutoff_date
            )
        ).order_by(desc(SymptomEntry.created_at)).all()
        
        # Mood data
        moods = MoodEntry.query.filter(
            and_(
                MoodEntry.patient_id == patient_id,
                MoodEntry.created_at >= cutoff_date
            )
        ).order_by(desc(MoodEntry.created_at)).all()
        
        # Activity data
        activities = ActivityEntry.query.filter(
            and_(
                ActivityEntry.patient_id == patient_id,
                ActivityEntry.created_at >= cutoff_date
            )
        ).order_by(desc(ActivityEntry.created_at)).all()
        
        # Goals
        goals = ProgressGoal.query.filter_by(
            patient_id=patient_id,
            status="active"
        ).all()
        
        # Recent appointments
        appointments = Appointment.query.filter(
            and_(
                Appointment.patient_id == patient_id,
                Appointment.start_time >= cutoff_date
            )
        ).order_by(desc(Appointment.start_time)).all()
        
        return {
            "patient": patient,
            "symptoms": symptoms,
            "moods": moods,
            "activities": activities,
            "goals": goals,
            "appointments": appointments,
            "analysis_period": {
                "start": cutoff_date.isoformat(),
                "end": datetime.utcnow().isoformat(),
                "days": 90
            }
        }
    
    def _generate_lifestyle_recommendations(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate lifestyle-based recommendations
        """
        recommendations = []
        symptoms = data["symptoms"]
        moods = data["moods"]
        activities = data["activities"]
        
        # Analyze symptom patterns
        if symptoms:
            symptom_analysis = self._analyze_symptoms(symptoms)
            
            # High severity symptoms
            if symptom_analysis["avg_severity"] > 7:
                recommendations.append({
                    "category": "lifestyle",
                    "title": "Stress Management for Severe Symptoms",
                    "description": "Your symptoms show high severity levels. Consider stress reduction techniques like meditation, yoga, or breathing exercises. High stress can worsen physical symptoms.",
                    "priority": "high",
                    "confidence_score": 0.8,
                    "reasoning": f"Average symptom severity is {symptom_analysis['avg_severity']:.1f}/10, which is concerning",
                    "data_sources": ["symptoms"],
                    "target_date": (date.today() + timedelta(days=14)).isoformat()
                })
            
            # Frequent headaches
            if symptom_analysis["frequent_symptoms"].get("headache", 0) > 5:
                recommendations.append({
                    "category": "lifestyle",
                    "title": "Hydration and Sleep Optimization",
                    "description": "You're experiencing frequent headaches. Ensure you're drinking 8-10 glasses of water daily and getting 7-9 hours of quality sleep. Consider reducing screen time before bed.",
                    "priority": "medium",
                    "confidence_score": 0.7,
                    "reasoning": f"Headaches reported {symptom_analysis['frequent_symptoms']['headache']} times recently",
                    "data_sources": ["symptoms"],
                    "target_date": (date.today() + timedelta(days=7)).isoformat()
                })
        
        # Analyze mood patterns
        if moods:
            mood_analysis = self._analyze_moods(moods)
            
            # Low mood scores
            if mood_analysis["avg_mood"] < 5:
                recommendations.append({
                    "category": "mental_health",
                    "title": "Mental Wellness Support",
                    "description": "Your mood scores indicate you may benefit from mental health support. Consider talking to a counselor, practicing mindfulness, or engaging in activities you enjoy.",
                    "priority": "high",
                    "confidence_score": 0.85,
                    "reasoning": f"Average mood score is {mood_analysis['avg_mood']:.1f}/10, indicating low mood",
                    "data_sources": ["mood"],
                    "target_date": (date.today() + timedelta(days=3)).isoformat()
                })
            
            # High stress levels
            if mood_analysis["avg_stress"] > 7:
                recommendations.append({
                    "category": "lifestyle",
                    "title": "Stress Reduction Techniques",
                    "description": "Your stress levels are elevated. Try progressive muscle relaxation, deep breathing exercises, or consider yoga classes. Regular exercise can also help reduce stress.",
                    "priority": "medium",
                    "confidence_score": 0.75,
                    "reasoning": f"Average stress level is {mood_analysis['avg_stress']:.1f}/10",
                    "data_sources": ["mood"],
                    "target_date": (date.today() + timedelta(days=10)).isoformat()
                })
        
        # Analyze activity patterns
        if activities:
            activity_analysis = self._analyze_activities(activities)
            
            # Low exercise frequency
            if activity_analysis["exercise_frequency"] < 3:
                recommendations.append({
                    "category": "exercise",
                    "title": "Increase Physical Activity",
                    "description": "You're exercising less than 3 times per week. Aim for at least 150 minutes of moderate exercise weekly. Start with 30-minute walks 3 times a week.",
                    "priority": "medium",
                    "confidence_score": 0.8,
                    "reasoning": f"Only {activity_analysis['exercise_frequency']} exercise sessions per week",
                    "data_sources": ["activities"],
                    "target_date": (date.today() + timedelta(days=7)).isoformat()
                })
        
        # General wellness recommendations
        recommendations.append({
            "category": "preventive_care",
            "title": "Regular Health Monitoring",
            "description": "Continue tracking your symptoms, mood, and activities. This data helps identify patterns and optimize your health management strategy.",
            "priority": "low",
            "confidence_score": 0.9,
            "reasoning": "Consistent health monitoring is essential for preventive care",
            "data_sources": ["general"],
            "target_date": (date.today() + timedelta(days=30)).isoformat()
        })
        
        return recommendations
    
    def _generate_health_insights(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate health insights from patient data
        """
        insights = []
        symptoms = data["symptoms"]
        moods = data["moods"]
        activities = data["activities"]
        
        # Symptom-mood correlation
        if symptoms and moods:
            correlation = self._calculate_symptom_mood_correlation(symptoms, moods)
            if abs(correlation) > 0.5:
                direction = "strong positive" if correlation > 0 else "strong negative"
                insights.append({
                    "insight_type": "correlation",
                    "title": f"Symptom-Mood {direction.title()} Correlation",
                    "description": f"There's a {direction} correlation ({correlation:.2f}) between your symptom severity and mood levels. Managing one may help improve the other.",
                    "severity": "info" if abs(correlation) < 0.7 else "warning",
                    "metrics_analyzed": ["symptoms", "mood"],
                    "correlation_strength": abs(correlation),
                    "time_period": "last_90_days"
                })
        
        # Activity-mood correlation
        if activities and moods:
            correlation = self._calculate_activity_mood_correlation(activities, moods)
            if correlation > 0.4:
                insights.append({
                    "insight_type": "correlation",
                    "title": "Exercise Boosts Mood",
                    "description": f"Your data shows exercise positively impacts your mood (correlation: {correlation:.2f}). Regular physical activity appears beneficial for your mental wellbeing.",
                    "severity": "info",
                    "metrics_analyzed": ["activities", "mood"],
                    "correlation_strength": correlation,
                    "time_period": "last_90_days"
                })
        
        # Trend analysis
        if moods and len(moods) >= 7:
            trend = self._calculate_mood_trend(moods)
            if trend["direction"] != "stable":
                severity = "warning" if trend["direction"] == "decreasing" else "info"
                insights.append({
                    "insight_type": "trend",
                    "title": f"Mood Trend: {trend['direction'].title()}",
                    "description": f"Your mood has been {trend['direction']} over the past weeks. {trend['description']}",
                    "severity": severity,
                    "metrics_analyzed": ["mood"],
                    "trend_direction": trend["direction"],
                    "time_period": "last_30_days"
                })
        
        return insights
    
    def _generate_risk_assessments(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate risk assessments
        """
        risk_assessments = []
        symptoms = data["symptoms"]
        moods = data["moods"]
        patient = data["patient"]
        
        # Mental health risk assessment
        if moods:
            mental_health_risk = self._assess_mental_health_risk(moods, symptoms)
            risk_assessments.append({
                "risk_category": "mental_health",
                "risk_level": mental_health_risk["level"],
                "risk_score": mental_health_risk["score"],
                "risk_factors": mental_health_risk["factors"],
                "protective_factors": mental_health_risk["protective"],
                "description": mental_health_risk["description"],
                "recommendations": mental_health_risk["recommendations"],
                "next_assessment_date": (date.today() + timedelta(days=30)).isoformat()
            })
        
        # Cardiovascular risk (basic assessment)
        cardio_risk = self._assess_cardiovascular_risk(data)
        if cardio_risk:
            risk_assessments.append(cardio_risk)
        
        return risk_assessments
    
    def _generate_health_predictions(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate health predictions
        """
        predictions = []
        moods = data["moods"]
        symptoms = data["symptoms"]
        
        # Predict mood improvement with intervention
        if moods and len(moods) >= 5:
            mood_prediction = self._predict_mood_improvement(moods)
            predictions.append({
                "prediction_type": "mood_improvement",
                "outcome": "Mood improvement with consistent self-care",
                "probability": mood_prediction["probability"],
                "confidence_interval": mood_prediction["confidence_interval"],
                "prediction_horizon": "3_months",
                "predicted_date": (date.today() + timedelta(days=90)).isoformat(),
                "explanation": mood_prediction["explanation"],
                "features_used": ["recent_mood_scores", "trend_analysis", "activity_levels"]
            })
        
        return predictions
    
    def _generate_personalized_metrics(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate personalized health metrics and targets
        """
        metrics = []
        moods = data["moods"]
        activities = data["activities"]
        
        # Mood target
        if moods:
            current_avg_mood = np.mean([m.mood_score for m in moods[-7:]]) if len(moods) >= 7 else 5
            target_mood = min(current_avg_mood + 1.5, 9)
            
            metrics.append({
                "metric_name": "daily_mood_score",
                "current_value": round(current_avg_mood, 1),
                "target_value": round(target_mood, 1),
                "optimal_range_min": 6.0,
                "optimal_range_max": 9.0,
                "unit": "score",
                "baseline_value": round(current_avg_mood, 1),
                "improvement_rate": 0.1,  # Expected improvement per week
                "difficulty_level": "moderate",
                "target_date": (date.today() + timedelta(days=60)).isoformat()
            })
        
        # Exercise frequency
        if activities:
            exercise_activities = [a for a in activities if a.activity_type == "exercise"]
            current_frequency = len(exercise_activities) / 12 if len(exercise_activities) > 0 else 0  # per week approximation
            target_frequency = max(current_frequency + 1, 3)
            
            metrics.append({
                "metric_name": "weekly_exercise_sessions",
                "current_value": round(current_frequency, 1),
                "target_value": round(target_frequency, 1),
                "optimal_range_min": 3.0,
                "optimal_range_max": 6.0,
                "unit": "sessions",
                "baseline_value": round(current_frequency, 1),
                "improvement_rate": 0.5,  # Expected improvement per week
                "difficulty_level": "moderate",
                "target_date": (date.today() + timedelta(days=30)).isoformat()
            })
        
        return metrics
    
    # Analysis helper methods
    def _analyze_symptoms(self, symptoms: List[SymptomEntry]) -> Dict[str, Any]:
        """Analyze symptom patterns"""
        if not symptoms:
            return {"avg_severity": 0, "frequent_symptoms": {}}
        
        severities = [s.severity for s in symptoms]
        symptom_counts = {}
        
        for symptom in symptoms:
            name = symptom.symptom_name.lower()
            symptom_counts[name] = symptom_counts.get(name, 0) + 1
        
        return {
            "avg_severity": np.mean(severities),
            "max_severity": max(severities),
            "frequent_symptoms": symptom_counts,
            "total_entries": len(symptoms)
        }
    
    def _analyze_moods(self, moods: List[MoodEntry]) -> Dict[str, Any]:
        """Analyze mood patterns"""
        if not moods:
            return {"avg_mood": 5, "avg_stress": 5, "avg_energy": 5}
        
        mood_scores = [m.mood_score for m in moods]
        stress_scores = [m.stress_level for m in moods if m.stress_level]
        energy_scores = [m.energy_level for m in moods if m.energy_level]
        
        return {
            "avg_mood": np.mean(mood_scores),
            "avg_stress": np.mean(stress_scores) if stress_scores else 5,
            "avg_energy": np.mean(energy_scores) if energy_scores else 5,
            "total_entries": len(moods)
        }
    
    def _analyze_activities(self, activities: List[ActivityEntry]) -> Dict[str, Any]:
        """Analyze activity patterns"""
        if not activities:
            return {"exercise_frequency": 0, "total_activities": 0}
        
        exercise_count = len([a for a in activities if a.activity_type == "exercise"])
        weeks = 12  # Approximate weeks in 90 days
        
        return {
            "exercise_frequency": exercise_count / weeks,
            "total_activities": len(activities),
            "activity_types": list(set(a.activity_type for a in activities))
        }
    
    def _calculate_symptom_mood_correlation(self, symptoms: List[SymptomEntry], moods: List[MoodEntry]) -> float:
        """Calculate correlation between symptoms and mood"""
        if len(symptoms) < 3 or len(moods) < 3:
            return 0.0
        
        # Create daily averages
        symptom_dates = {}
        mood_dates = {}
        
        for s in symptoms:
            date_key = s.created_at.date()
            if date_key not in symptom_dates:
                symptom_dates[date_key] = []
            symptom_dates[date_key].append(s.severity)
        
        for m in moods:
            date_key = m.created_at.date()
            if date_key not in mood_dates:
                mood_dates[date_key] = []
            mood_dates[date_key].append(m.mood_score)
        
        # Find common dates
        common_dates = set(symptom_dates.keys()) & set(mood_dates.keys())
        if len(common_dates) < 3:
            return 0.0
        
        symptom_values = []
        mood_values = []
        
        for date_key in common_dates:
            symptom_values.append(np.mean(symptom_dates[date_key]))
            mood_values.append(np.mean(mood_dates[date_key]))
        
        return np.corrcoef(symptom_values, mood_values)[0, 1] if len(symptom_values) > 1 else 0.0
    
    def _calculate_activity_mood_correlation(self, activities: List[ActivityEntry], moods: List[MoodEntry]) -> float:
        """Calculate correlation between exercise activities and mood"""
        if len(activities) < 3 or len(moods) < 3:
            return 0.0
        
        # Similar to symptom-mood correlation but for exercise
        exercise_dates = {}
        mood_dates = {}
        
        for a in activities:
            if a.activity_type == "exercise":
                date_key = a.created_at.date()
                exercise_dates[date_key] = exercise_dates.get(date_key, 0) + 1
        
        for m in moods:
            date_key = m.created_at.date()
            if date_key not in mood_dates:
                mood_dates[date_key] = []
            mood_dates[date_key].append(m.mood_score)
        
        # Find common dates
        common_dates = set(exercise_dates.keys()) & set(mood_dates.keys())
        if len(common_dates) < 3:
            return 0.0
        
        exercise_values = []
        mood_values = []
        
        for date_key in common_dates:
            exercise_values.append(exercise_dates[date_key])
            mood_values.append(np.mean(mood_dates[date_key]))
        
        return np.corrcoef(exercise_values, mood_values)[0, 1] if len(exercise_values) > 1 else 0.0
    
    def _calculate_mood_trend(self, moods: List[MoodEntry]) -> Dict[str, Any]:
        """Calculate mood trend over time"""
        if len(moods) < 7:
            return {"direction": "stable", "description": "Insufficient data for trend analysis"}
        
        # Sort by date and take recent scores
        recent_moods = sorted(moods[-14:], key=lambda x: x.created_at)
        scores = [m.mood_score for m in recent_moods]
        
        # Simple linear trend
        x = np.arange(len(scores))
        slope = np.polyfit(x, scores, 1)[0]
        
        if slope > 0.1:
            direction = "increasing"
            description = "Your mood has been improving over time. Keep up the positive momentum!"
        elif slope < -0.1:
            direction = "decreasing"
            description = "Your mood has been declining. Consider implementing stress management techniques or speaking with a healthcare provider."
        else:
            direction = "stable"
            description = "Your mood has been relatively stable. Focus on maintaining your current wellness practices."
        
        return {
            "direction": direction,
            "description": description,
            "slope": slope
        }
    
    def _assess_mental_health_risk(self, moods: List[MoodEntry], symptoms: List[SymptomEntry]) -> Dict[str, Any]:
        """Assess mental health risk"""
        risk_score = 0.0
        risk_factors = []
        protective_factors = []
        
        if moods:
            avg_mood = np.mean([m.mood_score for m in moods])
            avg_stress = np.mean([m.stress_level for m in moods if m.stress_level])
            
            # Risk factors
            if avg_mood < 4:
                risk_score += 0.3
                risk_factors.append("Consistently low mood scores")
            
            if avg_stress > 7:
                risk_score += 0.2
                risk_factors.append("High stress levels")
            
            # Protective factors
            if avg_mood > 6:
                protective_factors.append("Generally positive mood")
            
            if avg_stress < 5:
                protective_factors.append("Manageable stress levels")
        
        # Determine risk level
        if risk_score < 0.3:
            risk_level = "low"
        elif risk_score < 0.5:
            risk_level = "moderate"
        elif risk_score < 0.7:
            risk_level = "high"
        else:
            risk_level = "very_high"
        
        descriptions = {
            "low": "Your mental health indicators appear stable with low risk factors.",
            "moderate": "Some mental health concerns detected. Consider preventive measures.",
            "high": "Several mental health risk factors present. Professional support recommended.",
            "very_high": "Significant mental health concerns. Immediate professional support advised."
        }
        
        recommendations = {
            "low": ["Continue current wellness practices", "Regular exercise", "Adequate sleep"],
            "moderate": ["Stress management techniques", "Mindfulness practice", "Social support"],
            "high": ["Professional counseling", "Stress reduction strategies", "Regular monitoring"],
            "very_high": ["Immediate mental health professional consultation", "Crisis support resources", "Close monitoring"]
        }
        
        return {
            "level": risk_level,
            "score": risk_score,
            "factors": risk_factors,
            "protective": protective_factors,
            "description": descriptions[risk_level],
            "recommendations": recommendations[risk_level]
        }
    
    def _assess_cardiovascular_risk(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Basic cardiovascular risk assessment"""
        activities = data["activities"]
        
        if not activities:
            return None
        
        exercise_count = len([a for a in activities if a.activity_type == "exercise"])
        risk_score = max(0.0, 0.5 - (exercise_count * 0.05))  # Lower risk with more exercise
        
        if risk_score < 0.3:
            risk_level = "low"
        elif risk_score < 0.5:
            risk_level = "moderate"
        else:
            risk_level = "high"
        
        return {
            "risk_category": "cardiovascular",
            "risk_level": risk_level,
            "risk_score": risk_score,
            "risk_factors": ["Sedentary lifestyle"] if exercise_count < 10 else [],
            "protective_factors": ["Regular exercise"] if exercise_count >= 10 else [],
            "description": f"Based on exercise frequency. {exercise_count} exercise sessions recorded.",
            "recommendations": ["Increase physical activity", "Monitor blood pressure", "Heart-healthy diet"],
            "next_assessment_date": (date.today() + timedelta(days=90)).isoformat()
        }
    
    def _predict_mood_improvement(self, moods: List[MoodEntry]) -> Dict[str, Any]:
        """Predict mood improvement probability"""
        recent_scores = [m.mood_score for m in moods[-10:]]
        current_avg = np.mean(recent_scores)
        
        # Simple prediction based on current state
        if current_avg >= 7:
            probability = 0.8  # Already good mood, likely to maintain
        elif current_avg >= 5:
            probability = 0.7  # Moderate mood, good improvement potential
        else:
            probability = 0.6  # Low mood, requires intervention
        
        confidence_interval = [probability - 0.1, probability + 0.1]
        
        explanation = f"Based on current mood average of {current_avg:.1f}, consistent self-care practices have a {probability*100:.0f}% chance of improving your mood within 3 months."
        
        return {
            "probability": probability,
            "confidence_interval": confidence_interval,
            "explanation": explanation
        }
    
    # Database saving methods
    def _save_recommendations(self, patient_id: int, recommendations: List[Dict[str, Any]]):
        """Save recommendations to database"""
        for rec_data in recommendations:
            recommendation = HealthRecommendation(
                patient_id=patient_id,
                category=rec_data["category"],
                title=rec_data["title"],
                description=rec_data["description"],
                priority=rec_data["priority"],
                confidence_score=rec_data["confidence_score"],
                reasoning=rec_data["reasoning"],
                data_sources=rec_data["data_sources"],
                target_date=datetime.fromisoformat(rec_data["target_date"]).date() if rec_data.get("target_date") else None
            )
            db.session.add(recommendation)
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error saving recommendations: {str(e)}")
    
    def _save_insights(self, patient_id: int, insights: List[Dict[str, Any]]):
        """Save insights to database"""
        for insight_data in insights:
            insight = HealthInsight(
                patient_id=patient_id,
                insight_type=insight_data["insight_type"],
                title=insight_data["title"],
                description=insight_data["description"],
                severity=insight_data["severity"],
                metrics_analyzed=insight_data["metrics_analyzed"],
                time_period=insight_data["time_period"],
                correlation_strength=insight_data.get("correlation_strength"),
                trend_direction=insight_data.get("trend_direction"),
                expires_at=datetime.utcnow() + timedelta(days=30)
            )
            db.session.add(insight)
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error saving insights: {str(e)}")
    
    def _save_risk_assessments(self, patient_id: int, assessments: List[Dict[str, Any]]):
        """Save risk assessments to database"""
        for assessment_data in assessments:
            assessment = RiskAssessment(
                patient_id=patient_id,
                risk_category=assessment_data["risk_category"],
                risk_level=assessment_data["risk_level"],
                risk_score=assessment_data["risk_score"],
                risk_factors=assessment_data["risk_factors"],
                protective_factors=assessment_data["protective_factors"],
                description=assessment_data["description"],
                recommendations=assessment_data["recommendations"],
                next_assessment_date=datetime.fromisoformat(assessment_data["next_assessment_date"]).date()
            )
            db.session.add(assessment)
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error saving risk assessments: {str(e)}")
    
    def _save_predictions(self, patient_id: int, predictions: List[Dict[str, Any]]):
        """Save predictions to database"""
        for prediction_data in predictions:
            prediction = HealthPrediction(
                patient_id=patient_id,
                prediction_type=prediction_data["prediction_type"],
                outcome=prediction_data["outcome"],
                probability=prediction_data["probability"],
                confidence_interval=prediction_data["confidence_interval"],
                prediction_horizon=prediction_data["prediction_horizon"],
                predicted_date=datetime.fromisoformat(prediction_data["predicted_date"]).date(),
                features_used=prediction_data["features_used"],
                explanation=prediction_data["explanation"],
                model_version="1.0"
            )
            db.session.add(prediction)
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error saving predictions: {str(e)}")
    
    def _save_personalized_metrics(self, patient_id: int, metrics: List[Dict[str, Any]]):
        """Save personalized metrics to database"""
        for metric_data in metrics:
            # Check if metric already exists
            existing = PersonalizedMetric.query.filter_by(
                patient_id=patient_id,
                metric_name=metric_data["metric_name"]
            ).first()
            
            if existing:
                # Update existing metric
                existing.current_value = metric_data["current_value"]
                existing.target_value = metric_data["target_value"]
                existing.target_date = datetime.fromisoformat(metric_data["target_date"]).date()
                existing.updated_at = datetime.utcnow()
            else:
                # Create new metric
                metric = PersonalizedMetric(
                    patient_id=patient_id,
                    metric_name=metric_data["metric_name"],
                    current_value=metric_data["current_value"],
                    target_value=metric_data["target_value"],
                    optimal_range_min=metric_data["optimal_range_min"],
                    optimal_range_max=metric_data["optimal_range_max"],
                    unit=metric_data["unit"],
                    baseline_value=metric_data["baseline_value"],
                    improvement_rate=metric_data["improvement_rate"],
                    difficulty_level=metric_data["difficulty_level"],
                    target_date=datetime.fromisoformat(metric_data["target_date"]).date()
                )
                db.session.add(metric)
        
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error saving personalized metrics: {str(e)}")


# Initialize the recommendation engine
recommendation_engine = LeapFrogRecommendationEngine()
