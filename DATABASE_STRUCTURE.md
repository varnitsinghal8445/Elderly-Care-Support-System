# Database Structure - ElderCare Application

## ✅ User Accounts Table

### Table: `users`
**Purpose**: Stores all user account information for authentication and profile management

**Columns**:
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(120) UNIQUE NOT NULL,      -- User's email (used for login)
    full_name VARCHAR(100) NOT NULL,         -- User's full name
    password VARCHAR(200),                    -- User's password
    caretaker_email VARCHAR(120),            -- Optional caretaker email
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features**:
- ✅ `email` is UNIQUE - prevents duplicate accounts
- ✅ `email` is used as the login identifier
- ✅ Each user gets a unique `id`
- ✅ Stores user credentials for authentication

---

## 📊 Data Tables (User-Specific)

All data tables have a `created_by` field that stores the user's email, ensuring data isolation.

### Table: `medicines`
**Purpose**: Stores medicine information for each user
```sql
CREATE TABLE medicines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    med_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency INT DEFAULT 1,
    prescribed_by VARCHAR(100),
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(120) NOT NULL,        -- Links to user's email
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `medicine_schedules`
**Purpose**: Stores medicine intake schedules for each user
```sql
CREATE TABLE medicine_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    medicine_id INT,
    medicine_name VARCHAR(100) NOT NULL,
    intake_time VARCHAR(10) NOT NULL,
    days VARCHAR(200) NOT NULL,              -- Comma-separated days
    active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(120) NOT NULL,        -- Links to user's email
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `stocks`
**Purpose**: Stores medicine stock/inventory for each user
```sql
CREATE TABLE stocks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    medicine_id INT,
    medicine_name VARCHAR(100) NOT NULL,
    quantity FLOAT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    threshold FLOAT NOT NULL,
    expiry_date VARCHAR(20),
    created_by VARCHAR(120) NOT NULL,        -- Links to user's email
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `intake_logs`
**Purpose**: Stores medicine intake logs for each user
```sql
CREATE TABLE intake_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    medicine_id INT,
    medicine_name VARCHAR(100) NOT NULL,
    schedule_id INT,
    scheduled_time VARCHAR(10),
    actual_intake_time VARCHAR(30),
    status VARCHAR(20) NOT NULL,
    intake_date VARCHAR(20) NOT NULL,
    remarks TEXT,
    created_by VARCHAR(120) NOT NULL,        -- Links to user's email
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `notifications`
**Purpose**: Stores notifications for each user
```sql
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    medicine_id INT,
    medicine_name VARCHAR(100),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(120) NOT NULL,        -- Links to user's email
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔐 How Authentication Works

### 1. **User Signup Flow**
```
User fills signup form
    ↓
POST /api/auth/signup
    ↓
Backend creates new record in `users` table
    ↓
{
    email: "user@example.com",
    full_name: "John Doe",
    password: "password123",
    created_date: "2025-10-25 00:00:00"
}
    ↓
Session created with user_email
    ↓
User logged in automatically
```

### 2. **User Login Flow**
```
User enters email & password
    ↓
POST /api/auth/login
    ↓
Backend queries `users` table:
SELECT * FROM users WHERE email = 'user@example.com'
    ↓
Backend verifies password matches
    ↓
Session created with user_email
    ↓
User logged in
```

### 3. **Data Access Flow**
```
User requests medicines
    ↓
GET /api/medicines
    ↓
Backend gets user_email from session
    ↓
Backend queries:
SELECT * FROM medicines WHERE created_by = 'user@example.com'
    ↓
Returns only that user's medicines
```

---

## 🔒 Data Isolation Mechanism

### How Each User Has Their Own Data:

1. **User Table** (`users`)
   - Stores unique user accounts
   - Each user has unique email and id

2. **Data Tables** (medicines, schedules, stocks, logs, notifications)
   - All have `created_by` field
   - `created_by` stores the user's email
   - Backend filters ALL queries by `created_by = session.user_email`

### Example:

**User A** (email: alice@example.com):
```sql
-- Alice's medicines
SELECT * FROM medicines WHERE created_by = 'alice@example.com';
-- Returns: Aspirin, Vitamin D

-- Alice's schedules
SELECT * FROM medicine_schedules WHERE created_by = 'alice@example.com';
-- Returns: Aspirin at 9:00 AM
```

**User B** (email: bob@example.com):
```sql
-- Bob's medicines
SELECT * FROM medicines WHERE created_by = 'bob@example.com';
-- Returns: Insulin, Metformin

-- Bob's schedules
SELECT * FROM medicine_schedules WHERE created_by = 'bob@example.com';
-- Returns: Insulin at 8:00 AM
```

**Result**: Alice and Bob see completely different data!

---

## 🛡️ Security Features

### ✅ Session-Based Authentication
- User email stored in Flask session after login
- Session cookie sent with every request
- Backend validates session before accessing data

### ✅ Automatic Data Filtering
- All GET requests filter by `session.user_email`
- Users cannot access other users' data
- No way to manipulate `created_by` from frontend

### ✅ Ownership Verification
- UPDATE/DELETE operations verify ownership
- Query: `WHERE id = X AND created_by = session.user_email`
- Returns 404 if user doesn't own the resource

### ✅ Unique Email Constraint
- Database enforces unique emails
- Prevents duplicate accounts
- Signup fails if email already exists

---

## 📋 Verify Your Database

### Check if tables exist in MySQL Workbench:

```sql
-- Connect to your database
USE eldercare_db;

-- Show all tables
SHOW TABLES;

-- Expected output:
-- +-------------------------+
-- | Tables_in_eldercare_db  |
-- +-------------------------+
-- | intake_logs             |
-- | medicine_schedules      |
-- | medicines               |
-- | notifications           |
-- | stocks                  |
-- | users                   |
-- +-------------------------+

-- Check users table structure
DESCRIBE users;

-- Check if users exist
SELECT id, email, full_name, created_date FROM users;

-- Check medicines with their owners
SELECT id, med_name, created_by FROM medicines;
```

---

## 🧪 Test Data Isolation

### Test Steps:

1. **Create User A**:
   - Signup with email: `testa@example.com`
   - Add medicine: "Aspirin"

2. **Create User B**:
   - Logout
   - Signup with email: `testb@example.com`
   - Add medicine: "Vitamin C"

3. **Verify Isolation**:
   - Login as User A → Should see only "Aspirin"
   - Login as User B → Should see only "Vitamin C"

4. **Check in MySQL Workbench**:
```sql
-- See all medicines with their owners
SELECT med_name, created_by FROM medicines;

-- Output should show:
-- +----------+-------------------+
-- | med_name | created_by        |
-- +----------+-------------------+
-- | Aspirin  | testa@example.com |
-- | Vitamin C| testb@example.com |
-- +----------+-------------------+
```

---

## ✅ Summary

**YES, the user accounts table exists!**

- ✅ Table name: `users`
- ✅ Stores: email, full_name, password, created_date
- ✅ Used for: Login authentication
- ✅ Links to data: via `created_by` field in all data tables
- ✅ Each user has isolated data
- ✅ Secure session-based authentication

**Your system is properly configured for multi-user support!**
