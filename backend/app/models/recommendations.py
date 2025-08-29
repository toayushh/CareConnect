from datetime import datetime
from ..extensions import db


class HealthRecommendation(db.Model):
    """AI-generated health recommendations for patients"""
    __tablename__ = "health_recommendations"
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctors.id"), nullable=True)  # Optional doctor review
    
    # Recommendation details
    category = db.Column(db.String(50), nullable=False)  # lifestyle, medication, exercise, diet, etc.
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default="medium")  # low, medium, high, urgent
    
    # AI confidence and reasoning
    confidence_score = db.Column(db.Float, default=0.0)  # 0.0 to 1.0
    reasoning = db.Column(db.Text)  # Why this recommendation was made
    data_sources = db.Column(db.JSON)  # Which patient data influenced this
    
    # Implementation tracking
    status = db.Column(db.String(20), default="pending")  # pending, accepted, rejected, completed
    implementation_notes = db.Column(db.Text)
    target_date = db.Column(db.Date)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime)
    
    # Relationships
    patient = db.relationship("PatientProfile", foreign_keys=[patient_id])
    doctor = db.relationship("Doctor", foreign_keys=[doctor_id])


class HealthInsight(db.Model):
    """AI-generated insights about patient health patterns"""
    __tablename__ = "health_insights"
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    
    # Insight details
    insight_type = db.Column(db.String(50), nullable=False)  # trend, correlation, anomaly, prediction
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), default="info")  # info, warning, alert, critical
    
    # Data analysis
    metrics_analyzed = db.Column(db.JSON)  # Which metrics were analyzed
    time_period = db.Column(db.String(50))  # "last_7_days", "last_month", etc.
    correlation_strength = db.Column(db.Float)  # For correlation insights
    trend_direction = db.Column(db.String(20))  # increasing, decreasing, stable
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)  # When this insight becomes stale
    
    # Relationships
    patient = db.relationship("PatientProfile", foreign_keys=[patient_id])


class RiskAssessment(db.Model):
    """AI risk assessments for patients"""
    __tablename__ = "risk_assessments"
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    
    # Risk details
    risk_category = db.Column(db.String(50), nullable=False)  # cardiovascular, diabetes, mental_health, etc.
    risk_level = db.Column(db.String(20), nullable=False)  # low, moderate, high, very_high
    risk_score = db.Column(db.Float, nullable=False)  # 0.0 to 1.0
    
    # Risk factors
    risk_factors = db.Column(db.JSON)  # List of contributing factors
    protective_factors = db.Column(db.JSON)  # List of protective factors
    
    # Assessment details
    description = db.Column(db.Text)
    recommendations = db.Column(db.JSON)  # Specific recommendations for this risk
    next_assessment_date = db.Column(db.Date)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = db.relationship("PatientProfile", foreign_keys=[patient_id])


class PersonalizedMetric(db.Model):
    """Personalized health metrics and targets for patients"""
    __tablename__ = "personalized_metrics"
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    
    # Metric details
    metric_name = db.Column(db.String(100), nullable=False)  # steps, weight, blood_pressure, etc.
    current_value = db.Column(db.Float)
    target_value = db.Column(db.Float)
    optimal_range_min = db.Column(db.Float)
    optimal_range_max = db.Column(db.Float)
    unit = db.Column(db.String(20))  # kg, steps, mmHg, etc.
    
    # Personalization
    baseline_value = db.Column(db.Float)  # Patient's baseline
    improvement_rate = db.Column(db.Float)  # Expected rate of improvement
    difficulty_level = db.Column(db.String(20))  # easy, moderate, challenging
    
    # Tracking
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    target_date = db.Column(db.Date)
    status = db.Column(db.String(20), default="active")  # active, achieved, paused, discontinued
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = db.relationship("PatientProfile", foreign_keys=[patient_id])


class HealthPrediction(db.Model):
    """AI predictions about future health outcomes"""
    __tablename__ = "health_predictions"
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    
    # Prediction details
    prediction_type = db.Column(db.String(50), nullable=False)  # disease_risk, medication_response, recovery_time
    outcome = db.Column(db.String(200), nullable=False)
    probability = db.Column(db.Float, nullable=False)  # 0.0 to 1.0
    confidence_interval = db.Column(db.JSON)  # [lower_bound, upper_bound]
    
    # Timeline
    prediction_horizon = db.Column(db.String(50))  # "3_months", "1_year", etc.
    predicted_date = db.Column(db.Date)
    
    # Model information
    model_version = db.Column(db.String(50))
    features_used = db.Column(db.JSON)  # Which data points influenced prediction
    explanation = db.Column(db.Text)  # Human-readable explanation
    
    # Validation
    actual_outcome = db.Column(db.String(200))  # Filled in later for model validation
    accuracy_score = db.Column(db.Float)  # How accurate the prediction was
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    validated_at = db.Column(db.DateTime)
    
    # Relationships
    patient = db.relationship("PatientProfile", foreign_keys=[patient_id])


class InterventionTracking(db.Model):
    """Track the effectiveness of interventions and recommendations"""
    __tablename__ = "intervention_tracking"
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("patient_profiles.id"), nullable=False)
    recommendation_id = db.Column(db.Integer, db.ForeignKey("health_recommendations.id"), nullable=True)
    
    # Intervention details
    intervention_type = db.Column(db.String(50), nullable=False)
    intervention_name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Timeline
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    duration_weeks = db.Column(db.Integer)
    
    # Effectiveness tracking
    baseline_metrics = db.Column(db.JSON)  # Before intervention
    current_metrics = db.Column(db.JSON)  # Current values
    target_metrics = db.Column(db.JSON)  # Target values
    
    # Progress
    adherence_rate = db.Column(db.Float)  # 0.0 to 1.0
    effectiveness_score = db.Column(db.Float)  # 0.0 to 1.0
    side_effects = db.Column(db.JSON)  # Any reported side effects
    
    # Status
    status = db.Column(db.String(20), default="active")  # active, completed, discontinued
    completion_reason = db.Column(db.String(200))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = db.relationship("PatientProfile", foreign_keys=[patient_id])
    recommendation = db.relationship("HealthRecommendation", foreign_keys=[recommendation_id])
