import os
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from sqlalchemy import create_engine

# ── STREAMLIT PAGE CONFIG ───────────────────────────────────────────────────
st.set_page_config(
    page_title="Kohistan Kashmir Goods Transport Co. - Live Analytics",
    page_icon="🚛",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ── DATABASE CONNECTION ──────────────────────────────────────────────────────
@st.cache_resource
def get_db_engine():
    db_url = os.environ.get('DATABASE_URL', '').strip()
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    
    if not db_url:
        # Resolve path to local SQLite database in backend folder
        base_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(base_dir, 'backend', 'transport.db')
        db_url = f"sqlite:///{db_path}"
    
    return create_engine(db_url)

from sqlalchemy import text

try:
    engine = get_db_engine()
    # Initialize SQLite database tables if they do not exist
    if "sqlite" in str(engine.url):
        with engine.begin() as conn:
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
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS routes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    city_name VARCHAR(100) NOT NULL,
                    city_name_ur VARCHAR(150),
                    group_name VARCHAR(100)
                )
            """))
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
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(driver_id) REFERENCES drivers(id),
                    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
                )
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS commissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    trip_id INTEGER NOT NULL UNIQUE,
                    driver_id INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    paid REAL DEFAULT 0.0,
                    status VARCHAR(20) DEFAULT 'pending',
                    paid_date DATE,
                    notes TEXT,
                    FOREIGN KEY(trip_id) REFERENCES trips(id),
                    FOREIGN KEY(driver_id) REFERENCES drivers(id)
                )
            """))
except Exception as e:
    st.error(f"Failed to connect or initialize database: {e}")
    st.stop()

# ── LOAD DATA HELPER ────────────────────────────────────────────────────────
def load_data(query):
    try:
        with engine.connect() as conn:
            return pd.read_sql(text(query), conn)
    except Exception as e:
        st.warning(f"Error reading query: {e}")
        return pd.DataFrame()

# Load main tables
trips_df = load_data("SELECT * FROM trips")
drivers_df = load_data("SELECT * FROM drivers")
vehicles_df = load_data("SELECT * FROM vehicles")
routes_df = load_data("SELECT * FROM routes")
commissions_df = load_data("SELECT * FROM commissions")

# Clean & parse dates
if not trips_df.empty and 'trip_date' in trips_df.columns:
    trips_df['trip_date'] = pd.to_datetime(trips_df['trip_date']).dt.date
else:
    # Create empty mock-compatible df if no trips found
    trips_df = pd.DataFrame(columns=[
        'id', 'driver_name', 'driver_phone', 'vehicle_number', 
        'from_city', 'to_city', 'trip_date', 'freight_amount', 
        'commission_amount', 'status', 'notes'
    ])

# ── CUSTOM BRANDING STYLE (CSS) ──────────────────────────────────────────────
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
        font-size: 1rem;
        margin-bottom: 1.5rem;
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

# ── HEADER ──────────────────────────────────────────────────────────────────
col_logo, col_text = st.columns([1, 6])
with col_logo:
    st.write("")
    st.markdown("<h1 style='font-size:4.5rem; margin:0; text-align:center;'>🚛</h1>", unsafe_allow_html=True)
with col_text:
    st.markdown('<div class="main-title">Kohistan Kashmir Goods Transport Company</div>', unsafe_allow_html=True)
    st.markdown('<div class="urdu-title">کوہستان کشمیر گڈز ٹرانسپورٹ کمپنی</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-title">Live Interactive Analytics Dashboard & Customer Network Directory</div>', unsafe_allow_html=True)

st.markdown("---")

# ── SIDEBAR FILTERS ─────────────────────────────────────────────────────────
st.sidebar.markdown("### 🎛️ Dashboard Filters")

# Date Filter
if not trips_df.empty:
    min_date = trips_df['trip_date'].min()
    max_date = trips_df['trip_date'].max()
    if min_date == max_date:
        min_date = min_date - pd.Timedelta(days=7)
    
    start_date, end_date = st.sidebar.date_input(
        "Select Date Range",
        [min_date, max_date]
    )
else:
    start_date = st.sidebar.date_input("Start Date", pd.to_datetime('today').date() - pd.Timedelta(days=30))
    end_date = st.sidebar.date_input("End Date", pd.to_datetime('today').date())

# City/Route Filter
all_cities = sorted(list(set(
    list(trips_df['from_city'].dropna().unique()) + 
    list(trips_df['to_city'].dropna().unique()) +
    ['Faisalabad']
)))
selected_city = st.sidebar.selectbox("Filter by City Connection", ["All"] + all_cities)

# Filter dataframe based on inputs
filtered_df = trips_df.copy()
if not filtered_df.empty:
    filtered_df = filtered_df[(filtered_df['trip_date'] >= start_date) & (filtered_df['trip_date'] <= end_date)]
    if selected_city != "All":
        filtered_df = filtered_df[(filtered_df['from_city'] == selected_city) | (filtered_df['to_city'] == selected_city)]

# ── TABBED NAVIGATION ────────────────────────────────────────────────────────
tab1, tab2, tab3 = st.tabs(["📊 Live Analytics", "📋 Daily Trips Log", "📦 Delivery Network & Directory"])

# ── TAB 1: LIVE ANALYTICS ───────────────────────────────────────────────────
with tab1:
    # ── KPI METRICS ──
    col1, col2, col3, col4 = st.columns(4)
    
    total_trips = len(filtered_df)
    total_freight = filtered_df['freight_amount'].sum() if not filtered_df.empty else 0.0
    total_commission = filtered_df['commission_amount'].sum() if not filtered_df.empty else 0.0
    avg_freight = total_freight / total_trips if total_trips > 0 else 0.0
    
    with col1:
        st.markdown(f"""
            <div class="metric-card">
                <div class="metric-val">{total_trips}</div>
                <div class="metric-label">Total Dispatch Trips</div>
            </div>
        """, unsafe_allow_html=True)
    with col2:
        st.markdown(f"""
            <div class="metric-card" style="border-top-color: #16A34A;">
                <div class="metric-val-green">Rs {total_freight:,.2f}</div>
                <div class="metric-label">Total Revenue (Freight)</div>
            </div>
        """, unsafe_allow_html=True)
    with col3:
        st.markdown(f"""
            <div class="metric-card" style="border-top-color: #DC2626;">
                <div class="metric-val-red">Rs {total_commission:,.2f}</div>
                <div class="metric-label">Total Commission Earned</div>
            </div>
        """, unsafe_allow_html=True)
    with col4:
        st.markdown(f"""
            <div class="metric-card">
                <div class="metric-val">Rs {avg_freight:,.2f}</div>
                <div class="metric-label">Average Freight / Trip</div>
            </div>
        """, unsafe_allow_html=True)
        
    st.markdown("<br>", unsafe_allow_html=True)
    
    # ── VISUALIZATIONS ──
    col_chart1, col_chart2 = st.columns(2)
    
    with col_chart1:
        st.markdown("### 📈 Revenue & Commission Trends")
        if not filtered_df.empty:
            trend_df = filtered_df.groupby('trip_date')[['freight_amount', 'commission_amount']].sum().reset_index()
            trend_df = trend_df.sort_values('trip_date')
            
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=trend_df['trip_date'], y=trend_df['freight_amount'],
                mode='lines+markers', name='Revenue (Freight)',
                line=dict(color='#0F4C81', width=3)
            ))
            fig.add_trace(go.Scatter(
                x=trend_df['trip_date'], y=trend_df['commission_amount'],
                mode='lines+markers', name='Commission',
                line=dict(color='#DC2626', width=3)
            ))
            fig.update_layout(
                margin=dict(l=20, r=20, t=20, b=20),
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)',
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No data available for the selected filters.")
            
    with col_chart2:
        st.markdown("### 🗺️ Top Active Route Destinations")
        if not filtered_df.empty:
            route_counts = filtered_df.groupby(['from_city', 'to_city']).size().reset_index(name='trips')
            route_counts['route'] = route_counts['from_city'] + " ➔ " + route_counts['to_city']
            route_counts = route_counts.sort_values('trips', ascending=True).tail(10)
            
            fig = px.bar(
                route_counts, x='trips', y='route', orientation='h',
                color_discrete_sequence=['#16A34A']
            )
            fig.update_layout(
                margin=dict(l=20, r=20, t=20, b=20),
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)'
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No data available for the selected filters.")

    st.markdown("<br>", unsafe_allow_html=True)
    
    col_chart3, col_chart4 = st.columns([1, 2])
    with col_chart3:
        st.markdown("### 🚦 Dispatch Status")
        if not filtered_df.empty:
            status_counts = filtered_df['status'].value_counts().reset_index()
            status_counts.columns = ['status', 'count']
            
            fig = px.pie(
                status_counts, values='count', names='status',
                color='status',
                color_map={
                    'completed': '#16A34A',
                    'on_trip': '#f59e0b',
                    'available': '#0F4C81',
                    'cancelled': '#DC2626'
                }
            )
            fig.update_layout(
                margin=dict(l=20, r=20, t=20, b=20),
                paper_bgcolor='rgba(0,0,0,0)'
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No status data available.")
            
    with col_chart4:
        st.markdown("### 👤 Top Performing Drivers (by Trip Count)")
        if not filtered_df.empty:
            driver_trips = filtered_df['driver_name'].value_counts().reset_index().head(10)
            driver_trips.columns = ['Driver Name', 'Trips Completed']
            
            fig = px.bar(
                driver_trips, x='Driver Name', y='Trips Completed',
                color_discrete_sequence=['#0F4C81']
            )
            fig.update_layout(
                margin=dict(l=20, r=20, t=20, b=20),
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(0,0,0,0)'
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No driver statistics available.")

# ── TAB 2: DAILY TRIPS LOG ──────────────────────────────────────────────────
with tab2:
    st.markdown("### 🚚 Daily Dispatch Records")
    st.markdown("Filter and search through all active trip entries made by dispatchers.")
    
    # Text search on filtered trips
    search_q = st.text_input("🔍 Search by Driver Name or Vehicle Plate Number", "")
    
    trips_display_df = filtered_df.copy()
    if search_q and not trips_display_df.empty:
        trips_display_df = trips_display_df[
            trips_display_df['driver_name'].str.contains(search_q, case=False, na=False) |
            trips_display_df['vehicle_number'].str.contains(search_q, case=False, na=False)
        ]
        
    if not trips_display_df.empty:
        # Reorder and rename columns for display
        cols_to_show = ['trip_date', 'driver_name', 'driver_phone', 'vehicle_number', 'from_city', 'to_city', 'freight_amount', 'commission_amount', 'status', 'notes']
        trips_display_df = trips_display_df[cols_to_show]
        trips_display_df.columns = ['Date', 'Driver Name', 'Phone Number', 'Vehicle Plate', 'From', 'To', 'Freight (Rs)', 'Commission (Rs)', 'Status', 'Notes']
        
        st.dataframe(trips_display_df, use_container_width=True, hide_index=True)
        
        # Download buttons
        csv_data = trips_display_df.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="📥 Export Trip Log to CSV",
            data=csv_data,
            file_name=f"KKGT_Trip_Log_{start_date}_to_{end_date}.csv",
            mime="text/csv"
        )
    else:
        st.info("No trip records match the selected date range or search query.")

# ── TAB 3: NETWORK & DIRECTORY ──────────────────────────────────────────────
with tab3:
    st.markdown("### 📦 Delivery Towns & Customer Directory")
    st.markdown("Searchable database of regular delivery locations and associated company traders/dealers.")
    
    # Town Directory Data (matches backend list exactly)
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
    
    col_dir1, col_dir2 = st.columns([1, 1])
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
