#!/usr/bin/env python3
"""
Database Verification Script
Checks if all tables exist and shows sample data
"""

import os
from dotenv import load_dotenv
from database_config import DatabaseConfig
from models import db, User, Medicine, MedicineSchedule, Stock, IntakeLog, Notification
from flask import Flask

def create_app():
    """Create Flask app with database configuration"""
    app = Flask(__name__)
    app.config.update(DatabaseConfig.get_flask_config())
    db.init_app(app)
    return app

def verify_database():
    """Verify database structure and show data"""
    print("=" * 60)
    print("DATABASE VERIFICATION REPORT")
    print("=" * 60)
    
    app = create_app()
    with app.app_context():
        try:
            # Check Users table
            print("\n✅ USERS TABLE")
            print("-" * 60)
            users = User.query.all()
            print(f"Total users: {len(users)}")
            for user in users:
                print(f"  - {user.email} | {user.full_name} | Created: {user.created_date}")
            
            # Check Medicines table
            print("\n✅ MEDICINES TABLE")
            print("-" * 60)
            medicines = Medicine.query.all()
            print(f"Total medicines: {len(medicines)}")
            for med in medicines[:5]:  # Show first 5
                print(f"  - {med.med_name} | Owner: {med.created_by}")
            if len(medicines) > 5:
                print(f"  ... and {len(medicines) - 5} more")
            
            # Check Schedules table
            print("\n✅ MEDICINE SCHEDULES TABLE")
            print("-" * 60)
            schedules = MedicineSchedule.query.all()
            print(f"Total schedules: {len(schedules)}")
            for schedule in schedules[:5]:  # Show first 5
                print(f"  - {schedule.medicine_name} at {schedule.intake_time} | Owner: {schedule.created_by}")
            if len(schedules) > 5:
                print(f"  ... and {len(schedules) - 5} more")
            
            # Check Stocks table
            print("\n✅ STOCKS TABLE")
            print("-" * 60)
            stocks = Stock.query.all()
            print(f"Total stock items: {len(stocks)}")
            for stock in stocks[:5]:  # Show first 5
                print(f"  - {stock.medicine_name} | Qty: {stock.quantity} {stock.unit} | Owner: {stock.created_by}")
            if len(stocks) > 5:
                print(f"  ... and {len(stocks) - 5} more")
            
            # Check Logs table
            print("\n✅ INTAKE LOGS TABLE")
            print("-" * 60)
            logs = IntakeLog.query.all()
            print(f"Total logs: {len(logs)}")
            for log in logs[:5]:  # Show first 5
                print(f"  - {log.medicine_name} | Status: {log.status} | Owner: {log.created_by}")
            if len(logs) > 5:
                print(f"  ... and {len(logs) - 5} more")
            
            # Check Notifications table
            print("\n✅ NOTIFICATIONS TABLE")
            print("-" * 60)
            notifications = Notification.query.all()
            print(f"Total notifications: {len(notifications)}")
            for notif in notifications[:5]:  # Show first 5
                print(f"  - {notif.title} | Owner: {notif.created_by}")
            if len(notifications) > 5:
                print(f"  ... and {len(notifications) - 5} more")
            
            # Summary
            print("\n" + "=" * 60)
            print("SUMMARY")
            print("=" * 60)
            print(f"✅ All 6 tables exist and are accessible")
            print(f"✅ Users table has {len(users)} user(s)")
            print(f"✅ Data tables contain records from {len(set([m.created_by for m in medicines]))} unique user(s)")
            print("\n✅ Database is properly configured!")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n❌ ERROR: {e}")
            print("\nPossible issues:")
            print("1. MySQL server not running")
            print("2. Database 'eldercare_db' doesn't exist")
            print("3. Connection credentials incorrect in .env file")
            print("4. Tables not created yet (run migrate_db.py)")
            return False
    
    return True

if __name__ == '__main__':
    load_dotenv()
    verify_database()
