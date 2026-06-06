from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import date, datetime
from models import db, User, Driver, Vehicle, Route, Trip, Commission
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
db.init_app(app)

# ── Create tables on first run — NO seed data ────────────────────────────────
with app.app_context():
    db.create_all()

    # Only create admin accounts if the users table is empty
    if User.query.count() == 0:
        default_users = [
            ('Mian Muhammad Shafique', 'admin',      'admin123',  'admin'),
            ('Mian Farhan Shafique',   'dispatcher', 'dispatch1', 'dispatcher'),
        ]
        for name, username, password, role in default_users:
            db.session.add(User(
                name=name, username=username,
                password=User.hash_password(password), role=role
            ))
        db.session.commit()
        print("Admin users created. System starts empty — add data via the UI.")


# ── Health Check ─────────────────────────────────────────────────────────────
@app.route('/')
def health():
    return jsonify({
        'status': '✅ Kohistan Transport API is running!',
        'version': '2.0',
        'endpoints': '/api/dashboard, /api/drivers, /api/vehicles, /api/trips, /api/routes'
    })

# ═══════════════════════════════════════════════════════════
# AUTHENTICATION
# ═══════════════════════════════════════════════════════════
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'username and password required'}), 400

    user = User.query.filter_by(username=data['username']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid username or password'}), 401

    return jsonify({'message': 'Login successful', 'user': user.to_dict()})


@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.order_by(User.id).all()
    return jsonify([u.to_dict() for u in users])


@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    user = User(
        name=data['name'], username=data['username'],
        password=User.hash_password(data['password']),
        role=data.get('role', 'dispatcher')
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User created', 'user': user.to_dict()}), 201


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted'})


# ═══════════════════════════════════════════════════════════
# DASHBOARD
# ═══════════════════════════════════════════════════════════
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    today = date.today()

    total_vehicles    = Vehicle.query.count()
    active_trips      = Trip.query.filter_by(status='on_trip').count()
    today_trips       = Trip.query.filter(Trip.trip_date == today).count()

    pending_comm = db.session.query(
        db.func.sum(Commission.amount - Commission.paid)
    ).filter(Commission.status != 'paid').scalar() or 0.0

    today_freight = db.session.query(
        db.func.sum(Trip.freight_amount)
    ).filter(Trip.trip_date == today).scalar() or 0.0

    return jsonify({
        'total_vehicles':    total_vehicles,
        'active_trips':      active_trips,
        'today_trips':       today_trips,
        'pending_commission': round(float(pending_comm), 2),
        'today_revenue':     round(float(today_freight), 2),
    })

# ═══════════════════════════════════════════════════════════
# TRIPS
# ═══════════════════════════════════════════════════════════
@app.route('/api/trips', methods=['GET'])
def get_trips():
    trip_date = request.args.get('date')   # ?date=2026-06-06
    query = Trip.query.order_by(Trip.created_at.desc())
    if trip_date:
        query = query.filter(Trip.trip_date == trip_date)
    return jsonify([t.to_dict() for t in query.all()])


@app.route('/api/trips', methods=['POST'])
def create_trip():
    data = request.json
    if not data.get('driver_name') or not data.get('from_city') or not data.get('to_city'):
        return jsonify({'error': 'driver_name, from_city, to_city are required'}), 400

    # Create or reuse a driver record (daily drivers can be ad-hoc)
    driver = Driver.query.filter_by(name=data['driver_name']).first()
    if not driver:
        driver = Driver(
            name=data['driver_name'],
            phone=data.get('driver_phone', ''),
            status='on_trip'
        )
        db.session.add(driver)
        db.session.flush()

    trip_date = data.get('trip_date', date.today().isoformat())
    trip = Trip(
        driver_id        = driver.id,
        driver_name      = data['driver_name'],
        driver_phone     = data.get('driver_phone', ''),
        vehicle_number   = data.get('vehicle_number', ''),
        from_city        = data['from_city'],
        to_city          = data['to_city'],
        trip_date        = datetime.strptime(trip_date, '%Y-%m-%d').date(),
        freight_amount   = float(data.get('freight_amount', 0)),
        commission_amount= float(data.get('commission_amount', 0)),
        status           = data.get('status', 'available'),
        notes            = data.get('notes', ''),
    )
    db.session.add(trip)
    db.session.flush()

    # Auto-create commission record
    comm = Commission(
        trip_id   = trip.id,
        driver_id = driver.id,
        amount    = float(data.get('commission_amount', 0)),
        paid      = 0.0,
        status    = 'pending',
    )
    db.session.add(comm)
    db.session.commit()

    return jsonify({'message': 'Trip created', 'trip': trip.to_dict()}), 201


@app.route('/api/trips/<int:trip_id>', methods=['PATCH'])
def update_trip_status(trip_id):
    trip = Trip.query.get_or_404(trip_id)
    data = request.json
    if 'status' in data:
        trip.status = data['status']
    db.session.commit()
    return jsonify({'message': 'Updated', 'trip': trip.to_dict()})


@app.route('/api/trips/<int:trip_id>', methods=['DELETE'])
def delete_trip(trip_id):
    trip = Trip.query.get_or_404(trip_id)
    if trip.commission:
        db.session.delete(trip.commission)
    db.session.delete(trip)
    db.session.commit()
    return jsonify({'message': 'Deleted'})

# ═══════════════════════════════════════════════════════════
# DRIVERS
# ═══════════════════════════════════════════════════════════
@app.route('/api/drivers', methods=['GET'])
def get_drivers():
    drivers = Driver.query.order_by(Driver.id.desc()).all()
    return jsonify([d.to_dict() for d in drivers])


@app.route('/api/drivers', methods=['POST'])
def create_driver():
    data = request.json
    if not data.get('name'):
        return jsonify({'error': 'name is required'}), 400
    driver = Driver(
        name=data['name'], name_ur=data.get('name_ur',''),
        phone=data.get('phone',''), cnic=data.get('cnic',''),
        license_no=data.get('license_no',''), notes=data.get('notes','')
    )
    db.session.add(driver)
    db.session.commit()
    return jsonify({'message': 'Driver added', 'driver': driver.to_dict()}), 201


@app.route('/api/drivers/<int:driver_id>', methods=['PATCH'])
def update_driver(driver_id):
    driver = Driver.query.get_or_404(driver_id)
    data = request.json
    for field in ['name','phone','cnic','license_no','status','notes']:
        if field in data:
            setattr(driver, field, data[field])
    db.session.commit()
    return jsonify({'message': 'Updated', 'driver': driver.to_dict()})


@app.route('/api/drivers/<int:driver_id>', methods=['DELETE'])
def delete_driver(driver_id):
    driver = Driver.query.get_or_404(driver_id)
    db.session.delete(driver)
    db.session.commit()
    return jsonify({'message': 'Deleted'})

# ═══════════════════════════════════════════════════════════
# VEHICLES
# ═══════════════════════════════════════════════════════════
@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    vehicles = Vehicle.query.order_by(Vehicle.id.desc()).all()
    return jsonify([v.to_dict() for v in vehicles])


@app.route('/api/vehicles', methods=['POST'])
def create_vehicle():
    data = request.json
    if not data.get('number_plate'):
        return jsonify({'error': 'number_plate is required'}), 400
    v = Vehicle(
        number_plate=data['number_plate'].upper(),
        model=data.get('model',''), capacity=data.get('capacity',''),
        owner_name=data.get('owner_name',''), condition=data.get('condition','good'),
        notes=data.get('notes','')
    )
    db.session.add(v)
    db.session.commit()
    return jsonify({'message': 'Vehicle added', 'vehicle': v.to_dict()}), 201


@app.route('/api/vehicles/<int:vehicle_id>', methods=['PATCH'])
def update_vehicle(vehicle_id):
    v = Vehicle.query.get_or_404(vehicle_id)
    data = request.json
    for field in ['number_plate','model','capacity','owner_name','condition','notes']:
        if field in data:
            setattr(v, field, data[field].upper() if field=='number_plate' else data[field])
    db.session.commit()
    return jsonify({'message': 'Vehicle updated', 'vehicle': v.to_dict()})


@app.route('/api/vehicles/<int:vehicle_id>', methods=['DELETE'])
def delete_vehicle(vehicle_id):
    v = Vehicle.query.get_or_404(vehicle_id)
    db.session.delete(v)
    db.session.commit()
    return jsonify({'message': 'Vehicle deleted'})


@app.route('/api/vehicles/<string:plate>/history', methods=['GET'])
def vehicle_history(plate):
    trips = Trip.query.filter(
        Trip.vehicle_number.ilike(plate)
    ).order_by(Trip.trip_date.desc()).all()
    return jsonify([t.to_dict() for t in trips])

# ═══════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════
@app.route('/api/routes', methods=['GET'])
def get_routes():
    routes = Route.query.order_by(Route.id).all()
    return jsonify([r.to_dict() for r in routes])


@app.route('/api/routes', methods=['POST'])
def create_route():
    data = request.json
    r = Route(
        city_name=data['city_name'],
        city_name_ur=data.get('city_name_ur',''),
        group_name=data.get('group_name','')
    )
    db.session.add(r)
    db.session.commit()
    return jsonify({'message': 'Route added', 'route': r.to_dict()}), 201


@app.route('/api/routes/<int:route_id>', methods=['PATCH'])
def update_route(route_id):
    r = Route.query.get_or_404(route_id)
    data = request.json
    for field in ['city_name','city_name_ur','group_name']:
        if field in data:
            setattr(r, field, data[field])
    db.session.commit()
    return jsonify({'message': 'Route updated', 'route': r.to_dict()})


@app.route('/api/routes/<int:route_id>', methods=['DELETE'])
def delete_route(route_id):
    r = Route.query.get_or_404(route_id)
    db.session.delete(r)
    db.session.commit()
    return jsonify({'message': 'Route deleted'})


@app.route('/api/routes/seed', methods=['POST'])
def seed_routes():
    """Add any missing routes without duplicates."""
    new_routes = request.json or []
    added = 0
    for item in new_routes:
        exists = Route.query.filter_by(city_name=item['city_name']).first()
        if not exists:
            db.session.add(Route(
                city_name=item['city_name'],
                city_name_ur=item.get('city_name_ur',''),
                group_name=item.get('group_name','')
            ))
            added += 1
    db.session.commit()
    return jsonify({'message': f'{added} routes added', 'total': Route.query.count()})

# ═══════════════════════════════════════════════════════════
# COMMISSIONS
# ═══════════════════════════════════════════════════════════
@app.route('/api/commissions', methods=['GET'])
def get_commissions():
    status = request.args.get('status')
    query = Commission.query
    if status:
        query = query.filter_by(status=status)
    return jsonify([c.to_dict() for c in query.order_by(Commission.id.desc()).all()])


@app.route('/api/commissions/<int:comm_id>', methods=['PATCH'])
def update_commission(comm_id):
    comm = Commission.query.get_or_404(comm_id)
    data = request.json

    if 'paid' in data:
        comm.paid = float(data['paid'])
        if comm.paid >= comm.amount:
            comm.status = 'paid'
            comm.paid_date = date.today()
        elif comm.paid > 0:
            comm.status = 'partial'
        else:
            comm.status = 'pending'

    if 'status' in data:
        comm.status = data['status']
        if data['status'] == 'paid':
            comm.paid = comm.amount
            comm.paid_date = date.today()

    db.session.commit()
    return jsonify({'message': 'Commission updated', 'commission': comm.to_dict()})

# ═══════════════════════════════════════════════════════════
# REPORTS
# ═══════════════════════════════════════════════════════════
@app.route('/api/reports/daily', methods=['GET'])
def daily_report():
    report_date = request.args.get('date', date.today().isoformat())
    trips = Trip.query.filter(Trip.trip_date == report_date).all()
    total_freight    = sum(t.freight_amount for t in trips)
    total_commission = sum(t.commission_amount for t in trips)
    return jsonify({
        'date': report_date,
        'total_trips': len(trips),
        'total_freight': total_freight,
        'total_commission': total_commission,
        'net': total_freight - total_commission,
        'trips': [t.to_dict() for t in trips],
    })


@app.route('/api/reports/summary', methods=['GET'])
def summary_report():
    period = request.args.get('period', 'weekly')   # weekly | monthly
    from datetime import timedelta
    today = date.today()
    if period == 'monthly':
        start = today.replace(day=1)
    else:
        start = today - timedelta(days=6)

    trips = Trip.query.filter(Trip.trip_date >= start).all()
    total_freight    = sum(t.freight_amount for t in trips)
    total_commission = sum(t.commission_amount for t in trips)
    pending_comm = db.session.query(
        db.func.sum(Commission.amount - Commission.paid)
    ).filter(Commission.status != 'paid').scalar() or 0.0

    return jsonify({
        'period': period,
        'from': start.isoformat(),
        'to': today.isoformat(),
        'total_trips': len(trips),
        'total_freight': total_freight,
        'total_commission': total_commission,
        'net': total_freight - total_commission,
        'pending_commission': float(pending_comm),
    })


# ═══════════════════════════════════════════════════════════
# ANALYTICS  (live, no static data)
# ═══════════════════════════════════════════════════════════
@app.route('/api/analytics', methods=['GET'])
def analytics():
    from datetime import timedelta
    from collections import defaultdict

    period = request.args.get('period', 'monthly')   # monthly | weekly
    today  = date.today()

    if period == 'monthly':
        # last 6 months
        months = []
        for i in range(5, -1, -1):
            # compute year/month going back i months
            month = today.month - i
            year  = today.year
            while month <= 0:
                month += 12
                year  -= 1
            months.append((year, month))

        monthly_data = []
        for (yr, mo) in months:
            if mo == 12:
                next_yr, next_mo = yr + 1, 1
            else:
                next_yr, next_mo = yr, mo + 1
            start = date(yr, mo, 1)
            end   = date(next_yr, next_mo, 1)
            trips_q = Trip.query.filter(Trip.trip_date >= start, Trip.trip_date < end).all()
            rev  = sum(t.freight_amount    for t in trips_q)
            comm = sum(t.commission_amount for t in trips_q)
            month_label = start.strftime('%b')   # 'Jan', 'Feb', …
            monthly_data.append({
                'month':      month_label,
                'trips':      len(trips_q),
                'revenue':    round(float(rev),  2),
                'commission': round(float(comm), 2),
            })
    else:
        # last 7 days
        weekly_data = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            trips_q = Trip.query.filter(Trip.trip_date == d).all()
            rev  = sum(t.freight_amount    for t in trips_q)
            comm = sum(t.commission_amount for t in trips_q)
            weekly_data.append({
                'month':      d.strftime('%a'),
                'trips':      len(trips_q),
                'revenue':    round(float(rev),  2),
                'commission': round(float(comm), 2),
            })
        monthly_data = weekly_data

    # ── Route breakdown ──────────────────────────────────────
    COLORS = ['#1d4ed8','#ef4444','#10b981','#f59e0b','#8b5cf6','#0ea5e9','#f97316','#14b8a6']
    all_trips = Trip.query.all()
    route_counts  = defaultdict(lambda: {'trips': 0, 'revenue': 0.0})
    for tr in all_trips:
        dest = tr.to_city or 'Unknown'
        route_counts[dest]['trips']   += 1
        route_counts[dest]['revenue'] += float(tr.freight_amount or 0)

    route_data = []
    for i, (city, vals) in enumerate(
        sorted(route_counts.items(), key=lambda x: x[1]['trips'], reverse=True)[:8]
    ):
        route_data.append({
            'name':    city,
            'trips':   vals['trips'],
            'revenue': round(vals['revenue'], 2),
            'color':   COLORS[i % len(COLORS)],
        })

    # ── Top vehicles ────────────────────────────────────────
    vehicle_counts = defaultdict(lambda: {'trips': 0, 'commission': 0.0})
    for tr in all_trips:
        plate = tr.vehicle_number or '—'
        vehicle_counts[plate]['trips']      += 1
        vehicle_counts[plate]['commission'] += float(tr.commission_amount or 0)

    vehicle_data = [
        {
            'vehicle':    plate,
            'trips':      vals['trips'],
            'commission': round(vals['commission'], 2),
        }
        for plate, vals in sorted(
            vehicle_counts.items(), key=lambda x: x[1]['trips'], reverse=True
        )[:5]
        if plate != '—'
    ]

    # ── KPI totals (all time) ────────────────────────────────
    total_trips   = len(all_trips)
    total_revenue = round(sum(float(t.freight_amount    or 0) for t in all_trips), 2)
    total_comm    = round(sum(float(t.commission_amount or 0) for t in all_trips), 2)

    return jsonify({
        'period':       period,
        'monthly_data': monthly_data,
        'route_data':   route_data,
        'vehicle_data': vehicle_data,
        'kpi': {
            'total_trips':   total_trips,
            'total_revenue': total_revenue,
            'total_commission': total_comm,
            'net_income':    round(total_revenue - total_comm, 2),
        },
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
