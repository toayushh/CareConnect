#!/usr/bin/env python3
"""
Comprehensive database migration and seeding script for LeapFrog Healthcare Platform
"""

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.doctor import Doctor
from app.models.patient import PatientProfile
from app.models.progress import SymptomEntry, MoodEntry, ActivityEntry, TreatmentEffectiveness, TreatmentPlan
from app.models.appointment import Appointment
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random

def migrate_and_seed():
    app = create_app()
    
    with app.app_context():
        print("🚀 Starting database migration and seeding...")
        
        # Check if we need to create demo data
        existing_patient = User.query.filter_by(email='test@patient.com').first()
        if existing_patient:
            print("✅ Demo data already exists, updating...")
            update_existing_data()
        else:
            print("📊 Creating new demo data...")
            create_demo_data()
        
        print("✅ Database migration and seeding completed!")

def create_demo_data():
    """Create comprehensive demo data"""
    
    # Check if users already exist
    existing_patient = User.query.filter_by(email='test@patient.com').first()
    existing_doctor = User.query.filter_by(email='doctor@example.com').first()
    
    if existing_patient and existing_doctor:
        print("✅ Users already exist, updating data...")
        update_existing_data()
        return
    
    # Create demo patient user if it doesn't exist
    if not existing_patient:
        print("👤 Creating demo patient...")
        patient_user = User(
            email='test@patient.com',
            password_hash=generate_password_hash('test123'),
            full_name='Test Patient',
            role='patient'
        )
        db.session.add(patient_user)
        db.session.flush()
    else:
        patient_user = existing_patient
        print("👤 Using existing patient user...")
    
    # Create patient profile if it doesn't exist
    patient_profile = PatientProfile.query.filter_by(user_id=patient_user.id).first()
    if not patient_profile:
        patient_profile = PatientProfile(
            user_id=patient_user.id,
            phone='+1-555-0123',
            date_of_birth=datetime(1990, 5, 15).date(),
            emergency_contact='Emergency Contact - (555) 123-4568'
        )
        db.session.add(patient_profile)
        db.session.flush()
    
    # Create demo doctor user if it doesn't exist
    if not existing_doctor:
        print("👨‍⚕️ Creating demo doctor...")
        doctor_user = User(
            email='doctor@example.com',
            password_hash=generate_password_hash('doctor123'),
            full_name='Dr. John Smith',
            role='doctor'
        )
        db.session.add(doctor_user)
        db.session.flush()
    else:
        doctor_user = existing_doctor
        print("👨‍⚕️ Using existing doctor user...")
    
    # Create doctor profile if it doesn't exist
    doctor_profile = Doctor.query.filter_by(user_id=doctor_user.id).first()
    if not doctor_profile:
        doctor_profile = Doctor(
            user_id=doctor_user.id,
            specialty='Cardiology',
            hospital='City Hospital',
            consultation_fee=200,
            availability='today',
            languages='English, Spanish',
            rating=4.8,
            bio='Experienced cardiologist with 15+ years of practice'
        )
        db.session.add(doctor_profile)
        db.session.flush()
    
    # Create treatment plan if it doesn't exist
    existing_plan = TreatmentPlan.query.filter_by(
        patient_id=patient_profile.id,
        doctor_id=doctor_profile.id
    ).first()
    
    if not existing_plan:
        print("📋 Creating treatment plan...")
        treatment_plan = TreatmentPlan(
            patient_id=patient_profile.id,
            doctor_id=doctor_profile.id,
            plan_name='Cardiac Health Management',
            description='Comprehensive plan for improving cardiac health through lifestyle changes and medication',
            status='active',
            start_date=datetime.now().date(),
            end_date=(datetime.now() + timedelta(days=90)).date(),
            effectiveness_score=0.75
        )
        db.session.add(treatment_plan)
    
    # Create appointment if it doesn't exist
    existing_appointment = Appointment.query.filter_by(
        patient_id=patient_profile.id,
        doctor_id=doctor_profile.id
    ).first()
    
    if not existing_appointment:
        print("📅 Creating appointment...")
        start_time = datetime.now().replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=7)
        end_time = start_time + timedelta(hours=1)
        appointment = Appointment(
            patient_id=patient_profile.id,
            doctor_id=doctor_profile.id,
            start_time=start_time,
            end_time=end_time,
            appointment_type='in-person',
            reason='Treatment plan review and progress assessment',
            status='scheduled'
        )
        db.session.add(appointment)
    
    # Create comprehensive progress data if it doesn't exist
    existing_symptoms = SymptomEntry.query.filter_by(patient_id=patient_profile.id).first()
    if not existing_symptoms:
        print("📊 Creating comprehensive progress data...")
        create_progress_data(patient_profile.id)
    
    # Commit all changes
    db.session.commit()
    print("✅ Demo data created successfully!")

def update_existing_data():
    """Update existing demo data with missing components"""
    
    # Get existing patient and doctor
    patient_user = User.query.filter_by(email='test@patient.com').first()
    doctor_user = User.query.filter_by(email='doctor@example.com').first()
    
    if not patient_user or not doctor_user:
        print("❌ Required users not found, creating new demo data...")
        create_demo_data()
        return
    
    patient_profile = PatientProfile.query.filter_by(user_id=patient_user.id).first()
    doctor_profile = Doctor.query.filter_by(user_id=doctor_user.id).first()
    
    if not patient_profile or not doctor_profile:
        print("❌ Required profiles not found, creating new demo data...")
        create_demo_data()
        return
    
    # Check if treatment plan exists
    existing_plan = TreatmentPlan.query.filter_by(
        patient_id=patient_profile.id,
        doctor_id=doctor_profile.id
    ).first()
    
    if not existing_plan:
        print("📋 Creating missing treatment plan...")
        treatment_plan = TreatmentPlan(
            patient_id=patient_profile.id,
            doctor_id=doctor_profile.id,
            plan_name='Cardiac Health Management',
            description='Comprehensive plan for improving cardiac health through lifestyle changes and medication',
            status='active',
            start_date=datetime.now().date(),
            end_date=(datetime.now() + timedelta(days=90)).date(),
            effectiveness_score=0.75
        )
        db.session.add(treatment_plan)
    
    # Check if appointment exists
    existing_appointment = Appointment.query.filter_by(
        patient_id=patient_profile.id,
        doctor_id=doctor_profile.id
    ).first()
    
    if not existing_appointment:
        print("📅 Creating missing appointment...")
        start_time = datetime.now().replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=7)
        end_time = start_time + timedelta(hours=1)
        appointment = Appointment(
            patient_id=patient_profile.id,
            doctor_id=doctor_profile.id,
            start_time=start_time,
            end_time=end_time,
            appointment_type='in-person',
            reason='Treatment plan review and progress assessment',
            status='scheduled'
        )
        db.session.add(appointment)
    
    # Check if progress data exists
    existing_symptoms = SymptomEntry.query.filter_by(patient_id=patient_profile.id).first()
    if not existing_symptoms:
        print("📊 Creating missing progress data...")
        create_progress_data(patient_profile.id)
    
    # Commit changes
    db.session.commit()
    print("✅ Existing data updated successfully!")

def create_progress_data(patient_id):
    """Create comprehensive progress data for a patient"""
    
    base_date = datetime.now()
    
    # Create symptom entries for the last 30 days
    print("  - Creating symptom entries...")
    for i in range(30):
        date = base_date - timedelta(days=i)
        if random.random() < 0.6:  # 60% chance of symptoms
            symptom = SymptomEntry(
                patient_id=patient_id,
                symptom_name=random.choice([
                    'Back Pain', 'Headache', 'Fatigue', 'Joint Pain', 'Muscle Tension',
                    'Chest Discomfort', 'Shortness of Breath', 'Dizziness'
                ]),
                severity=random.randint(2, 8),
                location=random.choice([
                    'Lower back', 'Head', 'General', 'Knees', 'Shoulders',
                    'Chest', 'Upper back', 'Neck'
                ]),
                duration=f"{random.randint(1, 12)} hours",
                triggers=random.choice([
                    'Stress', 'Physical activity', 'Weather', 'Sleep', 'Work',
                    'Poor posture', 'Lack of exercise', 'Diet'
                ]),
                notes=random.choice([
                    'Pain worse in the morning',
                    'Improved after medication',
                    'Triggered by physical activity',
                    'Stress-related episode',
                    'Weather-related discomfort',
                    'Better after stretching',
                    'Worse when sitting for long periods'
                ]),
                created_at=date
            )
            db.session.add(symptom)
    
    # Create mood entries for the last 30 days
    print("  - Creating mood entries...")
    for i in range(30):
        date = base_date - timedelta(days=i)
        base_mood = random.randint(4, 8)
        mood = MoodEntry(
            patient_id=patient_id,
            mood_score=base_mood,
            energy_level=max(1, min(10, base_mood + random.randint(-2, 2))),
            stress_level=max(1, min(10, 11 - base_mood + random.randint(-1, 3))),
            sleep_quality=random.randint(3, 9),
            mood_tags=random.choice([
                ['optimistic', 'energetic'], ['tired', 'stressed'], ['calm', 'focused'],
                ['anxious', 'restless'], ['happy', 'motivated'], ['depressed', 'low']
            ]),
            social_interactions=random.randint(3, 9),
            weather_impact=random.choice(['sunny', 'rainy', 'cloudy', 'windy', 'overcast']),
            notes=random.choice([
                'Feeling optimistic today',
                'Struggling with motivation',
                'Good day overall',
                'Anxiety manageable',
                'Tired but stable mood',
                'Great energy after exercise',
                'Stressed about work deadlines'
            ]) if random.random() < 0.5 else '',
            date_recorded=date.date(),
            created_at=date
        )
        db.session.add(mood)
    
    # Create activity entries for the last 30 days
    print("  - Creating activity entries...")
    for i in range(30):
        date = base_date - timedelta(days=i)
        daily_activities = random.randint(1, 3)
        for j in range(daily_activities):
            activity_time = date.replace(hour=random.randint(6, 22), minute=random.randint(0, 59))
            
            activity = ActivityEntry(
                patient_id=patient_id,
                activity_type=random.choice([
                    'Walking', 'Physical Therapy', 'Meditation', 'Swimming', 'Yoga',
                    'Stretching', 'Light Exercise', 'Deep Breathing', 'Tai Chi'
                ]),
                activity_name=random.choice([
                    'Morning walk', 'PT session', 'Mindfulness practice', 'Pool therapy',
                    'Yoga class', 'Stretching routine', 'Light cardio', 'Breathing exercises'
                ]),
                duration=random.randint(15, 90),
                intensity=random.randint(1, 8),
                completed=True,
                notes=random.choice([
                    'Felt great afterwards',
                    'Had to stop early due to pain',
                    'Challenging but manageable',
                    'Very relaxing',
                    'Good progress today',
                    'Felt energized',
                    'Slightly challenging'
                ]) if random.random() < 0.4 else '',
                date_recorded=date.date(),
                created_at=activity_time
            )
            db.session.add(activity)
    
    print("  - Progress data created successfully!")

if __name__ == "__main__":
    migrate_and_seed()
