from flask import Flask, request, jsonify, session
from flask_cors import CORS
from datetime import datetime, timedelta, time as dt_time
import os
import secrets
from database_config import DatabaseConfig
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler

load_dotenv()
app = Flask(__name__)
CORS(app, supports_credentials=True, origins=['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'])
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS


app.config.update(DatabaseConfig.get_flask_config())


from models import db, User, Medicine, MedicineSchedule, Stock, IntakeLog, Notification
from email_utils import send_email


db.init_app(app)

with app.app_context():
    db.create_all()

    if not User.query.filter_by(email='user@example.com').first():
        default_user = User(
            email='user@example.com',
            full_name='Demo User',
            password='demo123'
        )
        db.session.add(default_user)
        db.session.commit()

# ==================== AUTH ENDPOINTS ====================
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    
    # Validate required fields
    if not data.get('email') or not data.get('password') or not data.get('full_name'):
        return jsonify({'error': 'Email, password, and full name are required'}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'error': 'User with this email already exists'}), 400
    
    # Create new user
    try:
        new_user = User(
            email=data['email'],
            full_name=data['full_name'],
            password=data['password'],  # Store password directly (in production, use hashing)
            caretaker_email=data.get('caretaker_email')
        )
        db.session.add(new_user)
        db.session.commit()
        
        # Set session
        session['user_id'] = new_user.id
        session['user_email'] = new_user.email
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': new_user.id,
                'email': new_user.email,
                'full_name': new_user.full_name
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Find user by email
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or user.password != data['password']:
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Set session
    session['user_id'] = user.id
    session['user_email'] = user.email
    
    return jsonify({
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name
        }
    }), 200

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    # Check if user is logged in via session
    user_email = session.get('user_email')
    
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.filter_by(email=user_email).first()
    if user:
        return jsonify({
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'caretaker_email': user.caretaker_email
        })
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/auth/me', methods=['PUT'])
def update_current_user():
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401

    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.json or {}

    # Only fields present in the model will be updated; others are ignored.
    if 'caretaker_email' in data:
        user.caretaker_email = data['caretaker_email'] or None

    # In the current schema, fields like phone/date_of_birth/etc do not exist.
    # They are safely ignored here to avoid errors.

    db.session.commit()

    return jsonify({
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'caretaker_email': user.caretaker_email
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

# ==================== MEDICINE ENDPOINTS ====================
@app.route('/api/medicines', methods=['GET'])
def get_medicines():
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    medicines = Medicine.query.filter_by(created_by=user_email).order_by(Medicine.created_date.desc()).all()
    return jsonify([m.to_dict() for m in medicines])

@app.route('/api/medicines', methods=['POST'])
def create_medicine():
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    medicine = Medicine(
        med_name=data['med_name'],
        dosage=data['dosage'],
        frequency=data.get('frequency', 1),
        prescribed_by=data.get('prescribed_by'),
        notes=data.get('notes'),
        active=data.get('active', True),
        created_by=user_email  # Use session email
    )
    db.session.add(medicine)
    db.session.commit()
    return jsonify(medicine.to_dict()), 201

@app.route('/api/medicines/<int:id>', methods=['PUT'])
def update_medicine(id):
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Only allow updating own medicines
    medicine = Medicine.query.filter_by(id=id, created_by=user_email).first_or_404()
    data = request.json
    
    for key, value in data.items():
        if hasattr(medicine, key) and key != 'created_by':  # Prevent changing owner
            setattr(medicine, key, value)
    
    db.session.commit()
    return jsonify(medicine.to_dict())

@app.route('/api/medicines/<int:id>', methods=['DELETE'])
def delete_medicine(id):
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Only allow deleting own medicines
    medicine = Medicine.query.filter_by(id=id, created_by=user_email).first_or_404()
    db.session.delete(medicine)
    db.session.commit()
    return jsonify({'message': 'Medicine deleted successfully'})

# ==================== SCHEDULE ENDPOINTS ====================
@app.route('/api/schedules', methods=['GET'])
def get_schedules():
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    active = request.args.get('active')
    
    query = MedicineSchedule.query.filter_by(created_by=user_email)
    if active is not None:
        query = query.filter_by(active=active == 'true')
    
    schedules = query.order_by(MedicineSchedule.created_date.desc()).all()
    return jsonify([s.to_dict() for s in schedules])

@app.route('/api/schedules', methods=['POST'])
def create_schedule():
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    schedule = MedicineSchedule(
        medicine_id=data['medicine_id'],
        medicine_name=data['medicine_name'],
        intake_time=data['intake_time'],
        days=','.join(data['days']) if isinstance(data['days'], list) else data['days'],
        active=data.get('active', True),
        created_by=user_email  # Use session email
    )
    db.session.add(schedule)
    db.session.commit()
    return jsonify(schedule.to_dict()), 201

@app.route('/api/schedules/<int:id>', methods=['PUT'])
def update_schedule(id):
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Only allow updating own schedules
    schedule = MedicineSchedule.query.filter_by(id=id, created_by=user_email).first_or_404()
    data = request.json
    
    for key, value in data.items():
        if hasattr(schedule, key) and key != 'created_by':  # Prevent changing owner
            if key == 'days' and isinstance(value, list):
                setattr(schedule, key, ','.join(value))
            else:
                setattr(schedule, key, value)
    
    db.session.commit()
    return jsonify(schedule.to_dict())

@app.route('/api/schedules/<int:id>', methods=['DELETE'])
def delete_schedule(id):
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Only allow deleting own schedules
    schedule = MedicineSchedule.query.filter_by(id=id, created_by=user_email).first_or_404()
    db.session.delete(schedule)
    db.session.commit()
    return jsonify({'message': 'Schedule deleted successfully'})

# ==================== STOCK ENDPOINTS ====================
@app.route('/api/stocks', methods=['GET'])
def get_stocks():
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    stocks = Stock.query.filter_by(created_by=user_email).order_by(Stock.created_date.desc()).all()
    return jsonify([s.to_dict() for s in stocks])

@app.route('/api/stocks', methods=['POST'])
def create_stock():
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    stock = Stock(
        medicine_id=data.get('medicine_id'),
        medicine_name=data['medicine_name'],
        quantity=data['quantity'],
        unit=data['unit'],
        threshold=data['threshold'],
        expiry_date=data.get('expiry_date'),
        created_by=user_email  # Use session email
    )
    db.session.add(stock)
    db.session.commit()
    return jsonify(stock.to_dict()), 201

@app.route('/api/stocks/<int:id>', methods=['PUT'])
def update_stock(id):
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Only allow updating own stocks
    stock = Stock.query.filter_by(id=id, created_by=user_email).first_or_404()
    data = request.json
    
    for key, value in data.items():
        if hasattr(stock, key) and key != 'created_by':  # Prevent changing owner
            setattr(stock, key, value)
    
    db.session.commit()
    return jsonify(stock.to_dict())

@app.route('/api/stocks/<int:id>', methods=['DELETE'])
def delete_stock(id):
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Only allow deleting own stocks
    stock = Stock.query.filter_by(id=id, created_by=user_email).first_or_404()
    db.session.delete(stock)
    db.session.commit()
    return jsonify({'message': 'Stock deleted successfully'})

# ==================== INTAKE LOG ENDPOINTS ====================
@app.route('/api/logs', methods=['GET'])
def get_logs():
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    intake_date = request.args.get('intake_date')
    
    query = IntakeLog.query.filter_by(created_by=user_email)
    if intake_date:
        query = query.filter_by(intake_date=intake_date)
    
    logs = query.order_by(IntakeLog.created_date.desc()).all()
    return jsonify([l.to_dict() for l in logs])

@app.route('/api/logs', methods=['POST'])
def create_log():
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    log = IntakeLog(
        medicine_id=data.get('medicine_id'),
        medicine_name=data['medicine_name'],
        schedule_id=data.get('schedule_id'),
        scheduled_time=data.get('scheduled_time'),
        actual_intake_time=data.get('actual_intake_time'),
        status=data['status'],
        intake_date=data['intake_date'],
        remarks=data.get('remarks'),
        created_by=user_email  # Use session email
    )
    db.session.add(log)
    db.session.commit()
    return jsonify(log.to_dict()), 201

@app.route('/api/logs/<int:id>', methods=['DELETE'])
def delete_log(id):
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401

# ==================== INTAKE QUICK MARK ENDPOINT ====================
@app.route('/api/logs/mark', methods=['POST'])
def mark_log():
    # Upsert today's log for a schedule with current time and status
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.json or {}
    schedule_id = data.get('schedule_id')
    status = data.get('status')  # 'taken' | 'missed'
    if status not in ('taken', 'missed'):
        return jsonify({'error': 'valid status is required'}), 400

    # Resolve schedule: by id if provided, otherwise by medicine_name (+ optional intake_time) for today
    schedule = None
    if schedule_id:
        schedule = MedicineSchedule.query.filter_by(id=schedule_id, created_by=user_email).first()
    else:
        med_name = data.get('medicine_name')
        intake_time = data.get('intake_time')  # may be 'HH:mm' or 'h:mm a'
        if not med_name:
            return jsonify({'error': 'medicine_name or schedule_id is required'}), 400
        # Find user's schedules matching medicine name and today
        all_scheds = MedicineSchedule.query.filter_by(created_by=user_email, active=True, medicine_name=med_name).all()
        today_name = datetime.now().strftime('%A')
        def days_includes(s):
            try:
                return today_name in (s.days or '')
            except Exception:
                return False
        candidates = [s for s in all_scheds if days_includes(s)]
        # Normalize intake_time if provided to HH:mm
        def normalize_time(tstr):
            try:
                d = datetime.strptime(tstr, '%H:%M')
                return d.strftime('%H:%M')
            except Exception:
                try:
                    d = datetime.strptime(tstr, '%I:%M %p')
                    return d.strftime('%H:%M')
                except Exception:
                    return tstr
        if intake_time:
            norm = normalize_time(intake_time)
            for s in candidates:
                if normalize_time(s.intake_time) == norm:
                    schedule = s
                    break
        if schedule is None and candidates:
            # Fallback to first candidate for today
            schedule = sorted(candidates, key=lambda x: x.intake_time)[0]
    if not schedule:
        return jsonify({'error': 'Schedule not found'}), 404

    today = datetime.now().strftime('%Y-%m-%d')
    now_hm = datetime.now().strftime('%H:%M')

    # Find existing log for this schedule and date
    log = IntakeLog.query.filter_by(created_by=user_email, schedule_id=schedule_id, intake_date=today).first()
    if log:
        log.status = status
        log.actual_intake_time = now_hm
        log.medicine_id = schedule.medicine_id
        log.medicine_name = schedule.medicine_name
    else:
        log = IntakeLog(
            medicine_id=schedule.medicine_id,
            medicine_name=schedule.medicine_name,
            schedule_id=schedule_id,
            scheduled_time=schedule.intake_time,
            actual_intake_time=now_hm,
            status=status,
            intake_date=today,
            remarks=None,
            created_by=user_email
        )
        db.session.add(log)

    # If marked taken, decrement stock by 1 (best effort)
    if status == 'taken':
        stock_q = None
        if schedule.medicine_id:
            stock_q = Stock.query.filter_by(created_by=user_email, medicine_id=schedule.medicine_id)
        else:
            stock_q = Stock.query.filter_by(created_by=user_email, medicine_name=schedule.medicine_name)
        stock_item = stock_q.order_by(Stock.created_date.desc()).first()
        if stock_item and isinstance(stock_item.quantity, (int, float)):
            new_qty = max(0, (stock_item.quantity or 0) - 1)
            stock_item.quantity = new_qty

    # Optionally mark a related notification as read
    notif_id = data.get('notification_id')
    if notif_id:
        notif = Notification.query.filter_by(id=notif_id, created_by=user_email).first()
        if notif:
            notif.is_read = True

    db.session.commit()
    return jsonify(log.to_dict())

# ==================== NOTIFICATION ENDPOINTS ====================
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    is_read = request.args.get('is_read')
    limit = request.args.get('limit', type=int)
    
    query = Notification.query.filter_by(created_by=user_email)
    if is_read is not None:
        query = query.filter_by(is_read=is_read == 'true')
    
    query = query.order_by(Notification.created_date.desc())
    
    if limit:
        query = query.limit(limit)
    
    notifications = query.all()
    return jsonify([n.to_dict() for n in notifications])

@app.route('/api/notifications', methods=['POST'])
def create_notification():
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    notification = Notification(
        medicine_id=data.get('medicine_id'),
        medicine_name=data.get('medicine_name'),
        notification_type=data['notification_type'],
        title=data['title'],
        message=data['message'],
        priority=data.get('priority', 'medium'),
        is_read=data.get('is_read', False),
        created_by=user_email  # Use session email
    )
    db.session.add(notification)
    db.session.commit()
    return jsonify(notification.to_dict()), 201

@app.route('/api/notifications/<int:id>', methods=['PUT'])
def update_notification(id):
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Only allow updating own notifications
    notification = Notification.query.filter_by(id=id, created_by=user_email).first_or_404()
    data = request.json
    
    for key, value in data.items():
        if hasattr(notification, key) and key != 'created_by':  # Prevent changing owner
            setattr(notification, key, value)
    
    db.session.commit()
    return jsonify(notification.to_dict())

@app.route('/api/notifications/<int:id>', methods=['DELETE'])
def delete_notification(id):
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Only allow deleting own notifications
    notification = Notification.query.filter_by(id=id, created_by=user_email).first_or_404()
    db.session.delete(notification)
    db.session.commit()
    return jsonify({'message': 'Notification deleted successfully'})

@app.route('/api/notifications/mark-all-read', methods=['POST'])
def mark_all_read():
    # Get user from session for security
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Only mark current user's notifications as read
    Notification.query.filter_by(created_by=user_email, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'})

# ==================== REMINDER SEND (EMAIL) ====================
@app.route('/api/reminders/send', methods=['POST'])
def send_reminder_email():
    # Ensure user is authenticated
    user_email = session.get('user_email')
    if not user_email:
        return jsonify({'error': 'Not authenticated'}), 401

    data = request.json or {}

    # Accept schedule_id (preferred) or full schedule payload
    schedule = None
    if 'schedule_id' in data:
        schedule = MedicineSchedule.query.filter_by(id=data['schedule_id'], created_by=user_email).first()
        if not schedule:
            return jsonify({'error': 'Schedule not found'}), 404
    else:
        # Build a lightweight schedule object from payload for composing email
        class _SchedObj:
            pass
        schedule = _SchedObj()
        schedule.medicine_name = data.get('medicine_name')
        schedule.intake_time = data.get('intake_time')
        schedule.medicine_id = data.get('medicine_id')

    # Get user and caretaker recipients
    user = User.query.filter_by(email=user_email).first()
    recipients = [user.email]
    if user.caretaker_email:
        recipients.append(user.caretaker_email)

    # Compose message (plain text + HTML)
    subject = f"Medicine Reminder • {schedule.medicine_name} at {schedule.intake_time}"
    body = (
        f"Hello,\n\n"
        f"This is your medicine reminder.\n\n"
        f"• Medicine: {schedule.medicine_name}\n"
        f"• Time: {schedule.intake_time}\n\n"
        f"If you've already taken it, you can ignore this message.\n\n"
        f"ElderCare"
    )
    html = f"""
    <div style='font-family: Arial, sans-serif; line-height:1.6; color:#111'>
      <h2 style='margin:0 0 12px'>Medicine Reminder</h2>
      <p style='margin:0 0 12px'>This is your reminder to take:</p>
      <ul style='padding-left:16px; margin:0 0 12px'>
        <li><strong>Medicine:</strong> {schedule.medicine_name}</li>
        <li><strong>Time:</strong> {schedule.intake_time}</li>
      </ul>
      <p style='margin:0 0 16px'>If you've already taken it, you can ignore this message.</p>
      <p style='margin:0; color:#555'>— ElderCare</p>
    </div>
    """

    try:
        status = send_email(recipients, subject, body, html)
    except Exception as e:
        return jsonify({'error': f'Failed to send email: {str(e)}'}), 500

    # Persist a notification entry
    notification = Notification(
        medicine_id=getattr(schedule, 'medicine_id', None),
        medicine_name=schedule.medicine_name,
        notification_type='reminder',
        title=subject,
        message=body,
        priority='medium',
        is_read=False,
        created_by=user_email
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({'message': 'Reminder sent', 'status': status}), 200

# ==================== BACKGROUND REMINDER SCHEDULER ====================
def _normalize_time_str(tstr: str) -> str:
    if not tstr:
        return ''
    try:
        return datetime.strptime(tstr, '%H:%M').strftime('%H:%M')
    except Exception:
        try:
            return datetime.strptime(tstr, '%I:%M %p').strftime('%H:%M')
        except Exception:
            return tstr

def _should_send_for(now: datetime, intake_str: str) -> bool:
    try:
        sched_hm = datetime.strptime(_normalize_time_str(intake_str), '%H:%M').strftime('%H:%M')
        return now.strftime('%H:%M') == sched_hm
    except Exception:
        return False

def background_reminder_job():
    with app.app_context():
        now = datetime.now()
        today_name = now.strftime('%A')
        start_of_day = datetime.combine(now.date(), dt_time.min)
        end_of_day = datetime.combine(now.date(), dt_time.max)

        # Iterate all active schedules
        schedules = MedicineSchedule.query.filter_by(active=True).all()
        for s in schedules:
            # day match
            if today_name not in (s.days or ''):
                continue
            if not _should_send_for(now, s.intake_time):
                continue
            # Skip if intake already logged today
            existing_log = IntakeLog.query.filter_by(created_by=s.created_by, schedule_id=s.id, intake_date=now.strftime('%Y-%m-%d')).first()
            if existing_log:
                continue
            # Skip if a reminder notification for this med+time already exists today
            subject = f"Medicine Reminder • {s.medicine_name} at {s.intake_time}"
            existing_notif = Notification.query.filter(
                Notification.created_by == s.created_by,
                Notification.notification_type == 'reminder',
                Notification.title == subject,
                Notification.created_date >= start_of_day,
                Notification.created_date <= end_of_day
            ).first()
            if existing_notif:
                continue

            # Send email to user + caretaker
            user = User.query.filter_by(email=s.created_by).first()
            if not user:
                continue
            recipients = [user.email]
            if user.caretaker_email:
                recipients.append(user.caretaker_email)

            subject = f"Medicine Reminder • {s.medicine_name} at {s.intake_time}"
            body = (
                f"Hello,\n\nThis is your medicine reminder.\n\n"
                f"• Medicine: {s.medicine_name}\n"
                f"• Time: {s.intake_time}\n\n"
                f"If you've already taken it, you can ignore this message.\n\nElderCare"
            )
            html = f"""
            <div style='font-family: Arial, sans-serif; line-height:1.6; color:#111'>
              <h2 style='margin:0 0 12px'>Medicine Reminder</h2>
              <ul style='padding-left:16px; margin:0 0 12px'>
                <li><strong>Medicine:</strong> {s.medicine_name}</li>
                <li><strong>Time:</strong> {s.intake_time}</li>
              </ul>
              <p style='margin:0 0 16px'>If you've already taken it, you can ignore this message.</p>
              <p style='margin:0; color:#555'>— ElderCare</p>
            </div>
            """
            try:
                send_email(recipients, subject, body, html)
            except Exception:
                pass

            # Create a notification entry
            notif = Notification(
                medicine_id=s.medicine_id,
                medicine_name=s.medicine_name,
                notification_type='reminder',
                title=subject,
                message=body,
                priority='medium',
                is_read=False,
                created_by=s.created_by
            )
            db.session.add(notif)
            db.session.commit()

# Start background scheduler
scheduler = BackgroundScheduler(daemon=True)
scheduler.add_job(background_reminder_job, 'interval', minutes=1)
scheduler.add_job(lambda: background_stock_alert_job(), 'interval', minutes=15)
scheduler.start()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
