import json
import os
import subprocess
import datetime
import requests
import random
from flask import Flask, request, jsonify, send_from_directory, g, redirect, session
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE = os.path.join(BASE_DIR, 'database.db')
SECURITY_HELPER_DIR = os.path.join(BASE_DIR, 'rust_security')


def rust_security_helper_path():
    exe_name = 'security_helper.exe' if os.name == 'nt' else 'security_helper'
    binary_path = os.path.join(SECURITY_HELPER_DIR, 'target', 'debug', exe_name)
    return binary_path


def run_security_helper(args):
    helper_path = rust_security_helper_path()
    if os.path.exists(helper_path):
        cmd = [helper_path] + args
    else:
        cmd = ['cargo', 'run', '--quiet', '--manifest-path', os.path.join(SECURITY_HELPER_DIR, 'Cargo.toml'), '--'] + args

    try:
        result = subprocess.run(cmd, cwd=SECURITY_HELPER_DIR, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as exc:
        error_message = exc.stderr.strip() if exc.stderr else exc.stdout.strip()
        raise RuntimeError(f"Security helper failed: {error_message}")


def rust_hash_password(password):
    try:
        return run_security_helper(['hash', '--password', password])
    except Exception:
        return generate_password_hash(password)


def rust_verify_password(password, password_hash):
    try:
        result = run_security_helper(['verify-hash', '--password', password, '--hash', password_hash])
        return result.lower() == 'true'
    except Exception:
        return check_password_hash(password_hash, password)





app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = 'your_secret_key_here'  # Change to a secure key in production

ADMIN_EMAIL = 'admin@gcare.com'
ADMIN_PASSWORD_HASH = generate_password_hash('Admin@123')


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    db.executescript('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        password_hash TEXT NOT NULL,
        address TEXT,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        base_price INTEGER NOT NULL,
        category TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS service_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        credits INTEGER DEFAULT 0,
        rating REAL DEFAULT 0.0,
        is_active INTEGER DEFAULT 1,
        joined_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(service_id) REFERENCES services(id),
        UNIQUE(user_id, service_id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        admin_id INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS service_member_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        years_experience INTEGER NOT NULL,
        service_name TEXT NOT NULL,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        requested_at TEXT NOT NULL,
        responded_at TEXT,
        response_note TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        service TEXT NOT NULL,
        service_detail TEXT,
        services TEXT,
        amount INTEGER NOT NULL,
        date TEXT,
        time TEXT,
        address TEXT,
        message TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        razorpay_payment_id TEXT,
        amount INTEGER NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
    ''')
    db.commit()


with app.app_context():
    init_db()


def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv


def get_request_data():
    data = request.get_json(silent=True)
    if data is not None:
        return data

    if request.form:
        form_data = request.form.to_dict(flat=False)
        return {key: values if len(values) > 1 else values[0] for key, values in form_data.items()}

    return {}


@app.route('/api/signup', methods=['POST'])
def signup():
    data = get_request_data()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')

    if not session.get('phone_verified') or session['phone_verified'] != phone:
        return jsonify({'message': 'Phone verification required.'}), 400

    if not name or not email or not password:
        return jsonify({'message': 'Name, email and password are required.'}), 400

    if query_db('SELECT id FROM users WHERE email = ?', [email], one=True):
        return jsonify({'message': 'This email is already registered.'}), 400

    password_hash = rust_hash_password(password)
    created_at = datetime.datetime.utcnow().isoformat()
    db = get_db()
    db.execute(
        'INSERT INTO users (name, email, phone, password_hash, address, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        (name, email, phone, password_hash, '', created_at)
    )
    db.commit()

    user = query_db('SELECT id, name, email, phone, address FROM users WHERE email = ?', [email], one=True)

    # Clear verification flag
    session.pop('phone_verified', None)

    return jsonify({
        'id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'phone': user['phone'],
        'address': user['address']
    }), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = get_request_data()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')


    if not email or not password:
        return jsonify({'message': 'Email and password are required.'}), 400

    user = query_db('SELECT id, name, email, phone, address, password_hash FROM users WHERE email = ?', [email], one=True)
    if not user or not rust_verify_password(password, user['password_hash']):
        return jsonify({'message': 'Invalid email or password.'}), 401

    return jsonify({
        'id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'phone': user['phone'],
        'address': user['address']
    })


@app.route('/api/bookings', methods=['GET', 'POST'])
def create_booking():
    if request.method == 'GET':
        return redirect('/booked.html')

    data = get_request_data()
    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'message': 'User email is required for booking.'}), 400

    user = query_db('SELECT id FROM users WHERE email = ?', [email], one=True)
    if not user:
        return jsonify({'message': 'User not found. Please login again.'}), 404

    user_id = user['id']
    service = data.get('service', '').strip()
    service_detail = data.get('serviceDetail', '').strip() if data.get('serviceDetail') else ''
    services = data.get('services')
    amount = int(data.get('amount', 0))
    date = data.get('date', '')
    time = data.get('time', '')
    address = data.get('address', '').strip()
    message = data.get('message', '').strip()
    created_at = datetime.datetime.utcnow().isoformat()

    if not service and not services:
        return jsonify({'message': 'At least one service must be selected.'}), 400
    if amount <= 0:
        return jsonify({'message': 'Amount must be greater than 0.'}), 400

    get_db().execute(
        'INSERT INTO bookings (user_id, service, service_detail, services, amount, date, time, address, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        (user_id, service, service_detail, json.dumps(services) if services else None, amount, date, time, address, message, created_at)
    )
    get_db().commit()

    return jsonify({'message': 'Booking created successfully.'}), 201


@app.route('/api/payments', methods=['POST'])
def create_payment():
    data = get_request_data()
    email = data.get('email', '').strip().lower()
    razorpay_payment_id = data.get('razorpay_payment_id', '').strip()
    amount = int(data.get('amount', 0))
    description = data.get('description', '').strip()

    if not email or not razorpay_payment_id or amount <= 0:
        return jsonify({'message': 'Missing payment information.'}), 400

    user = query_db('SELECT id FROM users WHERE email = ?', [email], one=True)
    if not user:
        return jsonify({'message': 'User not found.'}), 404

    created_at = datetime.datetime.utcnow().isoformat()
    get_db().execute(
        'INSERT INTO payments (user_id, razorpay_payment_id, amount, description, created_at) VALUES (?, ?, ?, ?, ?)',
        (user['id'], razorpay_payment_id, amount, description, created_at)
    )
    get_db().commit()

    return jsonify({'message': 'Payment recorded successfully.'}), 201


@app.route('/api/send-otp', methods=['POST'])
def send_otp():
    data = get_request_data()
    phone = data.get('phone', '').strip()

    if not phone:
        return jsonify({'message': 'Phone number is required.'}), 400

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    session['otp'] = otp
    session['otp_phone'] = phone

    # Mock SMS sending - in production, integrate with Twilio or similar
    print(f"OTP for {phone}: {otp}")  # For demo purposes

    return jsonify({'message': 'OTP sent successfully.'}), 200


@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = get_request_data()
    otp_input = data.get('otp', '').strip()
    phone = data.get('phone', '').strip()

    stored_otp = session.get('otp')
    stored_phone = session.get('otp_phone')

    if not stored_otp or not stored_phone:
        return jsonify({'message': 'OTP not sent or expired.'}), 400

    if phone != stored_phone:
        return jsonify({'message': 'Phone number mismatch.'}), 400

    if otp_input != stored_otp:
        return jsonify({'message': 'Invalid OTP.'}), 400

    # Clear session
    session.pop('otp', None)
    session.pop('otp_phone', None)
    session['phone_verified'] = phone

    return jsonify({'message': 'OTP verified successfully.'}), 200


@app.route('/api/admin/users', methods=['GET'])
def admin_users():
    users = query_db('SELECT id, name, email, phone, address, created_at FROM users')
    return jsonify([dict(u) for u in users])


@app.route('/api/admin/bookings', methods=['GET'])
def admin_bookings():
    bookings = query_db('SELECT b.id, b.user_id, u.email AS user_email, u.name AS user_name, b.service, b.service_detail, b.services, b.amount, b.date, b.time, b.address, b.message, b.created_at FROM bookings b JOIN users u ON b.user_id = u.id')
    return jsonify([dict(b) for b in bookings])


@app.route('/api/admin/payments', methods=['GET'])
def admin_payments():
    payments = query_db('SELECT p.id, p.user_id, u.email AS user_email, u.name AS user_name, p.razorpay_payment_id, p.amount, p.description, p.created_at FROM payments p JOIN users u ON p.user_id = u.id')
    return jsonify([dict(p) for p in payments])


# Service Management Endpoints
@app.route('/api/admin/services', methods=['GET', 'POST'])
def admin_services():
    if request.method == 'GET':
        services = query_db('SELECT * FROM services ORDER BY created_at DESC')
        return jsonify([dict(s) for s in services])

    # POST - Add new service
    data = get_request_data()
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    base_price = int(data.get('base_price', 0))
    category = data.get('category', '').strip()

    if not name or base_price <= 0:
        return jsonify({'message': 'Service name and valid base price are required.'}), 400

    if query_db('SELECT id FROM services WHERE name = ?', [name], one=True):
        return jsonify({'message': 'Service with this name already exists.'}), 400

    created_at = datetime.datetime.utcnow().isoformat()
    get_db().execute(
        'INSERT INTO services (name, description, base_price, category, created_at) VALUES (?, ?, ?, ?, ?)',
        (name, description, base_price, category, created_at)
    )
    get_db().commit()

    return jsonify({'message': 'Service added successfully.'}), 201


@app.route('/api/admin/services/<int:service_id>', methods=['PUT', 'DELETE'])
def admin_service_detail(service_id):
    if request.method == 'DELETE':
        get_db().execute('DELETE FROM services WHERE id = ?', [service_id])
        get_db().commit()
        return jsonify({'message': 'Service deleted successfully.'}), 200

    # PUT - Update service
    data = get_request_data()
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    base_price = int(data.get('base_price', 0))
    category = data.get('category', '').strip()
    is_active = int(data.get('is_active', 1))

    if not name or base_price <= 0:
        return jsonify({'message': 'Service name and valid base price are required.'}), 400

    # Check if name conflicts with other services
    existing = query_db('SELECT id FROM services WHERE name = ? AND id != ?', [name, service_id], one=True)
    if existing:
        return jsonify({'message': 'Service with this name already exists.'}), 400

    updated_at = datetime.datetime.utcnow().isoformat()
    get_db().execute(
        'UPDATE services SET name = ?, description = ?, base_price = ?, category = ?, is_active = ? WHERE id = ?',
        (name, description, base_price, category, is_active, service_id)
    )
    get_db().commit()

    return jsonify({'message': 'Service updated successfully.'}), 200


# Service Member Management Endpoints
@app.route('/api/admin/service-members', methods=['GET', 'POST'])
def admin_service_members():
    if request.method == 'GET':
        members = query_db('''
            SELECT sm.id, sm.user_id, sm.service_id, sm.credits, sm.rating, sm.is_active, sm.joined_at,
                   u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
                   s.name AS service_name, s.category AS service_category
            FROM service_members sm
            JOIN users u ON sm.user_id = u.id
            JOIN services s ON sm.service_id = s.id
            ORDER BY sm.joined_at DESC
        ''')
        return jsonify([dict(m) for m in members])

    # POST - Add service member
    data = get_request_data()
    user_email = data.get('user_email', '').strip().lower()
    service_name = data.get('service_name', '').strip()
    credits = int(data.get('credits', 0))

    user = query_db('SELECT id FROM users WHERE email = ?', [user_email], one=True)
    if not user:
        return jsonify({'message': 'User not found.'}), 404

    service = query_db('SELECT id FROM services WHERE name = ?', [service_name], one=True)
    if not service:
        return jsonify({'message': 'Service not found.'}), 404

    # Check if already a member
    existing = query_db('SELECT id FROM service_members WHERE user_id = ? AND service_id = ?',
                       [user['id'], service['id']], one=True)
    if existing:
        return jsonify({'message': 'User is already a member of this service.'}), 400

    joined_at = datetime.datetime.utcnow().isoformat()
    get_db().execute(
        'INSERT INTO service_members (user_id, service_id, credits, joined_at) VALUES (?, ?, ?, ?)',
        (user['id'], service['id'], credits, joined_at)
    )
    get_db().commit()

    return jsonify({'message': 'Service member added successfully.'}), 201


@app.route('/api/service-member-requests', methods=['POST'])
def create_service_member_request():
    data = get_request_data()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone', '').strip()
    years_experience = int(data.get('years_experience', 0))
    service_name = data.get('service_name', '').strip()
    message = data.get('message', '').strip()

    if not name or not email or not phone or not service_name or years_experience < 0:
        return jsonify({'message': 'All fields are required and experience must be valid.'}), 400

    requested_at = datetime.datetime.utcnow().isoformat()
    db = get_db()
    db.execute(
        'INSERT INTO service_member_requests (name, email, phone, years_experience, service_name, message, status, requested_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        (name, email, phone, years_experience, service_name, message, 'pending', requested_at)
    )
    db.commit()

    return jsonify({'message': 'Service member request submitted successfully.'}), 201


@app.route('/api/admin/service-members/<int:member_id>', methods=['PUT', 'DELETE'])
def admin_service_member_detail(member_id):
    if request.method == 'DELETE':
        get_db().execute('DELETE FROM service_members WHERE id = ?', [member_id])
        get_db().commit()
        return jsonify({'message': 'Service member removed successfully.'}), 200

    # PUT - Update service member
    data = get_request_data()
    credits = int(data.get('credits', 0))
    rating = float(data.get('rating', 0.0))
    is_active = int(data.get('is_active', 1))

    get_db().execute(
        'UPDATE service_members SET credits = ?, rating = ?, is_active = ? WHERE id = ?',
        (credits, rating, is_active, member_id)
    )
    get_db().commit()

    return jsonify({'message': 'Service member updated successfully.'}), 200


@app.route('/api/admin/service-member-requests', methods=['GET'])
def admin_service_member_requests():
    requests_data = query_db('SELECT id, name, email, phone, years_experience, service_name, message, status, requested_at, responded_at, response_note FROM service_member_requests ORDER BY requested_at DESC')
    return jsonify([dict(r) for r in requests_data])


@app.route('/api/admin/service-member-requests/<int:request_id>', methods=['PUT'])
def admin_service_member_request_detail(request_id):
    data = get_request_data()
    status = data.get('status', '').strip().lower()
    response_note = data.get('response_note', '').strip()

    if status not in ('accepted', 'rejected'):
        return jsonify({'message': 'Invalid request action.'}), 400

    req = query_db('SELECT * FROM service_member_requests WHERE id = ?', [request_id], one=True)
    if not req:
        return jsonify({'message': 'Request not found.'}), 404

    responded_at = datetime.datetime.utcnow().isoformat()
    db = get_db()
    db.execute(
        'UPDATE service_member_requests SET status = ?, response_note = ?, responded_at = ? WHERE id = ?',
        (status, response_note, responded_at, request_id)
    )

    if status == 'accepted':
        user = query_db('SELECT id FROM users WHERE email = ?', [req['email']], one=True)
        if not user:
            password_hash = rust_hash_password(os.urandom(32).hex())
            db.execute(
                'INSERT INTO users (name, email, phone, password_hash, address, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                (req['name'], req['email'], req['phone'], password_hash, '', responded_at)
            )
            user_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]
        else:
            user_id = user['id']

        service = query_db('SELECT id FROM services WHERE name = ?', [req['service_name']], one=True)
        if service and not query_db('SELECT id FROM service_members WHERE user_id = ? AND service_id = ?', [user_id, service['id']], one=True):
            db.execute(
                'INSERT INTO service_members (user_id, service_id, credits, joined_at) VALUES (?, ?, ?, ?)',
                (user_id, service['id'], 0, responded_at)
            )

    db.commit()
    return jsonify({'message': f'Request {status} successfully.'}), 200


# Announcement Management Endpoints
@app.route('/api/admin/announcements', methods=['GET', 'POST'])
def admin_announcements():
    if request.method == 'GET':
        announcements = query_db('SELECT * FROM announcements ORDER BY created_at DESC')
        return jsonify([dict(a) for a in announcements])

    # POST - Add announcement
    data = get_request_data()
    title = data.get('title', '').strip()
    content = data.get('content', '').strip()

    if not title or not content:
        return jsonify({'message': 'Title and content are required.'}), 400

    created_at = datetime.datetime.utcnow().isoformat()
    admin_id = 'admin@gcare.com'  # Fixed admin ID since no login required

    get_db().execute(
        'INSERT INTO announcements (title, content, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        (title, content, admin_id, created_at, created_at)
    )
    get_db().commit()

    return jsonify({'message': 'Announcement added successfully.'}), 201


@app.route('/api/admin/announcements/<int:announcement_id>', methods=['PUT', 'DELETE'])
def admin_announcement_detail(announcement_id):
    if request.method == 'DELETE':
        get_db().execute('DELETE FROM announcements WHERE id = ?', [announcement_id])
        get_db().commit()
        return jsonify({'message': 'Announcement deleted successfully.'}), 200

    # PUT - Update announcement
    data = get_request_data()
    title = data.get('title', '').strip()
    content = data.get('content', '').strip()
    is_active = int(data.get('is_active', 1))

    if not title or not content:
        return jsonify({'message': 'Title and content are required.'}), 400

    updated_at = datetime.datetime.utcnow().isoformat()
    get_db().execute(
        'UPDATE announcements SET title = ?, content = ?, is_active = ?, updated_at = ? WHERE id = ?',
        (title, content, is_active, updated_at, announcement_id)
    )
    get_db().commit()

    return jsonify({'message': 'Announcement updated successfully.'}), 200


# Public endpoint to get active announcements
@app.route('/api/announcements', methods=['GET'])
def get_announcements():
    announcements = query_db('SELECT id, title, content, created_at FROM announcements WHERE is_active = 1 ORDER BY created_at DESC')
    return jsonify([dict(a) for a in announcements])


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != '' and os.path.exists(os.path.join(BASE_DIR, path)):
        return send_from_directory(BASE_DIR, path)
    return send_from_directory(BASE_DIR, 'index.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
