#!/usr/bin/env python3
"""
Create a new test user with known credentials
"""

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.patient import PatientProfile
from werkzeug.security import generate_password_hash

def create_new_user():
    app = create_app()
    
    with app.app_context():
        try:
            # Create new test user
            print("👤 Creating new test user...")
            new_user = User(
                email='patient@test.com',
                password_hash=generate_password_hash('password123'),
                full_name='Test Patient',
                role='patient'
            )
            db.session.add(new_user)
            db.session.flush()  # Get the ID
            
            # Create patient profile
            patient_profile = PatientProfile(
                user_id=new_user.id
            )
            db.session.add(patient_profile)
            db.session.commit()
            
            print("✅ New test user created successfully:")
            print(f"   Email: {new_user.email}")
            print(f"   Password: password123")
            print(f"   Role: {new_user.role}")
            print(f"   ID: {new_user.id}")
            print(f"   Patient Profile ID: {patient_profile.id}")
            
            return new_user
            
        except Exception as e:
            print(f"❌ Error creating new user: {e}")
            db.session.rollback()
            return None

if __name__ == "__main__":
    create_new_user()
