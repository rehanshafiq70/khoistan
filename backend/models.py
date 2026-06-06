from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import hashlib

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(100), nullable=False)
    username   = db.Column(db.String(50), nullable=False, unique=True)
    password   = db.Column(db.String(256), nullable=False)   # hashed
    role       = db.Column(db.String(20), default='dispatcher')  # admin, dispatcher
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @staticmethod
    def hash_password(pwd):
        return hashlib.sha256(pwd.encode()).hexdigest()

    def check_password(self, pwd):
        return self.password == self.hash_password(pwd)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name,
            'username': self.username, 'role': self.role,
        }


class Driver(db.Model):
    __tablename__ = 'drivers'
    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(100), nullable=False)
    name_ur    = db.Column(db.String(150))
    phone      = db.Column(db.String(20))
    cnic       = db.Column(db.String(20))
    license_no = db.Column(db.String(50))
    status     = db.Column(db.String(20), default='available')  # available, on_trip, off_duty
    notes      = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    trips       = db.relationship('Trip', backref='driver', lazy=True, foreign_keys='Trip.driver_id')
    commissions = db.relationship('Commission', backref='driver', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'name_ur': self.name_ur,
            'phone': self.phone,
            'cnic': self.cnic,
            'license_no': self.license_no,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Vehicle(db.Model):
    __tablename__ = 'vehicles'
    id            = db.Column(db.Integer, primary_key=True)
    number_plate  = db.Column(db.String(20), nullable=False, unique=True)
    model         = db.Column(db.String(100))
    capacity      = db.Column(db.String(50))
    owner_name    = db.Column(db.String(100))
    condition     = db.Column(db.String(20), default='good')  # good, average, poor
    notes         = db.Column(db.Text)

    trips = db.relationship('Trip', backref='vehicle', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'number_plate': self.number_plate,
            'model': self.model,
            'capacity': self.capacity,
            'owner_name': self.owner_name,
            'condition': self.condition,
            'notes': self.notes,
        }


class Route(db.Model):
    __tablename__ = 'routes'
    id           = db.Column(db.Integer, primary_key=True)
    city_name    = db.Column(db.String(100), nullable=False)
    city_name_ur = db.Column(db.String(150))
    group_name   = db.Column(db.String(100))

    def to_dict(self):
        return {
            'id': self.id,
            'city_name': self.city_name,
            'city_name_ur': self.city_name_ur,
            'group_name': self.group_name,
        }


class Trip(db.Model):
    __tablename__ = 'trips'
    id               = db.Column(db.Integer, primary_key=True)
    driver_id        = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=False)
    vehicle_id       = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=True)
    driver_name      = db.Column(db.String(100))   # allow free-text daily entry
    driver_phone     = db.Column(db.String(20))
    vehicle_number   = db.Column(db.String(20))
    from_city        = db.Column(db.String(100), nullable=False)
    to_city          = db.Column(db.String(100), nullable=False)
    trip_date        = db.Column(db.Date, default=datetime.utcnow)
    freight_amount   = db.Column(db.Float, default=0.0)
    commission_amount= db.Column(db.Float, default=0.0)
    status           = db.Column(db.String(20), default='available')  # available, on_trip, completed, cancelled
    notes            = db.Column(db.Text)
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)

    commission = db.relationship('Commission', backref='trip', uselist=False)

    def to_dict(self):
        return {
            'id': self.id,
            'driver_id': self.driver_id,
            'vehicle_id': self.vehicle_id,
            'driver_name': self.driver_name,
            'driver_phone': self.driver_phone,
            'vehicle_number': self.vehicle_number,
            'from_city': self.from_city,
            'to_city': self.to_city,
            'trip_date': self.trip_date.isoformat() if self.trip_date else None,
            'freight_amount': self.freight_amount,
            'commission_amount': self.commission_amount,
            'status': self.status,
            'notes': self.notes,
        }


class Commission(db.Model):
    __tablename__ = 'commissions'
    id        = db.Column(db.Integer, primary_key=True)
    trip_id   = db.Column(db.Integer, db.ForeignKey('trips.id'), nullable=False, unique=True)
    driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=False)
    amount    = db.Column(db.Float, nullable=False)
    paid      = db.Column(db.Float, default=0.0)
    status    = db.Column(db.String(20), default='pending')  # pending, partial, paid
    paid_date = db.Column(db.Date)
    notes     = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'trip_id': self.trip_id,
            'driver_id': self.driver_id,
            'driver_name': self.driver.name if self.driver else '',
            'vehicle_number': self.trip.vehicle_number if self.trip else '',
            'route': f"{self.trip.from_city} → {self.trip.to_city}" if self.trip else '',
            'date': self.trip.trip_date.isoformat() if self.trip and self.trip.trip_date else '',
            'amount': self.amount,
            'paid': self.paid,
            'remaining': self.amount - self.paid,
            'status': self.status,
            'paid_date': self.paid_date.isoformat() if self.paid_date else None,
            'notes': self.notes,
        }
