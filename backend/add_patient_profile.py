#!/usr/bin/env python3
"""
Add patient profile for existing test user
"""

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.patient import PatientProfile

def add_patient_profile():
    app = create_app()
    
    with app.app_context():
        try:
            # Find existing test user
            test_user = User.query.filter_by(email='test@example.com').first()
            if not test_user:
                print("❌ Test user not found")
                return None
            
            # Check if patient profile already exists
            if hasattr(test_user, 'patient_profile') and test_user.patient_profile:
                print("✅ Patient profile already exists for test user")
                return test_user.patient_profile
            
            # Create patient profile
            print("👤 Creating patient profile for test user...")
            patient_profile = PatientProfile(
                user_id=test_user.id
            )
            db.session.add(patient_profile)
            db.session.commit()
            
            print("✅ Patient profile created successfully:")
            print(f"   User ID: {test_user.id}")
            print(f"   Patient Profile ID: {patient_profile.id}")
            
            return patient_profile
            
        except Exception as e:
            print(f"❌ Error creating patient profile: {e}")
            db.session.rollback()
            return None

if __name__ == "__main__":
    add_patient_profile()
