import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine, SessionLocal
from app.models.team import Team
from app.models.user import User
from app.models.site import Site

def migrate_and_seed_teams():
    print("Creating tables including Teams...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if teams exist
    if db.query(Team).first():
        print("Teams already exist.")
        db.close()
        return

    site1 = db.query(Site).filter(Site.code == "SITE-NR-01").first()
    site2 = db.query(Site).filter(Site.code == "SITE-EM-02").first()
    supervisor = db.query(User).filter(User.username == "supervisor").first()
    tech1 = db.query(User).filter(User.username == "tech1").first()
    tech2 = db.query(User).filter(User.username == "tech2").first()
    tech3 = db.query(User).filter(User.username == "tech3").first()

    print("Seeding specialized electrical field teams...")
    team1 = Team(
        name="فريق طوارئ الشبكات والجهد العالي",
        code="TEAM-HV-EMERG",
        specialty="طوارئ وانقطاعات ومحطات التحويل",
        color="#ef4444",
        site_id=site1.id if site1 else None,
        leader_id=supervisor.id if supervisor else None,
        description="فريق الاستجابة السريعة للأعطال الطارئة والانقطاعات ومحولات الجهد المتوسط والعالي"
    )

    team2 = Team(
        name="فريق صيانة المولدات ومحطات الطاقة",
        code="TEAM-GEN-MAINT",
        specialty="صيانة المولدات ومحركات الديزل والطاقة الاحتياطية",
        color="#f59e0b",
        site_id=site1.id if site1 else None,
        leader_id=supervisor.id if supervisor else None,
        description="فريق فحص وصيانة المولدات وأنظمة الوقود وزيت المحركات ولوحات ATS"
    )

    team3 = Team(
        name="فريق تمديدات القوى ولوحات التوزيع MDB",
        code="TEAM-LV-INST",
        specialty="تمديدات الكابلات ولوحات التوزيع والجهد المنخفض",
        color="#0284c7",
        site_id=site2.id if site2 else None,
        leader_id=supervisor.id if supervisor else None,
        description="فريق تركيب وتمديد الكابلات، لوحات MDB/SMDB، وفحص الأحمال الكهربائية"
    )

    db.add_all([team1, team2, team3])
    db.commit()

    # Assign technicians to their respective specialized teams
    if tech1:
        tech1.team_id = team1.id
    if tech2:
        tech2.team_id = team2.id
    if tech3:
        tech3.team_id = team3.id

    db.commit()
    db.close()
    print("Field teams created and technicians assigned successfully!")

if __name__ == "__main__":
    migrate_and_seed_teams()
