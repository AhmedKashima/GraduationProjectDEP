from base import api, bcrypt
from models import db, Employees

USER_EMAIL = "worker@demo.com"
USER_PASSWORD = "Worker12345"
USER_FIRST_NAME = "Worker"
USER_LAST_NAME = "Demo"
USER_PHONE = 70000000000
USER_DATE_HIRED = "2026-05-11"

with api.app_context():
    db.create_all()

    user = Employees.query.filter_by(Email=USER_EMAIL).first()

    if user is None:
        hashed_password = bcrypt.generate_password_hash(USER_PASSWORD).decode("utf-8")

        user = Employees(
            Email=USER_EMAIL,
            Password=hashed_password,
            FirstName=USER_FIRST_NAME,
            LastName=USER_LAST_NAME,
            PhoneNumber=USER_PHONE,
            Admin=False,
            DateHired=USER_DATE_HIRED
        )

        db.session.add(user)
        db.session.commit()

        print("User created")

    else:
        user.Password = bcrypt.generate_password_hash(USER_PASSWORD).decode("utf-8")
        user.Admin = False

        db.session.commit()

        print("User already existed, password reset")

    print("Email:", USER_EMAIL)
    print("Password:", USER_PASSWORD)