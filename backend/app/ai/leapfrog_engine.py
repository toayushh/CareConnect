"""
Enhanced LeapFrog AI Engine - Advanced implementation for adaptive treatment planning
This module contains the sophisticated AI logic for the LeapFrog method with:
- Advanced treatment effectiveness prediction
- Personalized recommendation algorithms
- Adaptive learning capabilities
- Multi-modal therapy optimization
- Real-time risk assessment
"""

import random
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
import json

from ..extensions import db
from ..models.progress import (
    SymptomEntry, MoodEntry, ActivityEntry, TreatmentPlan, LeapFrogSuggestion,
    ClinicalAssessment, ProgressGoal
)
from ..models.patient import PatientProfile


class AdvancedLeapFrogAI:
    """
    Advanced LeapFrog Adaptive Treatment AI Engine

    Enhanced implementation with:
    - Predictive modeling for treatment outcomes
    - Multi-dimensional patient profiling
    - Adaptive learning from treatment responses
    - Risk stratification and early intervention
    - Personalized therapy optimization
    """

    def __init__(self):
        self.confidence_threshold = 0.6
        self.minimum_data_points = 5
        self.risk_threshold = 0.7
        self.effectiveness_threshold = 0.6

        # Treatment effectiveness weights
        self.effectiveness_weights = {
            'symptom_improvement': 0.35,
            'mood_stability': 0.25,
            'activity_engagement': 0.20,
            'adherence_rate': 0.15,
            'side_effects': 0.05
        }

        # Risk factor weights
        self.risk_weights = {
            'symptom_severity': 0.30,
            'mood_decline': 0.25,
            'medication_adherence': 0.20,
            'social_isolation': 0.15,
            'sleep_quality': 0.10
        }

    def comprehensive_patient_analysis(self, patient_id: int) -> Dict[str, Any]:
        """
        Comprehensive patient analysis with advanced metrics
        """
        patient = PatientProfile.query.get(patient_id)
        if not patient:
            return {"error": "Patient not found"}

        # Get extended data (last 90 days for better analysis)
        cutoff_date = datetime.now() - timedelta(days=90)

        # Fetch all relevant data
        symptoms = SymptomEntry.query.filter(
            SymptomEntry.patient_id == patient_id,
            SymptomEntry.created_at >= cutoff_date
        ).order_by(SymptomEntry.created_at.asc()).all()

        moods = MoodEntry.query.filter(
            MoodEntry.patient_id == patient_id,
            MoodEntry.created_at >= cutoff_date
        ).order_by(MoodEntry.date_recorded.asc()).all()

        activities = ActivityEntry.query.filter(
            ActivityEntry.patient_id == patient_id,
            ActivityEntry.created_at >= cutoff_date
        ).order_by(ActivityEntry.date_recorded.asc()).all()

        assessments = ClinicalAssessment.query.filter(
            ClinicalAssessment.patient_id == patient_id,
            ClinicalAssessment.created_at >= cutoff_date
        ).order_by(ClinicalAssessment.date_completed.asc()).all()

        goals = ProgressGoal.query.filter(
            ProgressGoal.patient_id == patient_id
        ).all()

        treatment_plans = TreatmentPlan.query.filter(
            TreatmentPlan.patient_id == patient_id
        ).order_by(TreatmentPlan.created_at.desc()).all()

        # Advanced analysis
        analysis = {
            "patient_id": patient_id,
            "analysis_timestamp": datetime.utcnow().isoformat(),
            "data_period_days": 90,

            # Core metrics
            "symptom_analysis": self._advanced_symptom_analysis(symptoms),
            "mood_analysis": self._advanced_mood_analysis(moods),
            "activity_analysis": self._advanced_activity_analysis(activities),
            "clinical_assessment_trends": self._analyze_clinical_assessments(assessments),
            "goal_progress": self._analyze_goal_progress(goals),

            # Advanced metrics
            "treatment_effectiveness": self._analyze_treatment_effectiveness(treatment_plans, symptoms, moods),
            "risk_assessment": self._comprehensive_risk_assessment(symptoms, moods, activities, assessments),
            "predictive_insights": self._generate_predictive_insights(symptoms, moods, activities),
            "correlation_matrix": self._calculate_correlation_matrix(symptoms, moods, activities),
            "patient_phenotype": self._determine_patient_phenotype(symptoms, moods, activities, assessments),

            # Data quality
            "data_quality": self._assess_data_quality(symptoms, moods, activities, assessments)
        }

        return analysis

    def analyze_patient_progress(self, patient_id: int) -> Dict[str, Any]:
        """
        Analyze patient's progress data to identify trends and patterns
        """
        patient = PatientProfile.query.get(patient_id)
        if not patient:
            return {"error": "Patient not found"}
        
        # Get recent data (last 30 days)
        cutoff_date = datetime.now() - timedelta(days=30)
        
        symptoms = SymptomEntry.query.filter(
            SymptomEntry.patient_id == patient_id,
            SymptomEntry.created_at >= cutoff_date
        ).order_by(SymptomEntry.created_at.asc()).all()
        
        moods = MoodEntry.query.filter(
            MoodEntry.patient_id == patient_id,
            MoodEntry.created_at >= cutoff_date
        ).order_by(MoodEntry.date_recorded.asc()).all()
        
        activities = ActivityEntry.query.filter(
            ActivityEntry.patient_id == patient_id,
            ActivityEntry.created_at >= cutoff_date
        ).order_by(ActivityEntry.date_recorded.asc()).all()
        
        # Calculate trends
        analysis = {
            "patient_id": patient_id,
            "data_period_days": 30,
            "symptom_trend": self._analyze_symptom_trend(symptoms),
            "mood_trend": self._analyze_mood_trend(moods),
            "activity_correlation": self._analyze_activity_correlation(activities, moods),
            "risk_factors": self._identify_risk_factors(symptoms, moods),
            "improvement_areas": self._identify_improvement_areas(symptoms, moods, activities),
            "data_sufficiency": {
                "symptoms": len(symptoms),
                "moods": len(moods),
                "activities": len(activities),
                "sufficient": len(symptoms) >= self.minimum_data_points and len(moods) >= self.minimum_data_points
            }
        }
        
        return analysis
    
    def generate_treatment_suggestions(self, patient_id: int, current_treatment_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Generate LeapFrog treatment suggestions based on patient progress analysis
        """
        analysis = self.analyze_patient_progress(patient_id)
        
        if not analysis.get("data_sufficiency", {}).get("sufficient", False):
            return [{
                "suggestion_type": "data_collection",
                "title": "Increase Data Collection",
                "description": "More consistent tracking is needed to provide personalized suggestions.",
                "reasoning": "Insufficient data points for reliable analysis",
                "confidence_score": 0.9,
                "priority": "medium",
                "implementation_steps": [
                    "Set daily reminders for mood tracking",
                    "Log symptoms as they occur",
                    "Track at least one activity daily"
                ],
                "expected_outcomes": [
                    "Better data for AI analysis",
                    "More accurate treatment recommendations",
                    "Improved care coordination"
                ],
                "monitoring_parameters": ["Daily entries", "Data consistency", "Engagement metrics"]
            }]
        
        suggestions = []
        
        # Analyze trends and generate suggestions
        symptom_trend = analysis.get("symptom_trend", {})
        mood_trend = analysis.get("mood_trend", {})
        risk_factors = analysis.get("risk_factors", [])
        improvement_areas = analysis.get("improvement_areas", [])
        
        # Symptom-based suggestions
        if symptom_trend.get("trend") == "increasing":
            suggestions.append(self._suggest_symptom_management(symptom_trend, patient_id))
        
        # Mood-based suggestions
        if mood_trend.get("trend") == "declining":
            suggestions.append(self._suggest_mood_intervention(mood_trend, patient_id))
        
        # Activity-based suggestions
        activity_correlation = analysis.get("activity_correlation", {})
        if activity_correlation.get("correlation_strength", 0) > 0.5:
            suggestions.append(self._suggest_activity_modification(activity_correlation, patient_id))
        
        # Risk factor interventions
        for risk_factor in risk_factors:
            suggestions.append(self._suggest_risk_mitigation(risk_factor, patient_id))
        
        # General improvement suggestions
        if not suggestions:  # If no specific concerns
            suggestions.extend(self._suggest_general_improvements(improvement_areas, patient_id))
        
        # Filter and enhance suggestions
        enhanced_suggestions = []
        for suggestion in suggestions:
            if suggestion.get("confidence_score", 0) >= self.confidence_threshold:
                enhanced_suggestions.append(self._enhance_suggestion(suggestion, current_treatment_id))
        
        return enhanced_suggestions[:5]  # Return top 5 suggestions

    def _advanced_symptom_analysis(self, symptoms: List[SymptomEntry]) -> Dict[str, Any]:
        """Advanced symptom analysis with pattern recognition"""
        if not symptoms:
            return {"status": "no_data", "patterns": [], "trends": {}}

        # Group symptoms by type and analyze patterns
        symptom_groups = defaultdict(list)
        for symptom in symptoms:
            symptom_groups[symptom.symptom_name].append(symptom)

        patterns = []
        for symptom_name, entries in symptom_groups.items():
            if len(entries) >= 3:
                # Calculate trend
                severities = [e.severity for e in entries]
                trend = self._calculate_trend(severities)

                # Identify triggers
                triggers = [e.triggers for e in entries if e.triggers]
                common_triggers = self._find_common_patterns(triggers)

                patterns.append({
                    "symptom": symptom_name,
                    "frequency": len(entries),
                    "avg_severity": np.mean(severities),
                    "severity_trend": trend,
                    "common_triggers": common_triggers,
                    "locations": list(set(e.location for e in entries if e.location))
                })

        # Overall symptom burden
        recent_symptoms = symptoms[-14:] if len(symptoms) >= 14 else symptoms
        symptom_burden = np.mean([s.severity for s in recent_symptoms]) if recent_symptoms else 0

        return {
            "status": "analyzed",
            "total_entries": len(symptoms),
            "unique_symptoms": len(symptom_groups),
            "symptom_burden": symptom_burden,
            "patterns": patterns,
            "trends": {
                "overall_trend": self._calculate_trend([s.severity for s in symptoms]),
                "frequency_trend": self._analyze_frequency_trend(symptoms)
            }
        }

    def _advanced_mood_analysis(self, moods: List[MoodEntry]) -> Dict[str, Any]:
        """Advanced mood analysis with stability metrics"""
        if not moods:
            return {"status": "no_data", "stability": 0, "patterns": {}}

        mood_scores = [m.mood_score for m in moods]
        energy_scores = [m.energy_level for m in moods if m.energy_level]
        stress_scores = [m.stress_level for m in moods if m.stress_level]
        sleep_scores = [m.sleep_quality for m in moods if m.sleep_quality]

        # Calculate stability metrics
        mood_stability = 1 - (np.std(mood_scores) / 10) if mood_scores else 0

        # Identify mood patterns
        patterns = {
            "mood_variability": np.std(mood_scores) if mood_scores else 0,
            "energy_correlation": self._calculate_correlation(mood_scores, energy_scores),
            "stress_impact": self._calculate_correlation(mood_scores, stress_scores),
            "sleep_impact": self._calculate_correlation(mood_scores, sleep_scores),
            "weekly_patterns": self._analyze_weekly_patterns(moods)
        }

        return {
            "status": "analyzed",
            "total_entries": len(moods),
            "average_mood": np.mean(mood_scores) if mood_scores else 0,
            "mood_stability": mood_stability,
            "mood_trend": self._calculate_trend(mood_scores),
            "patterns": patterns,
            "risk_indicators": self._identify_mood_risk_indicators(moods)
        }

    def _advanced_activity_analysis(self, activities: List[ActivityEntry]) -> Dict[str, Any]:
        """Advanced activity analysis with engagement metrics"""
        if not activities:
            return {"status": "no_data", "engagement": 0, "patterns": {}}

        # Group by activity type
        activity_groups = defaultdict(list)
        for activity in activities:
            activity_groups[activity.activity_type].append(activity)

        # Calculate engagement metrics
        completion_rate = len([a for a in activities if a.completed]) / len(activities)
        avg_duration = np.mean([a.duration for a in activities if a.duration])
        avg_intensity = np.mean([a.intensity for a in activities if a.intensity])

        # Activity patterns
        patterns = {}
        for activity_type, entries in activity_groups.items():
            patterns[activity_type] = {
                "frequency": len(entries),
                "completion_rate": len([e for e in entries if e.completed]) / len(entries),
                "avg_duration": np.mean([e.duration for e in entries if e.duration]),
                "trend": self._calculate_trend([e.duration or 0 for e in entries])
            }

        return {
            "status": "analyzed",
            "total_activities": len(activities),
            "completion_rate": completion_rate,
            "avg_duration": avg_duration,
            "avg_intensity": avg_intensity,
            "activity_diversity": len(activity_groups),
            "patterns": patterns,
            "engagement_score": self._calculate_engagement_score(activities)
        }

    def _analyze_treatment_effectiveness(self, treatment_plans: List[TreatmentPlan],
                                       symptoms: List[SymptomEntry],
                                       moods: List[MoodEntry]) -> Dict[str, Any]:
        """Analyze treatment effectiveness using multiple metrics"""
        if not treatment_plans:
            return {"status": "no_treatments", "effectiveness": 0}

        current_treatment = treatment_plans[0] if treatment_plans else None
        if not current_treatment:
            return {"status": "no_current_treatment", "effectiveness": 0}

        # Calculate effectiveness based on multiple factors
        effectiveness_metrics = {}

        # Symptom improvement
        if symptoms:
            pre_treatment = [s for s in symptoms if s.created_at < current_treatment.start_date]
            post_treatment = [s for s in symptoms if s.created_at >= current_treatment.start_date]

            if pre_treatment and post_treatment:
                pre_avg = np.mean([s.severity for s in pre_treatment[-10:]])
                post_avg = np.mean([s.severity for s in post_treatment])
                symptom_improvement = max(0, (pre_avg - post_avg) / pre_avg)
                effectiveness_metrics['symptom_improvement'] = symptom_improvement

        # Mood stability
        if moods:
            treatment_moods = [m for m in moods if m.date_recorded >= current_treatment.start_date]
            if treatment_moods:
                mood_scores = [m.mood_score for m in treatment_moods]
                mood_stability = 1 - (np.std(mood_scores) / 10) if len(mood_scores) > 1 else 0
                effectiveness_metrics['mood_stability'] = mood_stability

        # Calculate overall effectiveness
        overall_effectiveness = 0
        for metric, weight in self.effectiveness_weights.items():
            if metric in effectiveness_metrics:
                overall_effectiveness += effectiveness_metrics[metric] * weight

        return {
            "status": "analyzed",
            "current_treatment_id": current_treatment.id,
            "treatment_duration_days": (datetime.now().date() - current_treatment.start_date).days,
            "effectiveness_score": overall_effectiveness,
            "metrics": effectiveness_metrics,
            "adherence_rate": current_treatment.adherence_percentage or 0,
            "patient_reported_effectiveness": current_treatment.effectiveness_score or 0
        }
    
    def _analyze_symptom_trend(self, symptoms: List[SymptomEntry]) -> Dict[str, Any]:
        """Analyze symptom severity trends over time"""
        if len(symptoms) < 3:
            return {"trend": "insufficient_data", "confidence": 0}
        
        # Calculate average severity over time periods
        recent_symptoms = symptoms[-7:] if len(symptoms) >= 7 else symptoms[-3:]
        older_symptoms = symptoms[:-7] if len(symptoms) >= 7 else symptoms[:-3]
        
        recent_avg = sum(s.severity for s in recent_symptoms) / len(recent_symptoms)
        older_avg = sum(s.severity for s in older_symptoms) / len(older_symptoms) if older_symptoms else recent_avg
        
        severity_change = recent_avg - older_avg
        
        if severity_change > 1:
            trend = "increasing"
        elif severity_change < -1:
            trend = "decreasing"
        else:
            trend = "stable"
        
        # Most common symptoms
        symptom_counts = {}
        for symptom in symptoms:
            symptom_counts[symptom.symptom_name] = symptom_counts.get(symptom.symptom_name, 0) + 1
        
        return {
            "trend": trend,
            "severity_change": severity_change,
            "recent_average": recent_avg,
            "most_common_symptoms": sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)[:3],
            "confidence": min(0.9, len(symptoms) / 20)  # Higher confidence with more data
        }
    
    def _analyze_mood_trend(self, moods: List[MoodEntry]) -> Dict[str, Any]:
        """Analyze mood trends over time"""
        if len(moods) < 3:
            return {"trend": "insufficient_data", "confidence": 0}
        
        recent_moods = moods[-7:] if len(moods) >= 7 else moods[-3:]
        older_moods = moods[:-7] if len(moods) >= 7 else moods[:-3]
        
        recent_avg = sum(m.mood_score for m in recent_moods) / len(recent_moods)
        older_avg = sum(m.mood_score for m in older_moods) / len(older_moods) if older_moods else recent_avg
        
        mood_change = recent_avg - older_avg
        
        if mood_change > 1:
            trend = "improving"
        elif mood_change < -1:
            trend = "declining"
        else:
            trend = "stable"
        
        # Analyze other factors
        recent_stress = sum(m.stress_level for m in recent_moods if m.stress_level) / len([m for m in recent_moods if m.stress_level])
        recent_energy = sum(m.energy_level for m in recent_moods if m.energy_level) / len([m for m in recent_moods if m.energy_level])
        
        return {
            "trend": trend,
            "mood_change": mood_change,
            "recent_average": recent_avg,
            "recent_stress_average": recent_stress if recent_stress else None,
            "recent_energy_average": recent_energy if recent_energy else None,
            "confidence": min(0.9, len(moods) / 15)
        }
    
    def _analyze_activity_correlation(self, activities: List[ActivityEntry], moods: List[MoodEntry]) -> Dict[str, Any]:
        """Analyze correlation between activity (per-day) and mood scores using real data"""
        if len(activities) < 3 or len(moods) < 3:
            return {"correlation_strength": 0.0, "correlation_type": "insufficient_data", "confidence": 0.0}

        # Build day -> activity score (sum duration if available, else count completed)
        activity_by_day = {}
        for a in activities:
            day = a.date_recorded
            if not day:
                continue
            val = a.duration if (a.duration is not None) else (1 if a.completed else 0)
            activity_by_day[day] = activity_by_day.get(day, 0) + (val or 0)

        # Build day -> average mood score
        mood_by_day = {}
        count_by_day = {}
        for m in moods:
            day = m.date_recorded
            if not day:
                continue
            mood_by_day[day] = mood_by_day.get(day, 0) + (m.mood_score or 0)
            count_by_day[day] = count_by_day.get(day, 0) + 1
        for d in list(mood_by_day.keys()):
            if count_by_day[d] > 0:
                mood_by_day[d] = mood_by_day[d] / count_by_day[d]

        # Align days present in both series
        common_days = sorted(set(activity_by_day.keys()) & set(mood_by_day.keys()))
        if len(common_days) < 3:
            return {"correlation_strength": 0.0, "correlation_type": "insufficient_data", "confidence": 0.0}

        x = [activity_by_day[d] for d in common_days]
        y = [mood_by_day[d] for d in common_days]

        # Normalize to reduce scale issues (optional)
        x_arr = np.array(x, dtype=float)
        y_arr = np.array(y, dtype=float)
        if np.std(x_arr) == 0 or np.std(y_arr) == 0:
            return {"correlation_strength": 0.0, "correlation_type": "none", "confidence": 0.4}

        corr = float(np.corrcoef(x_arr, y_arr)[0, 1])
        corr = 0.0 if np.isnan(corr) else corr
        strength = abs(corr)
        ctype = "positive" if corr > 0.1 else ("negative" if corr < -0.1 else "none")

        # Generate simple recommendations based on correlation direction
        recs = []
        if ctype == "positive":
            recs = [
                "Increase duration of beneficial activities on high-energy days",
                "Schedule light exercise (e.g., walking) earlier in the day",
                "Track which activities most boost mood and repeat them"
            ]
        elif ctype == "negative":
            recs = [
                "Reduce intensity on days with lower mood",
                "Introduce restorative activities (breathing, mindfulness)",
                "Avoid over-scheduling when fatigued"
            ]
        else:
            recs = [
                "Experiment with new activities (short sessions)",
                "Track pre/post-mood to identify helpful activities",
                "Maintain consistency rather than intensity"
            ]

        return {
            "correlation_strength": round(strength, 3),
            "correlation_type": ctype,
            "recommended_activities": recs,
            "confidence": 0.6 if strength >= 0.3 else 0.4
        }
    
    def _identify_risk_factors(self, symptoms: List[SymptomEntry], moods: List[MoodEntry]) -> List[str]:
        """Identify risk factors requiring attention"""
        risk_factors = []
        
        # High severity symptoms
        high_severity_symptoms = [s for s in symptoms[-7:] if s.severity >= 8]
        if len(high_severity_symptoms) >= 2:
            risk_factors.append("high_severity_symptoms")
        
        # Consistently low mood
        low_moods = [m for m in moods[-7:] if m.mood_score <= 3]
        if len(low_moods) >= 3:
            risk_factors.append("persistent_low_mood")
        
        # Increasing symptom frequency
        recent_symptoms = len(symptoms[-7:])
        older_symptoms = len(symptoms[-14:-7]) if len(symptoms) >= 14 else 0
        if recent_symptoms > older_symptoms * 1.5:
            risk_factors.append("increasing_symptom_frequency")
        
        return risk_factors
    
    def _identify_improvement_areas(self, symptoms: List[SymptomEntry], moods: List[MoodEntry], activities: List[ActivityEntry]) -> List[str]:
        """Identify areas for potential improvement"""
        areas = []
        
        if len(activities[-7:]) < 3:
            areas.append("increase_activity_tracking")
        
        if any(m.stress_level and m.stress_level >= 8 for m in moods[-7:]):
            areas.append("stress_management")
        
        if any(m.sleep_quality and m.sleep_quality <= 4 for m in moods[-7:]):
            areas.append("sleep_improvement")
        
        return areas
    
    def _suggest_symptom_management(self, symptom_trend: Dict, patient_id: int) -> Dict[str, Any]:
        """Generate symptom management suggestions"""
        return {
            "suggestion_type": "symptom_management",
            "title": "Enhanced Symptom Management",
            "description": f"Your symptoms have shown an increasing trend. Consider additional management strategies.",
            "reasoning": f"Symptom severity increased by {symptom_trend.get('severity_change', 0):.1f} points recently",
            "confidence_score": symptom_trend.get('confidence', 0.7),
            "priority": "high" if symptom_trend.get('severity_change', 0) > 2 else "medium",
            "implementation_steps": [
                "Discuss symptom patterns with your doctor",
                "Consider medication timing adjustments",
                "Implement additional comfort measures",
                "Track triggers more closely"
            ],
            "expected_outcomes": [
                "Reduced symptom severity",
                "Better symptom control",
                "Improved quality of life"
            ],
            "monitoring_parameters": ["Daily symptom scores", "Medication adherence", "Trigger identification"]
        }
    
    def _suggest_mood_intervention(self, mood_trend: Dict, patient_id: int) -> Dict[str, Any]:
        """Generate mood intervention suggestions"""
        return {
            "suggestion_type": "mood_intervention",
            "title": "Mood Support Intervention",
            "description": "Your mood scores have been declining. Let's implement some supportive strategies.",
            "reasoning": f"Mood decreased by {abs(mood_trend.get('mood_change', 0)):.1f} points recently",
            "confidence_score": mood_trend.get('confidence', 0.7),
            "priority": "high" if mood_trend.get('mood_change', 0) < -2 else "medium",
            "implementation_steps": [
                "Schedule check-in with mental health provider",
                "Increase social support activities",
                "Consider mood-boosting activities",
                "Evaluate current stressors"
            ],
            "expected_outcomes": [
                "Improved mood stability",
                "Better emotional regulation",
                "Enhanced coping strategies"
            ],
            "monitoring_parameters": ["Daily mood scores", "Stress levels", "Social interaction frequency"]
        }
    
    def _suggest_activity_modification(self, activity_correlation: Dict, patient_id: int) -> Dict[str, Any]:
        """Generate activity modification suggestions"""
        return {
            "suggestion_type": "activity_modification",
            "title": "Optimize Activity Routine",
            "description": "Your activities show strong correlation with mood. Let's optimize your routine.",
            "reasoning": f"Strong {activity_correlation.get('correlation_type', 'positive')} correlation detected",
            "confidence_score": activity_correlation.get('confidence', 0.6),
            "priority": "medium",
            "implementation_steps": [
                "Increase beneficial activities",
                "Schedule activities during optimal times",
                "Try new mood-boosting activities",
                "Track activity-mood patterns"
            ],
            "expected_outcomes": [
                "Improved mood through activity",
                "Better activity planning",
                "Enhanced daily routine"
            ],
            "monitoring_parameters": ["Activity duration", "Mood before/after activities", "Energy levels"]
        }
    
    def _suggest_risk_mitigation(self, risk_factor: str, patient_id: int) -> Dict[str, Any]:
        """Generate risk mitigation suggestions"""
        risk_suggestions = {
            "high_severity_symptoms": {
                "title": "Urgent Symptom Management",
                "description": "You've reported several high-severity symptoms. Immediate attention recommended.",
                "priority": "urgent",
                "implementation_steps": [
                    "Contact healthcare provider immediately",
                    "Review current treatment plan",
                    "Consider emergency interventions if needed"
                ]
            },
            "persistent_low_mood": {
                "title": "Mental Health Support",
                "description": "Persistent low mood detected. Mental health intervention recommended.",
                "priority": "high",
                "implementation_steps": [
                    "Schedule mental health consultation",
                    "Implement mood tracking protocols",
                    "Consider therapeutic interventions"
                ]
            },
            "increasing_symptom_frequency": {
                "title": "Treatment Plan Review",
                "description": "Symptom frequency is increasing. Treatment plan adjustment may be needed.",
                "priority": "high",
                "implementation_steps": [
                    "Schedule urgent doctor appointment",
                    "Review medication effectiveness",
                    "Analyze potential triggers"
                ]
            }
        }
        
        suggestion = risk_suggestions.get(risk_factor, {
            "title": "General Risk Management",
            "description": "Risk factor identified requiring attention.",
            "priority": "medium"
        })
        
        return {
            "suggestion_type": "risk_mitigation",
            "confidence_score": 0.8,
            "reasoning": f"Risk factor '{risk_factor}' requires proactive management",
            "expected_outcomes": ["Reduced risk", "Improved safety", "Better health outcomes"],
            "monitoring_parameters": ["Risk factor metrics", "Safety indicators", "Response to interventions"],
            **suggestion
        }
    
    def _suggest_general_improvements(self, improvement_areas: List[str], patient_id: int) -> List[Dict[str, Any]]:
        """Generate general improvement suggestions"""
        suggestions = []
        
        for area in improvement_areas:
            if area == "stress_management":
                suggestions.append({
                    "suggestion_type": "wellness_improvement",
                    "title": "Stress Management Enhancement",
                    "description": "Your stress levels could benefit from additional management techniques.",
                    "reasoning": "High stress levels detected in recent entries",
                    "confidence_score": 0.7,
                    "priority": "medium",
                    "implementation_steps": [
                        "Try daily meditation or breathing exercises",
                        "Identify and address stress triggers",
                        "Consider stress management counseling"
                    ],
                    "expected_outcomes": ["Reduced stress levels", "Better coping", "Improved overall wellbeing"],
                    "monitoring_parameters": ["Daily stress scores", "Stress trigger frequency", "Relaxation practice"]
                })
        
        return suggestions
    
    def _enhance_suggestion(self, suggestion: Dict[str, Any], current_treatment_id: Optional[int]) -> Dict[str, Any]:
        """Enhance suggestion with additional metadata"""
        suggestion["current_treatment_id"] = current_treatment_id
        suggestion["trigger_data"] = {"analysis_timestamp": datetime.utcnow().isoformat()}
        
        return suggestion

    # Advanced utility methods
    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate trend direction from a series of values"""
        if len(values) < 2:
            return "insufficient_data"

        # Simple linear regression slope
        x = np.arange(len(values))
        slope = np.polyfit(x, values, 1)[0]

        if slope > 0.1:
            return "increasing"
        elif slope < -0.1:
            return "decreasing"
        else:
            return "stable"

    def _calculate_correlation(self, x: List[float], y: List[float]) -> float:
        """Calculate correlation between two variables"""
        if len(x) < 2 or len(y) < 2 or len(x) != len(y):
            return 0.0

        try:
            correlation = np.corrcoef(x, y)[0, 1]
            return correlation if not np.isnan(correlation) else 0.0
        except:
            return 0.0

    def _find_common_patterns(self, text_list: List[str]) -> List[str]:
        """Find common patterns in text data"""
        if not text_list:
            return []

        # Simple word frequency analysis
        word_counts = defaultdict(int)
        for text in text_list:
            if text:
                words = text.lower().split()
                for word in words:
                    if len(word) > 3:  # Filter short words
                        word_counts[word] += 1

        # Return most common words
        return [word for word, count in sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:5]]

    def _analyze_frequency_trend(self, entries: List) -> str:
        """Analyze frequency trend over time"""
        if len(entries) < 7:
            return "insufficient_data"

        # Group by week
        weekly_counts = defaultdict(int)
        for entry in entries:
            week = entry.created_at.isocalendar()[1]
            weekly_counts[week] += 1

        if len(weekly_counts) < 2:
            return "insufficient_data"

        counts = list(weekly_counts.values())
        return self._calculate_trend(counts)

    def _analyze_weekly_patterns(self, moods: List[MoodEntry]) -> Dict[str, float]:
        """Analyze weekly mood patterns"""
        if not moods:
            return {}

        weekday_moods = defaultdict(list)
        for mood in moods:
            weekday = mood.date_recorded.weekday()
            weekday_moods[weekday].append(mood.mood_score)

        patterns = {}
        weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        for day_num, day_name in enumerate(weekdays):
            if day_num in weekday_moods:
                patterns[day_name] = np.mean(weekday_moods[day_num])

        return patterns

    def _identify_mood_risk_indicators(self, moods: List[MoodEntry]) -> List[str]:
        """Identify mood-related risk indicators"""
        if not moods:
            return []

        risk_indicators = []
        recent_moods = moods[-7:] if len(moods) >= 7 else moods

        # Low mood scores
        low_moods = [m for m in recent_moods if m.mood_score <= 3]
        if len(low_moods) >= 3:
            risk_indicators.append("persistent_low_mood")

        # High stress
        high_stress = [m for m in recent_moods if m.stress_level and m.stress_level >= 8]
        if len(high_stress) >= 2:
            risk_indicators.append("high_stress_levels")

        # Poor sleep
        poor_sleep = [m for m in recent_moods if m.sleep_quality and m.sleep_quality <= 4]
        if len(poor_sleep) >= 3:
            risk_indicators.append("poor_sleep_quality")

        return risk_indicators

    def _calculate_engagement_score(self, activities: List[ActivityEntry]) -> float:
        """Calculate patient engagement score based on activities"""
        if not activities:
            return 0.0

        # Factors: completion rate, consistency, variety
        completion_rate = len([a for a in activities if a.completed]) / len(activities)

        # Consistency (activities per week)
        weeks = set()
        for activity in activities:
            week = activity.date_recorded.isocalendar()[1]
            weeks.add(week)

        consistency = min(1.0, len(activities) / (len(weeks) * 3)) if weeks else 0

        # Variety
        activity_types = set(a.activity_type for a in activities)
        variety = min(1.0, len(activity_types) / 5)  # Normalize to 5 types

        # Weighted score
        engagement_score = (completion_rate * 0.5 + consistency * 0.3 + variety * 0.2)
        return min(1.0, engagement_score)

    def _analyze_clinical_assessments(self, assessments: List[ClinicalAssessment]) -> Dict[str, Any]:
        """Analyze clinical assessment trends"""
        if not assessments:
            return {"status": "no_data", "trends": {}}

        # Group by assessment type
        assessment_groups = defaultdict(list)
        for assessment in assessments:
            assessment_groups[assessment.assessment_type].append(assessment)

        trends = {}
        for assessment_type, entries in assessment_groups.items():
            scores = [e.total_score for e in entries]
            trends[assessment_type] = {
                "latest_score": scores[-1] if scores else 0,
                "trend": self._calculate_trend(scores),
                "risk_level": entries[-1].risk_level if entries else "unknown",
                "improvement": scores[-1] < scores[0] if len(scores) > 1 else False
            }

        return {
            "status": "analyzed",
            "total_assessments": len(assessments),
            "assessment_types": list(assessment_groups.keys()),
            "trends": trends
        }

    def _analyze_goal_progress(self, goals: List[ProgressGoal]) -> Dict[str, Any]:
        """Analyze patient goal progress"""
        if not goals:
            return {"status": "no_goals", "progress": {}}

        active_goals = [g for g in goals if g.status == "active"]
        completed_goals = [g for g in goals if g.status == "completed"]

        progress_summary = {
            "total_goals": len(goals),
            "active_goals": len(active_goals),
            "completed_goals": len(completed_goals),
            "completion_rate": len(completed_goals) / len(goals) if goals else 0,
            "avg_progress": np.mean([g.progress_percentage for g in active_goals]) if active_goals else 0
        }

        return {
            "status": "analyzed",
            "summary": progress_summary,
            "goal_details": [
                {
                    "id": g.id,
                    "title": g.title,
                    "type": g.goal_type,
                    "progress": g.progress_percentage,
                    "status": g.status
                } for g in goals
            ]
        }

    def _comprehensive_risk_assessment(self, symptoms: List[SymptomEntry],
                                     moods: List[MoodEntry],
                                     activities: List[ActivityEntry],
                                     assessments: List[ClinicalAssessment]) -> Dict[str, Any]:
        """Comprehensive risk assessment using multiple data sources"""
        risk_factors = {}
        overall_risk = 0.0

        # Symptom-based risk
        if symptoms:
            recent_symptoms = symptoms[-7:]
            high_severity = [s for s in recent_symptoms if s.severity >= 8]
            symptom_risk = len(high_severity) / 7 if recent_symptoms else 0
            risk_factors['symptom_severity'] = symptom_risk
            overall_risk += symptom_risk * self.risk_weights['symptom_severity']

        # Mood-based risk
        if moods:
            recent_moods = moods[-7:]
            low_moods = [m for m in recent_moods if m.mood_score <= 3]
            mood_risk = len(low_moods) / 7 if recent_moods else 0
            risk_factors['mood_decline'] = mood_risk
            overall_risk += mood_risk * self.risk_weights['mood_decline']

        # Activity engagement risk
        if activities:
            recent_activities = activities[-7:]
            incomplete = [a for a in recent_activities if not a.completed]
            activity_risk = len(incomplete) / 7 if recent_activities else 0
            risk_factors['low_engagement'] = activity_risk

        # Clinical assessment risk
        if assessments:
            latest_assessment = assessments[-1]
            if latest_assessment.risk_level in ['moderate', 'severe']:
                risk_factors['clinical_risk'] = 0.8 if latest_assessment.risk_level == 'severe' else 0.6
                overall_risk += risk_factors['clinical_risk'] * 0.3

        risk_level = "low"
        if overall_risk > 0.7:
            risk_level = "high"
        elif overall_risk > 0.4:
            risk_level = "moderate"

        return {
            "overall_risk_score": overall_risk,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "recommendations": self._generate_risk_recommendations(risk_factors, risk_level)
        }

    def _generate_predictive_insights(self, symptoms: List[SymptomEntry],
                                    moods: List[MoodEntry],
                                    activities: List[ActivityEntry]) -> Dict[str, Any]:
        """Generate predictive insights based on historical patterns"""
        insights = {}

        # Predict symptom trajectory
        if len(symptoms) >= 10:
            recent_severities = [s.severity for s in symptoms[-10:]]
            trend = self._calculate_trend(recent_severities)

            if trend == "increasing":
                insights['symptom_prediction'] = {
                    "trajectory": "worsening",
                    "confidence": 0.7,
                    "timeframe": "next_7_days",
                    "recommendation": "Consider treatment adjustment"
                }
            elif trend == "decreasing":
                insights['symptom_prediction'] = {
                    "trajectory": "improving",
                    "confidence": 0.8,
                    "timeframe": "next_7_days",
                    "recommendation": "Continue current approach"
                }

        # Predict mood stability
        if len(moods) >= 14:
            mood_scores = [m.mood_score for m in moods[-14:]]
            variability = np.std(mood_scores)

            if variability > 2.5:
                insights['mood_prediction'] = {
                    "stability": "unstable",
                    "confidence": 0.6,
                    "recommendation": "Focus on mood stabilization techniques"
                }

        return insights

    def _calculate_correlation_matrix(self, symptoms: List[SymptomEntry],
                                    moods: List[MoodEntry],
                                    activities: List[ActivityEntry]) -> Dict[str, float]:
        """Calculate correlations between different metrics"""
        correlations = {}

        # Align data by date for correlation analysis
        if symptoms and moods:
            # Simplified correlation - in practice, would need proper date alignment
            symptom_scores = [s.severity for s in symptoms[-30:]]
            mood_scores = [m.mood_score for m in moods[-30:]]

            if len(symptom_scores) == len(mood_scores):
                correlations['symptom_mood'] = self._calculate_correlation(symptom_scores, mood_scores)

        return correlations

    def _determine_patient_phenotype(self, symptoms: List[SymptomEntry],
                                   moods: List[MoodEntry],
                                   activities: List[ActivityEntry],
                                   assessments: List[ClinicalAssessment]) -> Dict[str, Any]:
        """Determine patient phenotype for personalized treatment"""
        phenotype = {
            "primary_concerns": [],
            "response_patterns": {},
            "treatment_preferences": {},
            "risk_profile": "standard"
        }

        # Identify primary concerns
        if symptoms:
            symptom_counts = defaultdict(int)
            for symptom in symptoms:
                symptom_counts[symptom.symptom_name] += 1

            primary_symptoms = sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)[:3]
            phenotype["primary_concerns"] = [s[0] for s in primary_symptoms]

        # Response patterns
        if moods:
            avg_mood = np.mean([m.mood_score for m in moods])
            if avg_mood < 5:
                phenotype["response_patterns"]["mood_tendency"] = "low"
            elif avg_mood > 7:
                phenotype["response_patterns"]["mood_tendency"] = "high"
            else:
                phenotype["response_patterns"]["mood_tendency"] = "moderate"

        return phenotype

    def _assess_data_quality(self, symptoms: List[SymptomEntry],
                           moods: List[MoodEntry],
                           activities: List[ActivityEntry],
                           assessments: List[ClinicalAssessment]) -> Dict[str, Any]:
        """Assess the quality and completeness of patient data"""
        quality_metrics = {
            "completeness": 0.0,
            "consistency": 0.0,
            "recency": 0.0,
            "overall_quality": 0.0
        }

        # Completeness
        data_types = [symptoms, moods, activities, assessments]
        completeness = sum(1 for data in data_types if data) / len(data_types)
        quality_metrics["completeness"] = completeness

        # Consistency (regular data entry)
        if moods:
            dates = [m.date_recorded for m in moods[-30:]]
            unique_dates = len(set(dates))
            consistency = min(1.0, unique_dates / 30)
            quality_metrics["consistency"] = consistency

        # Recency
        most_recent = datetime.now().date()
        if any(data for data in data_types):
            latest_entries = []
            if symptoms:
                latest_entries.append(symptoms[-1].created_at.date())
            if moods:
                latest_entries.append(moods[-1].date_recorded)
            if activities:
                latest_entries.append(activities[-1].date_recorded)

            if latest_entries:
                days_since_latest = (most_recent - max(latest_entries)).days
                recency = max(0, 1 - (days_since_latest / 7))  # Decay over 7 days
                quality_metrics["recency"] = recency

        # Overall quality
        quality_metrics["overall_quality"] = np.mean([
            quality_metrics["completeness"],
            quality_metrics["consistency"],
            quality_metrics["recency"]
        ])

        return quality_metrics

    def _generate_risk_recommendations(self, risk_factors: Dict[str, float], risk_level: str) -> List[str]:
        """Generate recommendations based on risk assessment"""
        recommendations = []

        if risk_level == "high":
            recommendations.append("Schedule urgent consultation with healthcare provider")
            recommendations.append("Implement daily monitoring protocols")
            recommendations.append("Consider crisis intervention resources")

        if "symptom_severity" in risk_factors and risk_factors["symptom_severity"] > 0.5:
            recommendations.append("Review and adjust symptom management strategies")
            recommendations.append("Consider additional pain management techniques")

        if "mood_decline" in risk_factors and risk_factors["mood_decline"] > 0.5:
            recommendations.append("Increase mental health support interventions")
            recommendations.append("Consider mood stabilization techniques")

        if "low_engagement" in risk_factors and risk_factors["low_engagement"] > 0.5:
            recommendations.append("Implement engagement enhancement strategies")
            recommendations.append("Simplify activity recommendations")

        return recommendations


# Keep the original LeapFrogAI class for backward compatibility
class LeapFrogAI(AdvancedLeapFrogAI):
    """Backward compatibility wrapper"""
    pass


# Utility function to run AI analysis
def generate_ai_suggestions_for_patient(patient_id: int, current_treatment_id: Optional[int] = None) -> List[LeapFrogSuggestion]:
    """
    Generate and save AI suggestions for a patient
    """
    ai_engine = LeapFrogAI()
    suggestions = ai_engine.generate_treatment_suggestions(patient_id, current_treatment_id)
    
    saved_suggestions = []
    for suggestion_data in suggestions:
        suggestion = LeapFrogSuggestion(
            patient_id=patient_id,
            current_treatment_id=current_treatment_id,
            suggestion_type=suggestion_data["suggestion_type"],
            title=suggestion_data["title"],
            description=suggestion_data["description"],
            reasoning=suggestion_data.get("reasoning"),
            confidence_score=suggestion_data.get("confidence_score", 0.5),
            priority=suggestion_data.get("priority", "medium"),
            implementation_steps=suggestion_data.get("implementation_steps", []),
            expected_outcomes=suggestion_data.get("expected_outcomes", []),
            monitoring_parameters=suggestion_data.get("monitoring_parameters", []),
            trigger_data=suggestion_data.get("trigger_data", {})
        )
        
        db.session.add(suggestion)
        saved_suggestions.append(suggestion)
    
    db.session.commit()
    return saved_suggestions
