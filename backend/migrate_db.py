

import os
import sys
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

def create_database():
    """Create all database tables"""
    app = create_app()
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully!")
            
            # Create default user if not exists
            if not User.query.filter_by(email='user@example.com').first():
                default_user = User(
                    email='user@example.com',
                    full_name='Demo User',
                    password='demo123'
                )
                db.session.add(default_user)
                db.session.commit()
                print("Default user created!")
            else:
                print("Default user already exists")
                
        except Exception as e:
            print(f"Error creating database: {e}")
            return False
    return True

def migrate_from_sqlite():
    """Migrate data from SQLite to MySQL"""
    print("Starting migration from SQLite to MySQL...")
    
    # First, load data from SQLite
    sqlite_app = Flask(__name__)
    sqlite_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///eldercare.db'
    sqlite_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(sqlite_app)
    
    # Load MySQL app
    mysql_app = create_app()
    
    try:
        with sqlite_app.app_context():
            # Get all data from SQLite
            users = User.query.all()
            medicines = Medicine.query.all()
            schedules = MedicineSchedule.query.all()
            stocks = Stock.query.all()
            logs = IntakeLog.query.all()
            notifications = Notification.query.all()
            
            print(f"Found {len(users)} users, {len(medicines)} medicines, {len(schedules)} schedules")
            print(f"Found {len(stocks)} stocks, {len(logs)} logs, {len(notifications)} notifications")
        
        with mysql_app.app_context():
            # Create tables in MySQL
            db.create_all()
            
            # Migrate users
            for user in users:
                existing_user = User.query.filter_by(email=user.email).first()
                if not existing_user:
                    new_user = User(
                        email=user.email,
                        full_name=user.full_name,
                        password=user.password,
                        caretaker_email=user.caretaker_email,
                        created_date=user.created_date
                    )
                    db.session.add(new_user)
            
            db.session.commit()
            print("Users migrated successfully!")
            
            # Migrate medicines
            for medicine in medicines:
                new_medicine = Medicine(
                    med_name=medicine.med_name,
                    dosage=medicine.dosage,
                    frequency=medicine.frequency,
                    prescribed_by=medicine.prescribed_by,
                    notes=medicine.notes,
                    active=medicine.active,
                    created_by=medicine.created_by,
                    created_date=medicine.created_date
                )
                db.session.add(new_medicine)
            
            db.session.commit()
            print("Medicines migrated successfully!")
            
            # Migrate schedules
            for schedule in schedules:
                new_schedule = MedicineSchedule(
                    medicine_id=schedule.medicine_id,
                    medicine_name=schedule.medicine_name,
                    intake_time=schedule.intake_time,
                    days=schedule.days,
                    active=schedule.active,
                    created_by=schedule.created_by,
                    created_date=schedule.created_date
                )
                db.session.add(new_schedule)
            
            db.session.commit()
            print("Schedules migrated successfully!")
            
            # Migrate stocks
            for stock in stocks:
                new_stock = Stock(
                    medicine_id=stock.medicine_id,
                    medicine_name=stock.medicine_name,
                    quantity=stock.quantity,
                    unit=stock.unit,
                    threshold=stock.threshold,
                    expiry_date=stock.expiry_date,
                    created_by=stock.created_by,
                    created_date=stock.created_date
                )
                db.session.add(new_stock)
            
            db.session.commit()
            print("Stocks migrated successfully!")
            
            # Migrate logs
            for log in logs:
                new_log = IntakeLog(
                    medicine_id=log.medicine_id,
                    medicine_name=log.medicine_name,
                    schedule_id=log.schedule_id,
                    scheduled_time=log.scheduled_time,
                    actual_intake_time=log.actual_intake_time,
                    status=log.status,
                    intake_date=log.intake_date,
                    remarks=log.remarks,
                    created_by=log.created_by,
                    created_date=log.created_date
                )
                db.session.add(new_log)
            
            db.session.commit()
            print("Logs migrated successfully!")
            
            # Migrate notifications
            for notification in notifications:
                new_notification = Notification(
                    medicine_id=notification.medicine_id,
                    medicine_name=notification.medicine_name,
                    notification_type=notification.notification_type,
                    title=notification.title,
                    message=notification.message,
                    priority=notification.priority,
                    is_read=notification.is_read,
                    created_by=notification.created_by,
                    created_date=notification.created_date
                )
                db.session.add(new_notification)
            
            db.session.commit()
            print("Notifications migrated successfully!")
            
            print("Migration completed successfully!")
            
    except Exception as e:
        print(f"Migration failed: {e}")
        return False
    
    return True

def main():
    """Main function"""
    load_dotenv()
    
    print("ElderCare Database Migration Tool")
    print("=" * 40)
    
    database_type = os.getenv('DATABASE_TYPE', 'sqlite').lower()
    print(f"Database type: {database_type}")
    
    if database_type == 'mysql':
        print("\nChoose an option:")
        print("1. Create fresh MySQL database")
        print("2. Migrate from SQLite to MySQL")
        print("3. Exit")
        
        choice = input("\nEnter your choice (1-3): ").strip()
        
        if choice == '1':
            create_database()
        elif choice == '2':
            migrate_from_sqlite()
        elif choice == '3':
            print("👋 Goodbye!")
        else:
            print("❌ Invalid choice!")
    else:
        print("ℹ️  SQLite mode detected. Run with DATABASE_TYPE=mysql to use MySQL")
        create_database()

if __name__ == '__main__':
    main()
