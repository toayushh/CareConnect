#!/usr/bin/env python3
"""
Create a simple test user account for testing the frontend
This script creates a user without dropping existing data
"""

from app import create_app
from app.extensions import db
from app.models.user import User
from werkzeug.security import generate_password_hash

def create_test_user():
    app = create_app()
    
    with app.app_context():
        try:
            # Check if test user already exists
            existing_user = User.query.filter_by(email='test@example.com').first()
            if existing_user:
                print("✅ Test user already exists:")
                print(f"   Email: {existing_user.email}")
                print(f"   Role: {existing_user.role}")
                print(f"   ID: {existing_user.id}")
                return existing_user
            
            # Create test patient user
            print("👤 Creating test user...")
            test_user = User(
                email='test@example.com',
                password_hash=generate_password_hash('test123'),
                full_name='Test Patient',
                role='patient'
            )
            db.session.add(test_user)
            db.session.commit()
            
            print("✅ Test user created successfully:")
            print(f"   Email: {test_user.email}")
            print(f"   Password: test123")
            print(f"   Role: {test_user.role}")
            print(f"   ID: {test_user.id}")
            
            return test_user
            
        except Exception as e:
            print(f"❌ Error creating test user: {e}")
            db.session.rollback()
            return None

if __name__ == "__main__":
    create_test_user()
