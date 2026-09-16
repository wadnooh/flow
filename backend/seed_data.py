import sys
import os
from datetime import datetime, date, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.site import Site
from app.models.user import User
from app.models.attendance import AttendanceRecord, GeofenceDeparture
from app.models.electrical import ElectricalReading, FaultReport

def seed():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if data already exists
    if db.query(User).first():
        print("Database already contains data. Skipping seed.")
        db.close()
        return

    print("Seeding initial sites...")
    site1 = Site(
        name="محطة تحويل شمال الرياض - موقع رقم 1",
        code="SITE-NR-01",
        latitude=24.774265,
        longitude=46.738586,
        radius_meters=200.0,
        shift_start="07:00",
        shift_end="16:00",
        description="محطة تحويل ومحولات قدرة ومولدات طوارئ ديزل",
        is_active=True
    )
    site2 = Site(
        name="مشروع المجمع التجاري الشرقي - موقع رقم 2",
        code="SITE-EM-02",
        latitude=24.713552,
        longitude=46.675296,
        radius_meters=150.0,
        shift_start="07:30",
        shift_end="16:30",
        description="أعمال التمديدات الكهربائية ولوحات التوزيع الرئيسية MDB",
        is_active=True
    )
    site3 = Site(
        name="مشروع أبراج الوسط - موقع رقم 3",
        code="SITE-CT-03",
        latitude=24.687730,
        longitude=46.702410,
        radius_meters=250.0,
        shift_start="08:00",
        shift_end="17:00",
        description="شبكة الكابلات الأرضية ومحطة الطاقة الشمسية الهجينة",
        is_active=True
    )
    db.add_all([site1, site2, site3])
    db.commit()

    print("Seeding users and technicians...")
    admin = User(
        name="المهندس عبد الرحمن المدير",
        username="admin",
        hashed_password=get_password_hash("admin123"),
        role="admin",
        phone="0501234567",
        job_title="مدير عام المشاريع الكهربائية",
        is_active=True
    )
    supervisor = User(
        name="المهندس فهد المشرف",
        username="supervisor",
        hashed_password=get_password_hash("super123"),
        role="supervisor",
        phone="0559876543",
        job_title="مشرف كهرباء موقع",
        site_id=site1.id,
        is_active=True
    )
    tech1 = User(
        name="فني كهرباء / أحمد الشمري",
        username="tech1",
        hashed_password=get_password_hash("tech123"),
        role="electrician",
        phone="0531122334",
        job_title="فني شبكات ولوحات تحكم",
        site_id=site1.id,
        is_active=True
    )
    tech2 = User(
        name="فني كهرباء / خالد العتيبي",
        username="tech2",
        hashed_password=get_password_hash("tech123"),
        role="electrician",
        phone="0545566778",
        job_title="فني صيانة مولدات ومحولات",
        site_id=site1.id,
        is_active=True
    )
    tech3 = User(
        name="فني كهرباء / محمد القحطاني",
        username="tech3",
        hashed_password=get_password_hash("tech123"),
        role="electrician",
        phone="0567788990",
        job_title="فني قوى وتمديدات كهربائية",
        site_id=site2.id,
        is_active=True
    )
    db.add_all([admin, supervisor, tech1, tech2, tech3])
    db.commit()

    print("Seeding sample attendance records...")
    today = date.today()
    check_in_1 = datetime.combine(today, datetime.strptime("07:05", "%H:%M").time())
    
    # Tech 1 on shift
    att1 = AttendanceRecord(
        user_id=tech1.id,
        site_id=site1.id,
        date=today,
        check_in_time=check_in_1,
        check_in_lat=site1.latitude + 0.0001,
        check_in_lon=site1.longitude + 0.0001,
        check_in_distance=15.2,
        status="on_shift"
    )
    
    # Tech 2 on shift with a geofence departure
    check_in_2 = datetime.combine(today, datetime.strptime("07:12", "%H:%M").time())
    att2 = AttendanceRecord(
        user_id=tech2.id,
        site_id=site1.id,
        date=today,
        check_in_time=check_in_2,
        check_in_lat=site1.latitude,
        check_in_lon=site1.longitude,
        check_in_distance=5.0,
        status="on_shift"
    )
    db.add_all([att1, att2])
    db.commit()

    # Record a departure for Tech 2
    dep_time = datetime.combine(today, datetime.strptime("10:30", "%H:%M").time())
    ret_time = datetime.combine(today, datetime.strptime("11:15", "%H:%M").time())
    dep1 = GeofenceDeparture(
        attendance_id=att2.id,
        user_id=tech2.id,
        site_id=site1.id,
        departure_time=dep_time,
        departure_lat=site1.latitude + 0.005,
        departure_lon=site1.longitude + 0.005,
        departure_distance=620.0,
        return_time=ret_time,
        return_lat=site1.latitude,
        return_lon=site1.longitude,
        outside_minutes=45,
        is_ongoing=False,
        notes="إحضار قطع غيار من المستودع المركزي"
    )
    db.add(dep1)

    print("Seeding sample electrical readings and faults...")
    reading1 = ElectricalReading(
        site_id=site1.id,
        recorded_by_id=tech1.id,
        source_type="مولد ديزل",
        voltage_l1=398.0,
        voltage_l2=401.0,
        voltage_l3=399.0,
        current_l1=145.0,
        current_l2=142.0,
        current_l3=148.0,
        frequency=60.0,
        power_factor=0.94,
        generator_status="يعمل",
        fuel_level_percent=78.5,
        running_hours=1240.5,
        oil_pressure_bar=4.2,
        coolant_temp_c=82.0,
        notes="حالة التوليد مستقرة ولا توجد اهتزازات غير طبيعية"
    )

    fault1 = FaultReport(
        site_id=site1.id,
        reported_by_id=tech2.id,
        title="ارتفاع حرارة القاطع الرئيسي Q1 في لوحة MDB",
        description="تم رصد ارتفاع في درجة حرارة القاطع بمقدار 18 درجة مئوية أعلى من المعدل عبر الكاميرا الحرارية",
        severity="high",
        status="open",
        latitude=site1.latitude,
        longitude=site1.longitude
    )

    db.add_all([reading1, fault1])
    db.commit()
    db.close()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed()
