#!/usr/bin/env python3
"""
Add demo data for LeapFrog Healthcare Platform
Creates sample users, doctors, and data for testing without dropping tables
"""

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.doctor import Doctor
from app.models.patient import PatientProfile
from app.models.progress import SymptomEntry, MoodEntry, ActivityEntry
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random

def add_demo_data():
    app = create_app()
    
    with app.app_context():
        # Check if demo data already exists
        existing_patient = User.query.filter_by(email='test@example.com').first()
        if existing_patient:
            print("✅ Demo data already exists!")
            return
        
        # Create demo patient user
        print("👤 Creating demo patient...")
        patient_user = User(
            email='test@example.com',
            password_hash=generate_password_hash('test123'),
            full_name='Test Patient',
            role='patient'
        )
        db.session.add(patient_user)
        db.session.flush()  # Get the ID
        
        # Create patient profile
        patient_profile = PatientProfile(
            user_id=patient_user.id
        )
        db.session.add(patient_profile)
        
        # Create demo doctor user
        print("👨‍⚕️ Creating demo doctor...")
        doctor_user = User(
            email='doctor@example.com',
            password_hash=generate_password_hash('doctor123'),
            full_name='Dr. John Smith',
            role='doctor'
        )
        db.session.add(doctor_user)
        db.session.flush()  # Get the ID
        
        # Create doctor profile
        doctor_profile = Doctor(
            user_id=doctor_user.id,
            specialty='Cardiology',
            hospital='City Hospital',
            consultation_fee=200,
            availability='today'
        )
        db.session.add(doctor_profile)
        
        # Create more sample doctors
        print("👨‍⚕️ Creating more sample doctors...")
        doctors_data = [
            {
                'email': 'dr.wilson@example.com',
                'name': 'Dr. Sarah Wilson',
                'specialty': 'Dermatology',
                'hospital': 'Skin Care Center',
                'fee': 150,
                'availability': 'this-week',
                'rating': 4.9
            },
            {
                'email': 'dr.brown@example.com',
                'name': 'Dr. Michael Brown',
                'specialty': 'Neurology',
                'hospital': 'Brain Institute',
                'fee': 250,
                'availability': 'today',
                'rating': 4.7
            },
            {
                'email': 'dr.davis@example.com',
                'name': 'Dr. Emily Davis',
                'specialty': 'Pediatrics',
                'hospital': 'Children\'s Hospital',
                'fee': 120,
                'availability': 'this-week',
                'rating': 4.8
            },
            {
                'email': 'dr.garcia@example.com',
                'name': 'Dr. Carlos Garcia',
                'specialty': 'Orthopedics',
                'hospital': 'Sports Medicine Center',
                'fee': 180,
                'availability': 'today',
                'rating': 4.6
            }
        ]
        
        for doc_data in doctors_data:
            doc_user = User(
                email=doc_data['email'],
                password_hash=generate_password_hash('doctor123'),
                full_name=doc_data['name'],
                role='doctor'
            )
            db.session.add(doc_user)
            db.session.flush()
            
            doc_profile = Doctor(
                user_id=doc_user.id,
                specialty=doc_data['specialty'],
                hospital=doc_data['hospital'],
                consultation_fee=doc_data['fee'],
                availability=doc_data['availability'],
                languages='English',
                rating=doc_data['rating']
            )
            db.session.add(doc_profile)
        
        # Create sample progress data for the patient
        print("📊 Creating sample progress data...")
        base_date = datetime.now()
        
        # Create symptom entries
        for i in range(14):  # Last 14 days
            date = base_date - timedelta(days=i)
            if random.random() < 0.7:  # 70% chance of symptoms
                symptom = SymptomEntry(
                    patient_id=patient_profile.id,
                    symptom_name=random.choice(['Back Pain', 'Headache', 'Fatigue', 'Joint Pain', 'Muscle Tension']),
                    severity=random.randint(3, 9),
                    location=random.choice(['Lower back', 'Head', 'General', 'Knees', 'Shoulders']),
                    duration=f"{random.randint(1, 8)} hours",
                    triggers=random.choice(['Stress', 'Physical activity', 'Weather', 'Sleep', 'Work']),
                    notes=random.choice([
                        'Pain worse in the morning',
                        'Improved after medication',
                        'Triggered by physical activity',
                        'Stress-related episode',
                        'Weather-related discomfort'
                    ]),
                    created_at=date
                )
                db.session.add(symptom)
        
        # Create mood entries
        for i in range(14):  # Last 14 days
            date = base_date - timedelta(days=i)
            base_mood = random.randint(4, 8)
            mood = MoodEntry(
                patient_id=patient_profile.id,
                mood_score=base_mood,
                energy_level=max(1, min(10, base_mood + random.randint(-2, 2))),
                stress_level=max(1, min(10, 11 - base_mood + random.randint(-1, 3))),
                sleep_quality=random.randint(3, 9),
                mood_tags=random.choice([['optimistic', 'energetic'], ['tired', 'stressed'], ['calm', 'focused']]),
                social_interactions=random.randint(3, 9),
                weather_impact=random.choice(['sunny', 'rainy', 'cloudy', 'windy']),
                notes=random.choice([
                    'Feeling optimistic today',
                    'Struggling with motivation',
                    'Good day overall',
                    'Anxiety manageable',
                    'Tired but stable mood'
                ]) if random.random() < 0.6 else '',
                date_recorded=date.date(),
                created_at=date
            )
            db.session.add(mood)
        
        # Create activity entries
        for i in range(14):  # Last 14 days
            date = base_date - timedelta(days=i)
            daily_activities = random.randint(1, 4)
            for j in range(daily_activities):
                activity_time = date.replace(hour=random.randint(6, 22), minute=random.randint(0, 59))
                
                activity = ActivityEntry(
                    patient_id=patient_profile.id,
                    activity_type=random.choice(['Walking', 'Physical Therapy', 'Meditation', 'Swimming', 'Yoga', 'Stretching']),
                    activity_name=random.choice(['Morning walk', 'PT session', 'Mindfulness practice', 'Pool therapy', 'Yoga class', 'Stretching routine']),
                    duration=random.randint(15, 120),
                    intensity=random.randint(1, 10),
                    completed=True,
                    notes=random.choice([
                        'Felt great afterwards',
                        'Had to stop early due to pain',
                        'Challenging but manageable',
                        'Very relaxing',
                        'Good progress today'
                    ]) if random.random() < 0.4 else '',
                    date_recorded=date.date(),
                    created_at=activity_time
                )
                db.session.add(activity)
        
        # Commit all changes
        db.session.commit()
        
        print("✅ Demo data added successfully!")
        print("")
        print("🔐 LOGIN CREDENTIALS:")
        print("Patient Login:")
        print("  Email: test@example.com")
        print("  Password: test123")
        print("")
        print("Doctor Login:")
        print("  Email: doctor@example.com")
        print("  Password: doctor123")
        print("")
        print("🎉 Platform ready for testing!")

if __name__ == "__main__":
    add_demo_data()
