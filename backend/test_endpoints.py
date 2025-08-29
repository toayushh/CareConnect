#!/usr/bin/env python3
"""
Test script to verify endpoints work correctly
"""

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.patient import PatientProfile
from app.models.progress import SymptomEntry, MoodEntry, ActivityEntry
from datetime import datetime, timedelta
import random

def test_endpoints():
    app = create_app()
    
    with app.app_context():
        print("🔍 Testing database connections...")
        
        # Test user query
        users = User.query.all()
        print(f"✅ Found {len(users)} users")
        
        # Test patient profiles
        patients = PatientProfile.query.all()
        print(f"✅ Found {len(patients)} patient profiles")
        
        # Test progress data
        symptoms = SymptomEntry.query.all()
        print(f"✅ Found {len(symptoms)} symptom entries")
        
        moods = MoodEntry.query.all()
        print(f"✅ Found {len(moods)} mood entries")
        
        activities = ActivityEntry.query.all()
        print(f"✅ Found {len(activities)} activity entries")
        
        if not symptoms:
            print("📊 Creating sample progress data...")
            
            # Get first patient
            patient = patients[0] if patients else None
            if patient:
                base_date = datetime.now()
                
                # Create sample symptoms
                for i in range(7):
                    date = base_date - timedelta(days=i)
                    symptom = SymptomEntry(
                        patient_id=patient.id,
                        symptom_name=random.choice(['Back Pain', 'Headache', 'Fatigue']),
                        severity=random.randint(3, 9),
                        location='General',
                        duration='2 hours',
                        triggers='Stress',
                        notes='Sample symptom',
                        created_at=date
                    )
                    db.session.add(symptom)
                
                # Create sample moods
                for i in range(7):
                    date = base_date - timedelta(days=i)
                    mood = MoodEntry(
                        patient_id=patient.id,
                        mood_score=random.randint(4, 8),
                        energy_level=random.randint(3, 9),
                        stress_level=random.randint(2, 8),
                        sleep_quality=random.randint(3, 9),
                        mood_tags=['test'],
                        social_interactions=random.randint(3, 9),
                        weather_impact='sunny',
                        notes='Sample mood entry',
                        date_recorded=date.date(),
                        created_at=date
                    )
                    db.session.add(mood)
                
                # Create sample activities
                for i in range(7):
                    date = base_date - timedelta(days=i)
                    activity = ActivityEntry(
                        patient_id=patient.id,
                        activity_type='Walking',
                        activity_name='Morning walk',
                        duration=30,
                        intensity=5,
                        completed=True,
                        notes='Sample activity',
                        date_recorded=date.date(),
                        created_at=date
                    )
                    db.session.add(activity)
                
                db.session.commit()
                print("✅ Sample progress data created!")
            else:
                print("❌ No patient profiles found")
        
        print("\n🎯 Testing specific patient data...")
        if patients:
            patient = patients[0]
            print(f"Testing with patient ID: {patient.id}")
            
            # Test symptom query
            patient_symptoms = SymptomEntry.query.filter_by(patient_id=patient.id).all()
            print(f"✅ Patient has {len(patient_symptoms)} symptoms")
            
            # Test mood query
            patient_moods = MoodEntry.query.filter_by(patient_id=patient.id).all()
            print(f"✅ Patient has {len(patient_moods)} mood entries")
            
            # Test activity query
            patient_activities = ActivityEntry.query.filter_by(patient_id=patient.id).all()
            print(f"✅ Patient has {len(patient_activities)} activity entries")
        
        print("\n✅ All tests completed!")

if __name__ == "__main__":
    test_endpoints()
