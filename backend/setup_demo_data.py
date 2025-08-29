#!/usr/bin/env python3
"""
Setup demo data for LeapFrog Healthcare Platform
Creates sample users, doctors, and data for testing
"""

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.doctor import Doctor
from app.models.patient import PatientProfile
from werkzeug.security import generate_password_hash

def create_demo_data():
    app = create_app()
    
    with app.app_context():
        # Clear existing data
        print("🗑️  Clearing existing data...")
        db.drop_all()
        db.create_all()
        
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
        
        # Commit all changes
        db.session.commit()
        
        print("✅ Demo data created successfully!")
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
    create_demo_data()
