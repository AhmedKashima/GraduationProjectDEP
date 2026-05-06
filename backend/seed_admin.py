from base import api, bcrypt
from models import db, Employees

ADMIN_ID = 1
ADMIN_EMAIL = "admin@demo.com"
ADMIN_PASSWORD = "Admin12345"
ADMIN_FIRST_NAME = "Ahmed"
ADMIN_LAST_NAME = "Admin"
ADMIN_PHONE = "+70000000000"
ADMIN_DATE_HIRED = "2026-05-06"

with api.app_context():
    db.create_all()

    admin = Employees.query.filter_by(Email=ADMIN_EMAIL).first()

    if admin is None:
        hashed_password = bcrypt.generate_password_hash(ADMIN_PASSWORD).decode("utf-8")

        admin = Employees(
            Employeeid=ADMIN_ID,
            Email=ADMIN_EMAIL,
            Password=hashed_password,
            FirstName=ADMIN_FIRST_NAME,
            LastName=ADMIN_LAST_NAME,
            PhoneNumber=ADMIN_PHONE,
            Admin=True,
            DateHired=ADMIN_DATE_HIRED
        )

        db.session.add(admin)
        db.session.commit()
        print("Admin user created")
    else:
        admin.Password = bcrypt.generate_password_hash(ADMIN_PASSWORD).decode("utf-8")
        admin.Admin = True
        db.session.commit()
        print("Admin user already existed, password reset and admin enabled")

    print("Email:", ADMIN_EMAIL)
    print("Password:", ADMIN_PASSWORD)
