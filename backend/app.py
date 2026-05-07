# import os

# from base import api, socketio

# app = api


# @app.get("/")
# def health_check():
#     return {
#         "status": "ok",
#         "message": "Graduation backend is running"
#     }, 200


# if __name__ == "__main__":
#     port = int(os.environ.get("PORT", 5000))

#     socketio.run(
#         app,
#         host="0.0.0.0",
#         port=port,
#         debug=False,
#         allow_unsafe_werkzeug=True
#     )


import os

from base import api, socketio, bcrypt
from models import db, Employees

app = api


def seed_demo_admin():
    admin_email = "admin@demo.com"
    admin_password = "Admin12345"

    with app.app_context():
        db.create_all()

        admin = Employees.query.filter_by(Email=admin_email).first()

        if admin is None:
            admin = Employees(
                Employeeid=1,
                Email=admin_email,
                Password=bcrypt.generate_password_hash(admin_password).decode("utf-8"),
                FirstName="Ahmed",
                LastName="Admin",
                PhoneNumber="+70000000000",
                Admin=True,
                DateHired="2026-05-06"
            )
            db.session.add(admin)
            db.session.commit()
        else:
            admin.Admin = True
            db.session.commit()


seed_demo_admin()


@app.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "Graduation backend is running"
    }, 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))

    socketio.run(
        app,
        host="0.0.0.0",
        port=port,
        debug=False,
        allow_unsafe_werkzeug=True
    )



# also the script

# cd ~/Desktop/ForVercel/backend

# cat > seed_admin.py <<'PY'
# from base import api, bcrypt
# from models import db, Employees

# ADMIN_ID = 1
# ADMIN_EMAIL = "admin@demo.com"
# ADMIN_PASSWORD = "Admin12345"
# ADMIN_FIRST_NAME = "Ahmed"
# ADMIN_LAST_NAME = "Admin"
# ADMIN_PHONE = "+70000000000"
# ADMIN_DATE_HIRED = "2026-05-06"

# with api.app_context():
#     db.create_all()

#     admin = Employees.query.filter_by(Email=ADMIN_EMAIL).first()

#     if admin is None:
#         hashed_password = bcrypt.generate_password_hash(ADMIN_PASSWORD).decode("utf-8")

#         admin = Employees(
#             Employeeid=ADMIN_ID,
#             Email=ADMIN_EMAIL,
#             Password=hashed_password,
#             FirstName=ADMIN_FIRST_NAME,
#             LastName=ADMIN_LAST_NAME,
#             PhoneNumber=ADMIN_PHONE,
#             Admin=True,
#             DateHired=ADMIN_DATE_HIRED
#         )

#         db.session.add(admin)
#         db.session.commit()
#         print("Admin user created")
#     else:
#         admin.Password = bcrypt.generate_password_hash(ADMIN_PASSWORD).decode("utf-8")
#         admin.Admin = True
#         db.session.commit()
#         print("Admin user already existed, password reset and admin enabled")

#     print("Email:", ADMIN_EMAIL)
#     print("Password:", ADMIN_PASSWORD)
# PY

# then python seed.py