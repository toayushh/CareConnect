#!/usr/bin/env python3
"""
Check test user credentials
"""

from app import create_app
from app.extensions import db
from app.models.user import User
from werkzeug.security import check_password_hash

def check_user():
    app = create_app()
    
    with app.app_context():
        try:
            # Find existing test user
            test_user = User.query.filter_by(email='test@example.com').first()
            if not test_user:
                print("❌ Test user not found")
                return
            
            print(f"✅ Test user found:")
            print(f"   Email: {test_user.email}")
            print(f"   ID: {test_user.id}")
            print(f"   Role: {test_user.role}")
            print(f"   Password hash: {test_user.password_hash}")
            
            # Test password
            test_password = 'test123'
            is_valid = check_password_hash(test_user.password_hash, test_password)
            print(f"   Password 'test123' valid: {is_valid}")
            
            # Try other common passwords
            common_passwords = ['password', '123456', 'admin', 'test', 'user']
            for pwd in common_passwords:
                is_valid = check_password_hash(test_user.password_hash, pwd)
                print(f"   Password '{pwd}' valid: {is_valid}")
            
        except Exception as e:
            print(f"❌ Error checking user: {e}")

if __name__ == "__main__":
    check_user()
