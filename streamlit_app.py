import os
import hashlib
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from sqlalchemy import create_engine, text
from datetime import datetime, date

# ── STREAMLIT PAGE CONFIG ───────────────────────────────────────────────────
st.set_page_config(
    page_title="Kohistan Kashmir Goods Transport Co. - Management System",
    page_icon="🚛",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ── DATABASE CONNECTION & INITIALIZATION ─────────────────────────────────────
@st.cache_resource
def get_db_engine():
    db_url = os.environ.get('DATABASE_URL', '').strip()
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    
    if not db_url:
        # Local SQLite database in backend folder
        base_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(base_dir, 'backend', 'transport.db')
        db_url = f"sqlite:///{db_path}"
        
    return create_engine(db_url)

try:
    engine = get_db_engine()
except Exception as e:
    st.error(f"Database Connection Failed: {e}")
    st.stop()

def hash_password(pwd):
    return hashlib.sha256(pwd.encode()).hexdigest()

# Initialize tables & seed data
def init_database():
    with engine.begin() as conn:
        # Users Table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(256) NOT NULL,
                role VARCHAR(20) DEFAULT 'dispatcher',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Drivers Table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS drivers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                name_ur VARCHAR(150),
                phone VARCHAR(20),
                cnic VARCHAR(20),
                license_no VARCHAR(50),
                status VARCHAR(20) DEFAULT 'available',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Vehicles Table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS vehicles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                number_plate VARCHAR(20) NOT NULL UNIQUE,
                model VARCHAR(100),
                capacity VARCHAR(50),
                owner_name VARCHAR(100),
                condition VARCHAR(20) DEFAULT 'good',
                notes TEXT
            )
        """))
        
        # Routes Table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS routes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                city_name VARCHAR(100) NOT NULL,
                city_name_ur VARCHAR(150),
                group_name VARCHAR(100)
            )
        """))
        
        # Trips Table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS trips (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                driver_id INTEGER NOT NULL,
                vehicle_id INTEGER,
                driver_name VARCHAR(100),
                driver_phone VARCHAR(20),
                vehicle_number VARCHAR(20),
                from_city VARCHAR(100) NOT NULL,
                to_city VARCHAR(100) NOT NULL,
                trip_date DATE,
                freight_amount REAL DEFAULT 0.0,
                commission_amount REAL DEFAULT 0.0,
                status VARCHAR(20) DEFAULT 'available',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Commissions Table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS commissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trip_id INTEGER NOT NULL UNIQUE,
                driver_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                paid REAL DEFAULT 0.0,
                status VARCHAR(20) DEFAULT 'pending',
                paid_date DATE,
                notes TEXT
            )
        """))
        
        # Seed Default Admin/Dispatcher if empty
        res = conn.execute(text("SELECT COUNT(*) FROM users")).fetchone()
        if res and res[0] == 0:
            conn.execute(text("""
                INSERT INTO users (name, username, password, role) 
                VALUES ('Mian Muhammad Shafique', 'admin', :p1, 'admin')
            """), {"p1": hash_password("admin123")})
            conn.execute(text("""
                INSERT INTO users (name, username, password, role) 
                VALUES ('Mian Farhan Shafique', 'dispatcher', :p2, 'dispatcher')
            """), {"p2": hash_password("dispatch1")})

init_database()

# ── GLOBAL CSS FOR ENTERPRISE STYLING ────────────────────────────────────────
st.markdown("""
    <style>
    .main-title {
        color: #0F4C81;
        font-size: 2.2rem !important;
        font-weight: 800;
        margin-bottom: 0.1rem;
    }
    .urdu-title {
        font-family: 'Noto Nastaliq Urdu', serif;
        color: #DC2626;
        font-size: 1.8rem;
        direction: rtl;
        text-align: left;
        margin-top: -0.5rem;
        margin-bottom: 0.5rem;
    }
    .sub-title {
        color: #64748b;
        font-size: 1.05rem;
        margin-bottom: 1.5rem;
    }
    .support-card {
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(15, 76, 129, 0.15);
        border-radius: 12px;
        padding: 1.5rem;
        backdrop-filter: blur(16px);
        box-shadow: 0 8px 32px 0 rgba(15, 76, 129, 0.08);
        margin-bottom: 1.5rem;
    }
    .support-title {
        color: #0F4C81;
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 0.2rem;
    }
    .support-urdu {
        color: #DC2626;
        font-size: 1.1rem;
        margin-bottom: 1rem;
        font-weight: 600;
    }
    .support-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        border-bottom: 1px dashed #e2e8f0;
        padding-bottom: 0.4rem;
    }
    .support-name {
        font-weight: 600;
        color: #334155;
    }
    .support-phone {
        font-weight: 700;
        color: #DC2626;
    }
    .metric-card {
        background: white;
        border-radius: 0.75rem;
        padding: 1.25rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        border-top: 4px solid #0F4C81;
        text-align: center;
    }
    .metric-val {
        font-size: 1.8rem;
        font-weight: 800;
        color: #0F4C81;
    }
    .metric-val-green {
        font-size: 1.8rem;
        font-weight: 800;
        color: #16A34A;
    }
    .metric-val-red {
        font-size: 1.8rem;
        font-weight: 800;
        color: #DC2626;
    }
    .metric-label {
        font-size: 0.85rem;
        color: #64748b;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.05em;
    }
    </style>
""", unsafe_allow_html=True)

# ── CONSTANT CITY LIST ───────────────────────────────────────────────────────
CITY_LIST = sorted([
    'Adda 217','Adda Sheikhan','Ahmed Pur Sial','18-Hazari',
    'Bhakkar T','Chakrallah','Chinji','Chowk Azam','Chund Bharwana',
    'Darya Khan','Dulewala','Fateh Pur','Garh Morr','Girote','Gojra',
    'Harnoli','Hyderabad Thal','Janiwala','Jaranwala','Jhang T',
    'Joharabad','Kala Bagh','Kaloor Kot','Karoor Lal Eson','Khushab T',
    'Kot Shahkir','Kundian','Lawa','Layyah','Mianwali T','Mongi Banglow',
    'Morr Khunda','Noshehra Soon','NP Thal','Pichnand','Piplan',
    'Pir Mahal','Pirkot','Quaid Abad','Saray Muhajir','Shah Jewna',
    'Shorkot','Shorkot Cantt.','Toba Tek Singh','Wan Bhachran','Wariam Wala',
    'Faisalabad'
])

# ── CUSTOM DATA READERS ──────────────────────────────────────────────────────
def run_query(query, params=None):
    with engine.connect() as conn:
        return pd.read_sql(text(query), conn, params=params)

def execute_cmd(query, params=None):
    with engine.begin() as conn:
        conn.execute(text(query), params or {})

# ── LOGIN SYSTEM ─────────────────────────────────────────────────────────────
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False
if 'user' not in st.session_state:
    st.session_state.user = None

if not st.session_state.authenticated:
    col_l1, col_l2, col_l3 = st.columns([1, 1.5, 1])
    with col_l2:
        st.markdown("<br><br>", unsafe_allow_html=True)
        st.markdown("""
            <div class="support-card" style="text-align: center; border-top: 5px solid #0F4C81;">
                <h2 style='color:#0F4C81; margin:0;'>Kohistan Kashmir Goods</h2>
                <h3 style='color:#DC2626; margin:0;'>Transport Management System</h3>
                <p style='color:#64748b;'>Please sign in to access dispatcher services</p>
            </div>
        """, unsafe_allow_html=True)
        
        with st.form("login_form"):
            username = st.text_input("Username / صارف نام")
            password = st.text_input("Password / پاس ورڈ", type="password")
            submitted = st.form_submit_button("Sign In / لاگ ان کریں", use_container_width=True)
            
            if submitted:
                # Check user details in database
                user_res = run_query(
                    "SELECT * FROM users WHERE username = :u LIMIT 1",
                    {"u": username}
                )
                if not user_res.empty:
                    hashed = hash_password(password)
                    if user_res.iloc[0]['password'] == hashed:
                        st.session_state.authenticated = True
                        st.session_state.user = {
                            "name": user_res.iloc[0]['name'],
                            "username": user_res.iloc[0]['username'],
                            "role": user_res.iloc[0]['role']
                        }
                        st.success("Login Successful! Redirecting...")
                        st.rerun()
                    else:
                        st.error("Incorrect Password.")
                else:
                    st.error("Username not found.")
        st.stop()

# ── AFTER SUCCESSFUL LOGIN ───────────────────────────────────────────────────

# ── HEADER ──────────────────────────────────────────────────────────────────
col_logo, col_text = st.columns([1, 6])
with col_logo:
    st.write("")
    st.markdown("<h1 style='font-size:4.5rem; margin:0; text-align:center;'>🚛</h1>", unsafe_allow_html=True)
with col_text:
    st.markdown('<div class="main-title">Kohistan Kashmir Goods Transport Company</div>', unsafe_allow_html=True)
    st.markdown('<div class="urdu-title">کوہستان کشمیر گڈز ٹرانسپورٹ کمپنی</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Live Dispatch Management & Analytical Control Panel</div>', unsafe_allow_html=True)

st.markdown("---")

# ── SIDEBAR NAVIGATION ───────────────────────────────────────────────────────
st.sidebar.markdown(f"### 👤 Welcome, {st.session_state.user['name']}")
st.sidebar.markdown(f"**Role:** `{st.session_state.user['role'].upper()}`")

if st.sidebar.button("Logout / لاگ آؤٹ", use_container_width=True):
    st.session_state.authenticated = False
    st.session_state.user = None
    st.rerun()

st.sidebar.markdown("---")
st.sidebar.markdown("### 🗺️ Navigation")
menu = st.sidebar.radio(
    "Select Screen",
    [
        "📊 Dashboard", 
        "📝 Daily Trip Entry", 
        "👤 Driver Directory", 
        "🚛 Vehicle Fleet", 
        "🗺️ Routes & Cities", 
        "💰 Commission Register", 
        "📦 Customer & Town Directory"
    ]
)

# Render Support Card on Sidebar bottom
st.sidebar.markdown("<br><br>", unsafe_allow_html=True)
st.sidebar.markdown("""
    <div class="support-card">
        <div class="support-title">Contact & Help Support</div>
        <div class="support-urdu">رابطہ اور مددگار گائیڈ</div>
        <div class="support-item">
            <span class="support-name">Haji Shafique (Owner)</span>
            <span class="support-phone">0300-6600980</span>
        </div>
        <div class="support-item">
            <span class="support-name">Farhan Shafique</span>
            <span class="support-phone">0300-7600980</span>
        </div>
        <div class="support-item">
            <span class="support-name">Office Landline</span>
            <span class="support-phone">041-2600980</span>
        </div>
    </div>
""", unsafe_allow_html=True)


# ═════════════════════════════════════════════════════════════════════════════
# 📊 DASHBOARD SCREEN
# ═════════════════════════════════════════════════════════════════════════════
if menu == "📊 Dashboard":
    st.subheader("Dashboard Overview")
    
    # Load basic stats
    total_vehicles = run_query("SELECT COUNT(*) as cnt FROM vehicles").iloc[0]['cnt']
    active_trips = run_query("SELECT COUNT(*) as cnt FROM trips WHERE status='on_trip'").iloc[0]['cnt']
    today = date.today().isoformat()
    today_trips = run_query("SELECT COUNT(*) as cnt FROM trips WHERE trip_date=:d", {"d": today}).iloc[0]['cnt']
    
    pending_comm_val = run_query("SELECT SUM(amount - paid) as sum FROM commissions WHERE status != 'paid'").iloc[0]['sum']
    pending_comm = float(pending_comm_val or 0.0)
    
    today_revenue_val = run_query("SELECT SUM(freight_amount) as sum FROM trips WHERE trip_date=:d", {"d": today}).iloc[0]['sum']
    today_revenue = float(today_revenue_val or 0.0)

    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.markdown(f'<div class="metric-card"><div class="metric-val">{total_vehicles}</div><div class="metric-label">Total Fleet</div></div>', unsafe_allow_html=True)
    with col2:
        st.markdown(f'<div class="metric-card"><div class="metric-val-green">{active_trips}</div><div class="metric-label">Active On-Trip</div></div>', unsafe_allow_html=True)
    with col3:
        st.markdown(f'<div class="metric-card"><div class="metric-val">{today_trips}</div><div class="metric-label">Today\'s Trips</div></div>', unsafe_allow_html=True)
    with col4:
        st.markdown(f'<div class="metric-card" style="border-top-color: #16A34A;"><div class="metric-val-green">Rs {today_revenue:,.0f}</div><div class="metric-label">Today\'s Revenue</div></div>', unsafe_allow_html=True)
    with col5:
        st.markdown(f'<div class="metric-card" style="border-top-color: #DC2626;"><div class="metric-val-red">Rs {pending_comm:,.0f}</div><div class="metric-label">Pending Commission</div></div>', unsafe_allow_html=True)

    st.markdown("<br><br>", unsafe_allow_html=True)
    
    # Visualizations
    col_chart1, col_chart2 = st.columns(2)
    
    trips_all = run_query("SELECT * FROM trips")
    with col_chart1:
        st.markdown("### 📈 Revenue vs Commission Trends")
        if not trips_all.empty:
            trips_all['trip_date'] = pd.to_datetime(trips_all['trip_date']).dt.date
            trend_df = trips_all.groupby('trip_date')[['freight_amount', 'commission_amount']].sum().reset_index()
            trend_df = trend_df.sort_values('trip_date')
            
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=trend_df['trip_date'], y=trend_df['freight_amount'], mode='lines+markers', name='Revenue', line=dict(color='#0F4C81', width=3)))
            fig.add_trace(go.Scatter(x=trend_df['trip_date'], y=trend_df['commission_amount'], mode='lines+markers', name='Commission', line=dict(color='#DC2626', width=3)))
            fig.update_layout(margin=dict(l=20, r=20, t=20, b=20), paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No analytics data available. Complete daily trip logs first.")
            
    with col_chart2:
        st.markdown("### 🗺️ Top Destinations (Freight Value)")
        if not trips_all.empty:
            dest_df = trips_all.groupby('to_city')['freight_amount'].sum().reset_index()
            dest_df = dest_df.sort_values('freight_amount', ascending=True).tail(8)
            fig = px.bar(dest_df, x='freight_amount', y='to_city', orientation='h', color_discrete_sequence=['#16A34A'])
            fig.update_layout(margin=dict(l=20, r=20, t=20, b=20), paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No destination stats available.")


# ═════════════════════════════════════════════════════════════════════════════
# 📝 DAILY TRIP ENTRY
# ═════════════════════════════════════════════════════════════════════════════
elif menu == "📝 Daily Trip Entry":
    st.subheader("Daily Dispatch Entry / روزانہ کا سفرناموں کا اندراج")
    
    # Forms & Select options
    drivers_list = run_query("SELECT id, name, phone FROM drivers WHERE status='available'").to_dict('records')
    vehicles_list = run_query("SELECT id, number_plate FROM vehicles").to_dict('records')
    routes_db = run_query("SELECT city_name FROM routes")['city_name'].tolist()
    
    # Merge hardcoded 46 cities with any cities from database
    cities_source = sorted(list(set(CITY_LIST + routes_db)))
    
    with st.form("new_trip_form", clear_on_submit=True):
        col_f1, col_f2 = st.columns(2)
        with col_f1:
            driver_choice = st.selectbox(
                "Driver / ڈرائیور کا انتخاب",
                options=["-- Free Text / Manual Entry --"] + [f"{d['name']} ({d['phone']})" for d in drivers_list]
            )
            manual_driver_name = st.text_input("Driver Name (Manual / Free-text) / ڈرائیور کا نام")
            manual_driver_phone = st.text_input("Driver Phone (Manual) / ڈرائیور کا فون")
            
            vehicle_choice = st.selectbox(
                "Vehicle / گاڑی کا انتخاب",
                options=["-- Free Text / Manual Entry --"] + [v['number_plate'] for v in vehicles_list]
            )
            manual_vehicle_plate = st.text_input("Vehicle Number (Manual) / گاڑی کا نمبر")
            
        with col_f2:
            from_city = st.selectbox("From City / کہاں سے", options=cities_source, index=cities_source.index("Faisalabad") if "Faisalabad" in cities_source else 0)
            to_city = st.selectbox("To City / کہاں تک", options=cities_source)
            trip_date = st.date_input("Trip Date / روانگی کی تاریخ", date.today())
            freight = st.number_input("Freight Amount / مال برداری کا کرایہ", min_value=0.0, step=1000.0)
            commission = st.number_input("Commission / کمیشن رقم", min_value=0.0, step=100.0)
            notes = st.text_area("Notes / دیگر معلومات")
            
        submitted = st.form_submit_button("Save Trip & Generate Commission / ریکارڈ محفوظ کریں", use_container_width=True)
        
        if submitted:
            # Resolve Driver
            dr_id = 0
            if driver_choice != "-- Free Text / Manual Entry --":
                dr_name = driver_choice.split(" (")[0]
                dr_phone = driver_choice.split(" (")[1].replace(")", "")
                # get id
                dr_id_q = run_query("SELECT id FROM drivers WHERE name=:n LIMIT 1", {"n": dr_name})
                if not dr_id_q.empty:
                    dr_id = int(dr_id_q.iloc[0]['id'])
            else:
                dr_name = manual_driver_name
                dr_phone = manual_driver_phone
                # create adhoc driver
                if dr_name:
                    execute_cmd("INSERT INTO drivers (name, phone, status) VALUES (:n, :p, 'on_trip')", {"n": dr_name, "p": dr_phone})
                    dr_id_q = run_query("SELECT id FROM drivers WHERE name=:n ORDER BY id DESC LIMIT 1", {"n": dr_name})
                    dr_id = int(dr_id_q.iloc[0]['id']) if not dr_id_q.empty else 0
            
            # Resolve Vehicle
            v_id = 0
            if vehicle_choice != "-- Free Text / Manual Entry --":
                v_num = vehicle_choice
                v_id_q = run_query("SELECT id FROM vehicles WHERE number_plate=:p LIMIT 1", {"p": v_num})
                v_id = int(v_id_q.iloc[0]['id']) if not v_id_q.empty else 0
            else:
                v_num = manual_vehicle_plate
                
            if not dr_name or not from_city or not to_city:
                st.error("Driver Name, From City, and To City are required.")
            else:
                # Add Trip
                execute_cmd("""
                    INSERT INTO trips (driver_id, vehicle_id, driver_name, driver_phone, vehicle_number, from_city, to_city, trip_date, freight_amount, commission_amount, status, notes)
                    VALUES (:dr_id, :v_id, :dr_name, :dr_phone, :v_num, :from_c, :to_c, :t_date, :freight, :comm, 'on_trip', :notes)
                """, {
                    "dr_id": dr_id, "v_id": v_id, "dr_name": dr_name, "dr_phone": dr_phone,
                    "v_num": v_num, "from_c": from_city, "to_c": to_city, "t_date": trip_date.isoformat(),
                    "freight": freight, "comm": commission, "notes": notes
                })
                
                # Fetch last trip id
                last_trip = run_query("SELECT id FROM trips ORDER BY id DESC LIMIT 1").iloc[0]['id']
                
                # Add Commission
                execute_cmd("""
                    INSERT INTO commissions (trip_id, driver_id, amount, paid, status)
                    VALUES (:t_id, :dr_id, :amount, 0.0, 'pending')
                """, {"t_id": int(last_trip), "dr_id": dr_id, "amount": commission})
                
                # Update Driver status to on_trip
                if dr_id > 0:
                    execute_cmd("UPDATE drivers SET status='on_trip' WHERE id=:id", {"id": dr_id})
                    
                st.success("Trip dispatched successfully! Commission register updated.")
                st.rerun()

    # List Today's Trips
    st.markdown("---")
    st.markdown("### Today's Dispatch Records / آج کی روانگی کا ریکارڈ")
    today_date = date.today().isoformat()
    today_df = run_query("SELECT * FROM trips WHERE trip_date=:d ORDER BY id DESC", {"d": today_date})
    if not today_df.empty:
        st.dataframe(today_df[['driver_name', 'vehicle_number', 'from_city', 'to_city', 'freight_amount', 'commission_amount', 'status']], use_container_width=True, hide_index=True)
    else:
        st.info("No dispatches entered today yet.")


# ═════════════════════════════════════════════════════════════════════════════
# 👤 DRIVER DIRECTORY SCREEN
# ═════════════════════════════════════════════════════════════════════════════
elif menu == "👤 Driver Directory":
    st.subheader("Driver Fleet Directory / ڈرائیورز کا ریکارڈ")
    
    col_d1, col_d2 = st.columns([1.2, 2.5])
    
    with col_d1:
        st.markdown("#### Add New Driver / نیا ڈرائیور شامل کریں")
        with st.form("add_driver_form", clear_on_submit=True):
            d_name = st.text_input("Name (English) / ڈرائیور کا نام انگریزی میں")
            d_name_ur = st.text_input("Name (Urdu) / ڈرائیور کا نام اردو میں")
            d_phone = st.text_input("Phone Number / فون نمبر")
            d_cnic = st.text_input("CNIC Number / شناختی کارڈ نمبر")
            d_license = st.text_input("Driving License / ڈرائیونگ لائسنس نمبر")
            d_notes = st.text_area("Notes / اضافی معلومات")
            
            d_submit = st.form_submit_button("Register Driver", use_container_width=True)
            if d_submit:
                if not d_name:
                    st.error("Driver Name is required!")
                else:
                    execute_cmd("""
                        INSERT INTO drivers (name, name_ur, phone, cnic, license_no, status, notes)
                        VALUES (:n, :nu, :p, :c, :l, 'available', :notes)
                    """, {"n": d_name, "nu": d_name_ur, "p": d_phone, "c": d_cnic, "l": d_license, "notes": d_notes})
                    st.success("Driver added successfully!")
                    st.rerun()

    with col_d2:
        st.markdown("#### Active Drivers List")
        search_d = st.text_input("🔍 Search Driver by Name/Phone", "")
        
        if search_d:
            drivers_df = run_query("""
                SELECT id, name, name_ur, phone, cnic, license_no, status 
                FROM drivers WHERE name LIKE :s OR phone LIKE :s ORDER BY id DESC
            """, {"s": f"%{search_d}%"})
        else:
            drivers_df = run_query("SELECT id, name, name_ur, phone, cnic, license_no, status FROM drivers ORDER BY id DESC")
            
        if not drivers_df.empty:
            st.dataframe(drivers_df, use_container_width=True, hide_index=True)
        else:
            st.info("No registered drivers found.")


# ═════════════════════════════════════════════════════════════════════════════
# 🚛 VEHICLE FLEET SCREEN
# ═════════════════════════════════════════════════════════════════════════════
elif menu == "🚛 Vehicle Fleet":
    st.subheader("Vehicle Fleet Fleet / گاڑیوں کا ریکارڈ")
    
    col_v1, col_v2 = st.columns([1.2, 2.5])
    
    with col_v1:
        st.markdown("#### Add New Vehicle / نئی گاڑی شامل کریں")
        with st.form("add_vehicle_form", clear_on_submit=True):
            v_plate = st.text_input("Plate Number / گاڑی کا نمبر (e.g. FDY-7890)")
            v_model = st.text_input("Vehicle Model / گاڑی کی قسم / ماڈل")
            v_capacity = st.text_input("Weight Capacity / مال برداری کی حد (tons)")
            v_owner = st.text_input("Owner Name / مالک کا نام")
            v_cond = st.selectbox("Condition / گاڑی کی حالت", ["good", "average", "poor"])
            v_notes = st.text_area("Notes")
            
            v_submit = st.form_submit_button("Register Vehicle", use_container_width=True)
            if v_submit:
                if not v_plate:
                    st.error("Plate Number is required!")
                else:
                    execute_cmd("""
                        INSERT INTO vehicles (number_plate, model, capacity, owner_name, condition, notes)
                        VALUES (:p, :m, :c, :o, :cond, :n)
                    """, {"p": v_plate.upper(), "m": v_model, "c": v_capacity, "o": v_owner, "cond": v_cond, "n": v_notes})
                    st.success("Vehicle registered successfully!")
                    st.rerun()

    with col_v2:
        st.markdown("#### Registered Fleet List")
        search_v = st.text_input("🔍 Search Vehicle by Plate No.", "")
        
        if search_v:
            fleet_df = run_query("""
                SELECT id, number_plate, model, capacity, owner_name, condition 
                FROM vehicles WHERE number_plate LIKE :s ORDER BY id DESC
            """, {"s": f"%{search_v}%"})
        else:
            fleet_df = run_query("SELECT id, number_plate, model, capacity, owner_name, condition FROM vehicles ORDER BY id DESC")
            
        if not fleet_df.empty:
            st.dataframe(fleet_df, use_container_width=True, hide_index=True)
            
            # View history section
            st.markdown("---")
            st.markdown("#### ⏳ View Trip History by Vehicle")
            selected_history_v = st.selectbox("Select Plate Number", fleet_df['number_plate'].tolist())
            if selected_history_v:
                history_df = run_query("""
                    SELECT trip_date, driver_name, from_city, to_city, freight_amount, status 
                    FROM trips WHERE vehicle_number = :v ORDER BY trip_date DESC
                """, {"v": selected_history_v})
                if not history_df.empty:
                    st.dataframe(history_df, use_container_width=True, hide_index=True)
                else:
                    st.info(f"No trip history found for vehicle: {selected_history_v}")
        else:
            st.info("No vehicles registered in fleet yet.")


# ═════════════════════════════════════════════════════════════════════════════
# 🗺️ ROUTES & CITIES
# ═════════════════════════════════════════════════════════════════════════════
elif menu == "🗺️ Routes & Cities":
    st.subheader("Manage Transit Routes & Cities / روٹس اور شہروں کا انتظام")
    
    col_r1, col_r2 = st.columns([1.2, 2.5])
    
    with col_r1:
        st.markdown("#### Add New City Route")
        with st.form("add_route_form", clear_on_submit=True):
            r_name = st.text_input("City Name (English)")
            r_name_ur = st.text_input("City Name (Urdu)")
            r_group = st.text_input("Route Region / Group (e.g. Thal, Soon Valley)")
            
            r_submit = st.form_submit_button("Add Route", use_container_width=True)
            if r_submit:
                if not r_name:
                    st.error("City name is required.")
                else:
                    execute_cmd("""
                        INSERT INTO routes (city_name, city_name_ur, group_name)
                        VALUES (:n, :nu, :g)
                    """, {"n": r_name, "nu": r_name_ur, "g": r_group})
                    st.success("New route city added!")
                    st.rerun()

    with col_r2:
        st.markdown("#### Active Route Network Cities")
        routes_df = run_query("SELECT id, city_name, city_name_ur, group_name FROM routes ORDER BY city_name ASC")
        if not routes_df.empty:
            st.dataframe(routes_df, use_container_width=True, hide_index=True)
        else:
            st.info("No customs cities added. System is using the default 46 cities list.")


# ═════════════════════════════════════════════════════════════════════════════
# 💰 COMMISSION REGISTER SCREEN
# ═════════════════════════════════════════════════════════════════════════════
elif menu == "💰 Commission Register":
    st.subheader("Driver Commissions Register / کمیشن لیجر کا اندراج")
    
    # Filtering commissions
    status_filter = st.selectbox("Filter Status", ["All", "pending", "partial", "paid"])
    
    if status_filter != "All":
        comm_df = run_query("""
            SELECT c.id, d.name as driver_name, c.amount, c.paid, c.status, c.paid_date, c.notes
            FROM commissions c
            LEFT JOIN drivers d ON c.driver_id = d.id
            WHERE c.status = :s ORDER BY c.id DESC
        """, {"s": status_filter})
    else:
        comm_df = run_query("""
            SELECT c.id, d.name as driver_name, c.amount, c.paid, c.status, c.paid_date, c.notes
            FROM commissions c
            LEFT JOIN drivers d ON c.driver_id = d.id
            ORDER BY c.id DESC
        """)
        
    if not comm_df.empty:
        comm_df['Remaining (Rs)'] = comm_df['amount'] - comm_df['paid']
        st.dataframe(comm_df, use_container_width=True, hide_index=True)
        
        # Payment Form Panel
        st.markdown("---")
        st.markdown("#### 💳 Update Driver Commission Payment / ادائیگی کا اندراج")
        
        with st.form("pay_commission_form"):
            c_select = st.selectbox("Select Ledger ID", comm_df['id'].tolist())
            c_paid = st.number_input("Paid Amount (Rs)", min_value=0.0, step=500.0)
            c_notes = st.text_area("Payment Notes / رسید نمبر")
            
            p_submit = st.form_submit_button("Process Payment", use_container_width=True)
            if p_submit:
                # get original amount
                org_q = run_query("SELECT amount FROM commissions WHERE id=:id", {"id": int(c_select)})
                if not org_q.empty:
                    org_amt = float(org_q.iloc[0]['amount'])
                    
                    new_status = 'pending'
                    if c_paid >= org_amt:
                        new_status = 'paid'
                        p_date = date.today().isoformat()
                    elif c_paid > 0:
                        new_status = 'partial'
                        p_date = None
                    else:
                        new_status = 'pending'
                        p_date = None
                        
                    execute_cmd("""
                        UPDATE commissions 
                        SET paid=:paid, status=:stat, paid_date=:p_date, notes=:notes
                        WHERE id=:id
                    """, {"paid": c_paid, "stat": new_status, "p_date": p_date, "notes": c_notes, "id": int(c_select)})
                    
                    # Update driver status to available if fully paid commission
                    if new_status == 'paid':
                        # Find driver id
                        dr_q = run_query("SELECT driver_id FROM commissions WHERE id=:id", {"id": int(c_select)})
                        if not dr_q.empty:
                            dr_id = int(dr_q.iloc[0]['driver_id'])
                            execute_cmd("UPDATE drivers SET status='available' WHERE id=:id", {"id": dr_id})
                            
                    st.success("Commission ledger payment updated successfully!")
                    st.rerun()
    else:
        st.info("No commission entries match the selected status.")


# ═════════════════════════════════════════════════════════════════════════════
# 📦 CUSTOMER & TOWN DIRECTORY SCREEN
# ═════════════════════════════════════════════════════════════════════════════
elif menu == "📦 Customer & Town Directory":
    st.subheader("Delivery Towns & Customers / ڈلیوری اسٹیشنز اور تاجروں کا ریکارڈ")
    st.markdown("Searchable and exportable database of regular delivery locations and associated company traders.")
    
    DIRECTORY_DATA = [
        ["Adda 217", "Sholab & Brothers"], ["Adda Sheikhan", "Javaid Traders"],
        ["Ahmed Pur Sial", "Mohsin Traders"], ["Ahmed Pur Sial", "Attiq Trader"],
        ["Ahmed Pur Sial", "Ahmed Traders"], ["18-Hazari", "Ch M Farooq & Sons"],
        ["Bhakkar T", "Al-Riaz Traders"], ["Bhakkar T", "Jamshaid Traders"],
        ["Bhakkar T", "Imran Broker"], ["Bhakkar T", "Madni Traders"],
        ["Bhakkar T", "Wajid Traders"], ["Bhakkar T", "Jamshed & Brothers"],
        ["Chakrallah", "Saand Karyana Store"], ["Chinji", "Malik Nouman And Company"],
        ["Chowk Azam", "Aftab And Co"], ["Chund Bharwana", "Hafiz Traders"],
        ["Darya Khan", "Riaz Ahmad And Sons"], ["Darya Khan", "Riaz Ahmad"],
        ["Dulewala", "Saad Trader"], ["Fateh Pur", "Ghulam Muhammad"],
        ["Fateh Pur", "Insaf Traders"], ["Garh Morr", "Shafiq Traders"],
        ["Girote", "Naveed Traders"], ["Gojra", "Rana Traders"],
        ["Gojra", "M. Hassan Traders"], ["Gojra", "Seher Traders"],
        ["Gojra", "M Abu Baker"], ["Gojra", "Sheikh Traders"],
        ["Harnoli", "Javaid Karyana Store"], ["Hyderabad Thal", "Abbass Traders"],
        ["Janiwala", "Madni Traders"], ["Jaranwala", "Arshad & Co."],
        ["Jhang T", "Muzammal Traders"], ["Jhang T", "Sufyan Younas"],
        ["Jhang T", "Adnan Enterprises"], ["Jhang T", "Malik Abdul Sattar Traders"],
        ["Jhang T", "M Ashraf"], ["Jhang T", "Aftab Ahmed"],
        ["Jhang T", "Sultan Sakandar"], ["Jhang T", "M Asif"],
        ["Jhang T", "Affan Traders"], ["Jhang T", "M Usman"],
        ["Jhang T", "Qaisar Traders"], ["Joharabad", "Awan Traders"],
        ["Joharabad", "Kh. Muddasar & Co"], ["Joharabad", "Samar Traders"],
        ["Kala Bagh", "Hafiz-M-Telah Hashmi"], ["Kaloor Kot", "Millat Traders"],
        ["Kaloor Kot", "Rao Traders"], ["Karoor Lal Eson", "Azher Traders"],
        ["Khushab T", "Abdul Rab Farooq"], ["Khushab T", "Shahzad Traders"],
        ["Khushab T", "Mubeen Traders"], ["Kot Shahkir", "Minhaj Traders"],
        ["Kundian", "Syed Traders"], ["Lawa", "Sher Muhammad Karyana"],
        ["Layyah", "Al Habib Traders"], ["Mianwali T", "Aziz-Ur-Rehman"],
        ["Mianwali T", "Sadaat Traders"], ["Mongi Banglow", "Al Hafiz Traders"],
        ["Morr Khunda", "Artash Traders"], ["Morr Khunda", "Sheikh Traders"],
        ["Morr Khunda", "Yaseen Karyana"], ["Morr Khunda", "Sher Ali Traders"],
        ["Morr Khunda", "M/S Sheikh Traders"], ["Noshehra Soon", "Dostia Traders"],
        ["NP Thal", "Khan Traders"], ["Pichnand", "Imran Trader"],
        ["Piplan", "Shoukat Traders"], ["Piplan", "New Commercial Traders"],
        ["Pir Mahal", "Ibrahim Traders"], ["Pirkot", "Sial Traders"],
        ["Quaid Abad", "Azmat Brothers"], ["Quaid Abad", "Talha Traders"],
        ["Saray Muhajir", "Etihad Traders"], ["Shah Jewna", "Sandrana Traders"],
        ["Shah Jewna", "Hassan Traders"], ["Shorkot", "Shaker Traders"],
        ["Shorkot Cantt.", "Abdullah Traders"], ["Toba Tek Singh", "Chaudhry Traders"],
        ["Toba Tek Singh", "Hamza And Co"], ["Toba Tek Singh", "Trade Technologies"],
        ["Toba Tek Singh", "Ch. Trader Distributor"], ["Wan Bhachran", "Ittehad Traders"],
        ["Wariam Wala", "Soban Sajjad Trader"]
    ]
    
    dir_df = pd.DataFrame(DIRECTORY_DATA, columns=["Town / Destination", "Customer Name"])
    
    col_dir1, col_dir2 = st.columns(2)
    with col_dir1:
        town_search = st.text_input("🔍 Filter by Town Name", "")
    with col_dir2:
        cust_search = st.text_input("🔍 Filter by Customer Name", "")
        
    filtered_dir_df = dir_df.copy()
    if town_search:
        filtered_dir_df = filtered_dir_df[filtered_dir_df['Town / Destination'].str.contains(town_search, case=False)]
    if cust_search:
        filtered_dir_df = filtered_dir_df[filtered_dir_df['Customer Name'].str.contains(cust_search, case=False)]
        
    # Stats row
    col_s1, col_s2, col_s3 = st.columns(3)
    with col_s1:
        st.metric("Total Network Towns", len(dir_df['Town / Destination'].unique()))
    with col_s2:
        st.metric("Total Connected Customers", len(dir_df))
    with col_s3:
        st.metric("Matching Directory Results", len(filtered_dir_df))
        
    st.dataframe(filtered_dir_df, use_container_width=True, hide_index=True)
    
    # Download button for Directory
    dir_csv = filtered_dir_df.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="📥 Download Directory to CSV",
        data=dir_csv,
        file_name="KKGT_Customer_Directory.csv",
        mime="text/csv"
    )

# ── FOOTER INFO ─────────────────────────────────────────────────────────────
st.markdown("---")
st.markdown(
    "<div style='text-align: center; color: #94a3b8; font-size: 0.8rem;'>"
    "© 2026 Kohistan Kashmir Goods Transport Company. Powered by Streamlit Community Cloud."
    "</div>",
    unsafe_allow_html=True
)
