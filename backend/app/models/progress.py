
from datetime import datetime, date
from sqlalchemy import JSON
from ..extensions import db


class SymptomEntry(db.Model):
    """Track patient symptoms with detailed information"""
    __tablename__ = "symptom_entries"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    symptom_name = db.Column(db.String(255), nullable=False)
    severity = db.Column(db.Integer, nullable=False)  # 1-10 scale
    location = db.Column(db.String(255))  # Body location
    duration = db.Column(db.String(100))  # e.g., "2 hours", "3 days"
    triggers = db.Column(db.Text)  # What might have triggered it
    notes = db.Column(db.Text)  # Additional notes
    tags = db.Column(JSON)  # Array of tags
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = db.relationship("PatientProfile", backref="symptom_entries")


class MoodEntry(db.Model):
    """Track patient daily mood and mental health"""
    __tablename__ = "mood_entries"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    mood_score = db.Column(db.Integer, nullable=False)  # 1-10 scale
    energy_level = db.Column(db.Integer)  # 1-10 scale
    stress_level = db.Column(db.Integer)  # 1-10 scale
    sleep_quality = db.Column(db.Integer)  # 1-10 scale
    mood_tags = db.Column(JSON)  # Array of mood descriptors
    social_interactions = db.Column(db.Integer)  # 1-10 scale
    weather_impact = db.Column(db.String(50))  # sunny, rainy, cloudy, etc.
    notes = db.Column(db.Text)
    date_recorded = db.Column(db.Date, default=date.today)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = db.relationship("PatientProfile", backref="mood_entries")


class ActivityEntry(db.Model):
    """Track patient activities and their correlation with health"""
    __tablename__ = "activity_entries"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    activity_type = db.Column(db.String(100), nullable=False)  # exercise, medication, therapy, etc.
    activity_name = db.Column(db.String(255), nullable=False)
    duration = db.Column(db.Integer)  # Duration in minutes
    intensity = db.Column(db.Integer)  # 1-10 scale for applicable activities
    completed = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)
    activity_metadata = db.Column(JSON)  # Additional activity-specific data
    date_recorded = db.Column(db.Date, default=date.today)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = db.relationship("PatientProfile", backref="activity_entries")


class ClinicalAssessment(db.Model):
    """Store clinical assessment scores like PHQ-9, GAD-7"""
    __tablename__ = "clinical_assessments"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    assessment_type = db.Column(db.String(50), nullable=False)  # PHQ-9, GAD-7, etc.
    total_score = db.Column(db.Integer, nullable=False)
    risk_level = db.Column(db.String(50))  # minimal, mild, moderate, severe
    responses = db.Column(JSON)  # Store individual question responses
    interpretation = db.Column(db.Text)
    provider_notified = db.Column(db.Boolean, default=False)
    date_completed = db.Column(db.Date, default=date.today)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = db.relationship("PatientProfile", backref="clinical_assessments")


class ProgressGoal(db.Model):
    """Patient-set goals and tracking"""
    __tablename__ = "progress_goals"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    goal_type = db.Column(db.String(100), nullable=False)  # symptom, mood, activity, etc.
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    target_value = db.Column(db.Float)  # Target number (e.g., mood score of 7)
    current_value = db.Column(db.Float, default=0)
    measurement_unit = db.Column(db.String(50))  # days, score, percentage, etc.
    target_date = db.Column(db.Date)
    status = db.Column(db.String(50), default="active")  # active, completed, paused, cancelled
    progress_percentage = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = db.relationship("PatientProfile", backref="progress_goals")


class TreatmentPlan(db.Model):
    """Patient treatment plans prescribed by doctors"""
    __tablename__ = "treatment_plans"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=False)
    plan_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default="active")  # active, completed, discontinued
    start_date = db.Column(db.Date, default=date.today)
    end_date = db.Column(db.Date)
    
    # Medications
    medications = db.Column(JSON)  # Array of medication objects
    
    # Therapy/Activities
    therapies = db.Column(JSON)  # Array of therapy recommendations
    
    # Lifestyle recommendations
    lifestyle_recommendations = db.Column(JSON)
    
    # Follow-up schedule
    follow_up_schedule = db.Column(JSON)
    
    # Progress tracking
    effectiveness_score = db.Column(db.Float)  # 1-10 based on patient feedback
    adherence_percentage = db.Column(db.Float, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = db.relationship("PatientProfile", backref="treatment_plans")
    doctor = db.relationship("Doctor", backref="treatment_plans")


class LeapFrogSuggestion(db.Model):
    """AI-generated treatment suggestions using LeapFrog logic"""
    __tablename__ = "leapfrog_suggestions"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    current_treatment_id = db.Column(db.Integer, db.ForeignKey("treatment_plans.id"))
    
    # Suggestion details
    suggestion_type = db.Column(db.String(100), nullable=False)  # alternative_medication, therapy_addition, etc.
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    reasoning = db.Column(db.Text)  # Why this suggestion was made
    
    # Data that triggered suggestion
    trigger_data = db.Column(JSON)  # Symptoms, mood, progress data that led to suggestion
    
    # Confidence and priority
    confidence_score = db.Column(db.Float)  # 0-1 AI confidence
    priority = db.Column(db.String(50), default="medium")  # low, medium, high, urgent
    
    # Implementation details
    implementation_steps = db.Column(JSON)  # Step-by-step guidance
    expected_outcomes = db.Column(JSON)  # What to expect
    monitoring_parameters = db.Column(JSON)  # What to track
    
    # Status tracking
    status = db.Column(db.String(50), default="pending")  # pending, reviewed, implemented, rejected
    doctor_review = db.Column(db.Text)  # Doctor's notes on the suggestion
    patient_feedback = db.Column(db.Text)  # Patient's response
    patient_rating = db.Column(db.Integer)  # Patient rating 1-5 scale
    feedback_timestamp = db.Column(db.DateTime)  # When feedback was provided
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime)
    
    # Relationships
    patient = db.relationship("PatientProfile", backref="leapfrog_suggestions")
    current_treatment = db.relationship("TreatmentPlan", backref="ai_suggestions")


class TreatmentEffectiveness(db.Model):
    """Track treatment effectiveness over time"""
    __tablename__ = "treatment_effectiveness"

    id = db.Column(db.Integer, primary_key=True)
    treatment_plan_id = db.Column(db.Integer, db.ForeignKey("treatment_plans.id"), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)

    # Effectiveness metrics
    symptom_improvement_score = db.Column(db.Float)  # 0-1 scale
    mood_stability_score = db.Column(db.Float)  # 0-1 scale
    activity_engagement_score = db.Column(db.Float)  # 0-1 scale
    adherence_score = db.Column(db.Float)  # 0-1 scale
    side_effects_score = db.Column(db.Float)  # 0-1 scale (lower is better)

    # Overall effectiveness
    overall_effectiveness = db.Column(db.Float)  # Weighted combination

    # Patient feedback
    patient_satisfaction = db.Column(db.Integer)  # 1-10 scale
    quality_of_life_impact = db.Column(db.Integer)  # 1-10 scale

    # Measurement period
    measurement_start_date = db.Column(db.Date, nullable=False)
    measurement_end_date = db.Column(db.Date, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    treatment_plan = db.relationship("TreatmentPlan", backref="effectiveness_measurements")
    patient = db.relationship("PatientProfile", backref="treatment_effectiveness")


class InterventionHistory(db.Model):
    """Track all interventions and their outcomes"""
    __tablename__ = "intervention_history"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    treatment_plan_id = db.Column(db.Integer, db.ForeignKey("treatment_plans.id"))
    suggestion_id = db.Column(db.Integer, db.ForeignKey("leapfrog_suggestions.id"))

    # Intervention details
    intervention_type = db.Column(db.String(100), nullable=False)  # medication, therapy, lifestyle, etc.
    intervention_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)

    # Implementation
    implemented_date = db.Column(db.Date, nullable=False)
    implementation_notes = db.Column(db.Text)

    # Outcome tracking
    outcome_measured = db.Column(db.Boolean, default=False)
    outcome_score = db.Column(db.Float)  # 0-1 scale
    outcome_notes = db.Column(db.Text)
    outcome_date = db.Column(db.Date)

    # Success metrics
    successful = db.Column(db.Boolean)
    success_criteria = db.Column(JSON)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = db.relationship("PatientProfile", backref="intervention_history")
    treatment_plan = db.relationship("TreatmentPlan", backref="interventions")
    suggestion = db.relationship("LeapFrogSuggestion", backref="interventions")


class PredictiveModel(db.Model):
    """Store predictive model results and accuracy"""
    __tablename__ = "predictive_models"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)

    # Model details
    model_type = db.Column(db.String(100), nullable=False)  # symptom_prediction, mood_forecast, etc.
    model_version = db.Column(db.String(50))

    # Prediction
    prediction_data = db.Column(JSON)  # The actual prediction
    confidence_score = db.Column(db.Float)
    prediction_horizon_days = db.Column(db.Integer)  # How far into future

    # Validation
    actual_outcome = db.Column(JSON)  # What actually happened
    accuracy_score = db.Column(db.Float)  # How accurate was the prediction
    validated = db.Column(db.Boolean, default=False)

    # Timestamps
    prediction_date = db.Column(db.Date, default=date.today)
    validation_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    patient = db.relationship("PatientProfile", backref="predictive_models")


class PatientEngagement(db.Model):
    """Track patient engagement metrics"""
    __tablename__ = "patient_engagement"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)

    # Engagement metrics
    login_frequency = db.Column(db.Float)  # Logins per week
    data_entry_consistency = db.Column(db.Float)  # 0-1 scale
    feature_usage = db.Column(JSON)  # Which features are used
    response_rate = db.Column(db.Float)  # Response to prompts/reminders

    # Gamification
    points_earned = db.Column(db.Integer, default=0)
    achievements_unlocked = db.Column(JSON)  # List of achievements
    streak_days = db.Column(db.Integer, default=0)  # Consecutive days of engagement

    # Motivation factors
    motivation_level = db.Column(db.Integer)  # 1-10 scale
    preferred_communication = db.Column(db.String(50))  # email, push, sms
    optimal_reminder_time = db.Column(db.Time)

    # Measurement period
    measurement_date = db.Column(db.Date, default=date.today)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = db.relationship("PatientProfile", backref="engagement_metrics")
