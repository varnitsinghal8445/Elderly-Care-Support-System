from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(200))
    caretaker_email = db.Column(db.String(120))
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'caretaker_email': self.caretaker_email,
            'created_date': self.created_date.isoformat() if self.created_date else None
        }

class Medicine(db.Model):
    __tablename__ = 'medicines'
    
    id = db.Column(db.Integer, primary_key=True)
    med_name = db.Column(db.String(100), nullable=False)
    dosage = db.Column(db.String(50), nullable=False)
    frequency = db.Column(db.Integer, default=1)
    prescribed_by = db.Column(db.String(100))
    notes = db.Column(db.Text)
    active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.String(120), nullable=False)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'med_name': self.med_name,
            'dosage': self.dosage,
            'frequency': self.frequency,
            'prescribed_by': self.prescribed_by,
            'notes': self.notes,
            'active': self.active,
            'created_by': self.created_by,
            'created_date': self.created_date.isoformat() if self.created_date else None
        }

class MedicineSchedule(db.Model):
    __tablename__ = 'medicine_schedules'
    
    id = db.Column(db.Integer, primary_key=True)
    medicine_id = db.Column(db.Integer)
    medicine_name = db.Column(db.String(100), nullable=False)
    intake_time = db.Column(db.String(10), nullable=False)
    days = db.Column(db.String(200), nullable=False)  # Comma-separated days
    active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.String(120), nullable=False)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'medicine_id': self.medicine_id,
            'medicine_name': self.medicine_name,
            'intake_time': self.intake_time,
            'days': self.days.split(',') if self.days else [],
            'active': self.active,
            'created_by': self.created_by,
            'created_date': self.created_date.isoformat() if self.created_date else None
        }

class Stock(db.Model):
    __tablename__ = 'stocks'
    
    id = db.Column(db.Integer, primary_key=True)
    medicine_id = db.Column(db.Integer)
    medicine_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    threshold = db.Column(db.Float, nullable=False)
    expiry_date = db.Column(db.String(20))
    created_by = db.Column(db.String(120), nullable=False)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'medicine_id': self.medicine_id,
            'medicine_name': self.medicine_name,
            'quantity': self.quantity,
            'unit': self.unit,
            'threshold': self.threshold,
            'expiry_date': self.expiry_date,
            'created_by': self.created_by,
            'created_date': self.created_date.isoformat() if self.created_date else None
        }

class IntakeLog(db.Model):
    __tablename__ = 'intake_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    medicine_id = db.Column(db.Integer)
    medicine_name = db.Column(db.String(100), nullable=False)
    schedule_id = db.Column(db.Integer)
    scheduled_time = db.Column(db.String(10))
    actual_intake_time = db.Column(db.String(30))
    status = db.Column(db.String(20), nullable=False)
    intake_date = db.Column(db.String(20), nullable=False)
    remarks = db.Column(db.Text)
    created_by = db.Column(db.String(120), nullable=False)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'medicine_id': self.medicine_id,
            'medicine_name': self.medicine_name,
            'schedule_id': self.schedule_id,
            'scheduled_time': self.scheduled_time,
            'actual_intake_time': self.actual_intake_time,
            'status': self.status,
            'intake_date': self.intake_date,
            'remarks': self.remarks,
            'created_by': self.created_by,
            'created_date': self.created_date.isoformat() if self.created_date else None
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    medicine_id = db.Column(db.Integer)
    medicine_name = db.Column(db.String(100))
    notification_type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='medium')
    is_read = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.String(120), nullable=False)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'medicine_id': self.medicine_id,
            'medicine_name': self.medicine_name,
            'notification_type': self.notification_type,
            'title': self.title,
            'message': self.message,
            'priority': self.priority,
            'is_read': self.is_read,
            'created_by': self.created_by,
            'created_date': self.created_date.isoformat() if self.created_date else None
        }
