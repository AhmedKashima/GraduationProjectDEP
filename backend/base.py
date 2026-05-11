# Этот файл является основной точкой входа для бэкэнд-приложения Flask.
# Он обрабатывает создание приложения, конфигурацию, маршрутизацию и инициализацию расширений.
# Следуя этому руководству
# https://dev.to/nagatodev/how-to-add-login-authentication-to-a-flask-and-react-application-23i7
from flask import Flask, request, jsonify, json, abort
from flask_bcrypt import Bcrypt
from config import ApplicationConfig
from sqlalchemy import or_, and_
from flask_cors import CORS, cross_origin
from datetime import datetime, timedelta, timezone
from flask_jwt_extended import create_access_token,get_jwt,get_jwt_identity, \
                               unset_jwt_cookies, jwt_required, JWTManager
from flask_migrate import Migrate
from flask_socketio import SocketIO, join_room, leave_room, emit
from models import db, Employees, Customers, Generators, ServiceRecords, Service_Employee_Int, Password_Recovery, Conversation, Message, ConversationRead
import csv, secrets, string, random



api = Flask(__name__)
CORS(api)
api.config['CORS_HEADERS'] = 'Content-Type'
api.config.from_object(ApplicationConfig)
bcrypt = Bcrypt(api)
db.init_app(api)
migrate = Migrate(api, db)
# Инициализация SocketIO для веб-сокетов в реальном времени
socketio = SocketIO(api, cors_allowed_origins="*")

api.config["JWT_SECRET_KEY"] = "aosdflnasldfnaslndflnsdnlnlknlkgtudsrtstr"
jwt = JWTManager(api)


# we might not need this code anymore
# api.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
# @api.after_request
# def refresh_expiring_jwts(response):
#     try:
#         exp_timestamp = get_jwt()["exp"]
#         now = datetime.now(timezone.utc)
#         target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
#         if target_timestamp > exp_timestamp:
#             access_token = create_access_token(identity=get_jwt_identity())
#             data = response.get_json()
#             if type(data) is dict:
#                 data["access_token"] = access_token 
#                 response.data = json.dumps(data)
#         return response
#     except (RuntimeError, KeyError):
#         # Case where there is not a valid JWT. Just return the original response
#         return response


# Маршрут входа
@api.route('/token', methods=["POST"])
def create_token():
    email = request.json.get("email", None)
    password = request.json.get("password", None)
    remember = request.json.get("remember", None)

    forgot = request.json.get("forgot", None)

    user = Employees.query.filter_by(Email=email).first()
    user = Employees.query.filter_by(Email=email).first()
    access_token = create_access_token(identity=email)
    if user is None:
        return {"msg": "Пользователь не найден"}, 401
    
    if not bcrypt.check_password_hash(user.Password, password):
        return {"msg": "Неверный пароль"}, 401

    if remember:
        expires_delta = timedelta(days=7)
    else:
        expires_delta = timedelta(minutes=30)

    access_token = create_access_token(identity=email,expires_delta=expires_delta)
    response = {"access_token":access_token}

    return response


# Маршрут выхода
@api.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"msg": "Выход выполнен успешно"})
    unset_jwt_cookies(response)
    return response


# эта функция должна возвращать массив объектов сотрудников с:
# firstName, lastName, employeeID, и их именем пользователя и паролем
@api.route('/employees', methods=["GET"])
@jwt_required()
def team():
    
    team_list = []
    for i in Employees.query.all():
        employee = {
            "fN" : i.FirstName,
            "lN" : i.LastName,
            "id" : i.Employeeid,
            "admin": i.Admin,
            "email": i.Email,
            "phone" : i.PhoneNumber,
            "hiredDate" : i.DateHired,
        }
        team_list.append(employee)
    return team_list
    
# Маршрут восстановления пароля, создает новый код для пользователя
@api.route("/recovery/create", methods=["POST"])
def create_code():
    eid1 = request.json["EmployeeID"]
    datemade = request.json["creationDate"]

    user = Employees.query.filter_by(Employeeid = eid1).first()
    for i in Password_Recovery.query.filter_by(Email = user.Email).all():
        db.session.delete(i)

    code = ("".join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=10)))
    new_recovery = Password_Recovery(Code = code, Email = user.Email, Password = user.Password, DateMade = datemade)
    db.session.add(new_recovery)
    
    db.session.commit()
    return {"Code": new_recovery.Code}

# Маршрут восстановления пароля, проверяет правильность кода и отображает ваш пароль
@api.route("/recovery/check", methods=["POST"])
def check_code():
    email = request.json["email"]
    code = request.json["code"]
    new_password = request.json["new_password"]

    recovery = Password_Recovery.query.filter_by(Email = email).first()
    if recovery.Code == code:
        emp = Employees.query.filter_by(Email = email).first()
        emp.Password = bcrypt.generate_password_hash(new_password)
        db.session.delete(recovery)
        db.session.commit()
        return {"msg": "Новый пароль создан"}
    else:
        return {"msg": "Неверный код"}, 401

@api.route("/recovery/display", methods=["POST"])
@jwt_required()
def see_code():
    eid1 = request.json["EmployeeID"]
    emp = Employees.query.filter_by(Employeeid = eid1).first()
    recovery = Password_Recovery.query.filter_by(Email = emp.Email).first()
    
    return {"Code": recovery.Code}


# возвращает имя и уровень разрешений текущего вошедшего в систему пользователя
@api.route("/profile", methods=["GET"])
@jwt_required()
def my_profile():
    user = Employees.query.filter_by(Email=get_jwt_identity()).first()
    response_body = {
        "firstName": user.FirstName,
        "Admin": user.Admin,
        "ID": user.Employeeid
    }

    return response_body

# Маршрут создания сотрудников
@api.route("/employees/create", methods=["POST"])
@cross_origin()
@jwt_required()
def create_employee():
    id1 = request.json["EmployeeID"]
    email1 = request.json["Email"]
    password1 = request.json["Password"]
    firstname1 = request.json["First Name"]
    lastname1 = request.json["Last Name"]
    phonenumber1 = request.json["Phone Number"]
    admin1 = request.json["Admin"]
    dateHired = request.json["hiredDate"]

    employee_exists = Employees.query.filter_by(Employeeid = id1).first() is not None

    if employee_exists:
        abort(409)

    hashed_password = bcrypt.generate_password_hash(password1)
    new_employee = Employees(Employeeid = id1, Email = email1, Password = hashed_password, FirstName = firstname1, LastName = lastname1, PhoneNumber = phonenumber1, Admin = admin1, DateHired = dateHired)
    db.session.add(new_employee)
    db.session.commit()

    return jsonify({
        "ID": new_employee.Employeeid,
        "Email": new_employee.Email,
        "First Name": new_employee.FirstName,
        "Last Name": new_employee.LastName
        })


# Маршрут удаления сотрудников
@api.route("/employees/delete", methods=["POST"])
@cross_origin()
@jwt_required()
def delete_employee():
    # только администратор может удалять сотрудников
    user = Employees.query.filter_by(Email=get_jwt_identity()).first()
    if user.Admin == True:
        reqs = request.get_json()
        id1 = reqs.get("EmployeeID")

        employee_exists = Employees.query.filter_by(Employeeid = id1).first() is not None

        if not employee_exists:
            abort(409)
            
        Employees.query.filter_by(Employeeid = id1).delete()
        db.session.commit()
        
        return jsonify({"ID": id1})


# Изменяет пользователя между администратором/пользователем
@api.route("/employees/permission", methods=["POST"])
@cross_origin()
@jwt_required()
def change_permission():
    empID = request.json.get("EmployeeID", None)

    user = Employees.query.filter_by(Employeeid = empID).first()

    if user is None:
        abort(409)
        
    user.Admin = not user.Admin
    db.session.commit()
    
    return jsonify({"Разрешение изменено для ID": empID})
    

# Поиск и отображение клиентов
@api.route("/customer/display", methods=["POST"])
@cross_origin()
@jwt_required()
def display_customers():

    reqs = request.get_json()
    searchTerm = reqs.get("Search")
    customer_list = []
    user = Employees.query.filter_by(Email=get_jwt_identity()).first()
    for i in Customers.query.filter(or_(Customers.FirstName.like('%' + searchTerm + '%'),
                                        Customers.LastName.like('%' + searchTerm + '%'))):
        customer = {
            "ID": i.Customerid,
            "FirstName": i.FirstName,
            "LastName": i.LastName,
            "Email": i.Email,
            "Phone": i.PhoneNumber,
            "City": i.City,
            "Street": i.Street,
            "State": i.State,
            "ZIP": i.ZIP
        }
        customer_list.append(customer)
    return jsonify({"customers":customer_list, "admin": user.Admin})


# Показывает все детали одного клиента
@api.route("/customer/details", methods=["POST"])
@cross_origin()
@jwt_required()
def customer_details():
    reqs = request.get_json()
    id1 = reqs.get("clientID")
    user = Employees.query.filter_by(Email=get_jwt_identity()).first()
    i = Customers.query.filter_by(Customerid = id1).first()

    customer = {
            "ID": i.Customerid,
            "FirstName": i.FirstName,
            "LastName": i.LastName,
            "Email": i.Email,
            "Phone": i.PhoneNumber,
            "City": i.City,
            "Street": i.Street,
            "State": i.State,
            "ZIP": i.ZIP
        }

    return jsonify({"details":customer, "admin": user.Admin})



# Создание клиентов
@api.route('/customer/create', methods=["POST"])
@cross_origin()
@jwt_required()
def create_customer():
    id1 = request.json["CustomerID"]
    firstname1 = request.json["First Name"]
    lastname1 = request.json["Last Name"]
    email1 = request.json["Email"]
    city1 = request.json["City"]
    street1 = request.json["Street"]
    phonenumber1 = request.json["Phone Number"]
    state1 = request.json["State"]
    Zip1 = request.json["ZIP Code"]
    
    customer_exists = Customers.query.filter_by(Customerid = id1).first() is not None

    if customer_exists:
        abort(409)

    new_customer = Customers(Customerid = id1, FirstName = firstname1, LastName = lastname1, Email = email1, City = city1, Street = street1, PhoneNumber = phonenumber1, State = state1, ZIP = Zip1)
    db.session.add(new_customer)
    db.session.commit()

    return jsonify({
        "ID": new_customer.Customerid,
        "First Name": new_customer.FirstName,
        "Last Name": new_customer.LastName,
        "Email": new_customer.Email,
        "City": new_customer.City,
        "Street": new_customer.Street,
        "State": new_customer.State,
        "ZIP": new_customer.ZIP,
        "Phone Number": new_customer.PhoneNumber
        })

# Удаление клиентов
@api.route("/customer/delete", methods=["POST"])
@cross_origin()
@jwt_required()
def delete_customer():
    reqs = request.get_json()
    id1 = reqs.get("CustomerID")

    customer_exists = Customers.query.filter_by(Customerid = id1).first() is not None

    if not customer_exists:
        abort(409)

    Customers.query.filter_by(Customerid = id1).delete()
    db.session.commit()

    return jsonify({"ID": id1})


# Создает новую запись об услуге в базе данных, проверяет наличие ошибок при создании
@api.route("/service/create", methods=["POST"])
@jwt_required()
def create_service():
    id1 = request.json["ServiceID"]
    customerid1 = request.json["CustomerID"]
    generatorid1 = request.json["GeneratorID"]
    performed1 = request.json["ServicePerformed"]
    startdate1 = request.json["Date"]
    starttime1 = request.json["Time"]
    reqs = request.get_json()
    servicetype1 = reqs.get("ServiceType")
    notes1 = request.json["Notes"]
    
    service_exists = ServiceRecords.query.filter_by(Serviceid = id1).first() is not None

    if service_exists:
        abort(409)

    new_service = ServiceRecords(Serviceid = id1, Customerid = customerid1, Generatorid = generatorid1, ServicePerformed = performed1, ServiceType = servicetype1, StartDate = startdate1, StartTime = starttime1, Notes = notes1)
    
    db.session.add(new_service)
    db.session.commit()

    return jsonify({
        "ID": new_service.Serviceid,
        "Customer Name": new_service.Customerid,
        "Generator Type": new_service.Generatorid,
        "Service Performed": new_service.ServicePerformed,
        "Start Date": new_service.StartDate,
        "Start Time": new_service.StartTime,
        "Notes": new_service.Notes
        })

@api.route("/generators/details", methods=["GET"])
@jwt_required()
def retrieve_generators():
    gList = []
    for g in Generators.query.all():
        generator =  {
            "gID" : g.Generatorid,
            "gName" : g.Name,
            "gCost" : g.Cost,
            "gNotes" : g.Notes
        }
        gList.append(generator)

    return gList

@api.route("/service/details", methods=["POST"])
@jwt_required()
def retrieve_services():
    reqs = request.get_json()
    id1 = reqs.get("CustomerID")
    services = []

    if id1 is None:
        # If no CustomerID provided, return all service records for all customers
        for i in ServiceRecords.query.all():
            gName = Generators.query.filter_by(Generatorid = i.Generatorid).first()
            services.append({
                "ServiceID": i.Serviceid,
                "CustomerID": i.Customerid,
                "Generator": gName.Name,
                "ServiceType": i.ServiceType,
                "ServicePerformed": i.ServicePerformed,
                "Date": i.StartDate,
                "Time": i.StartTime,
                "FinishDate": i.FinishDate,
                "FinishTime": i.FinishTime,
                "Notes": i.Notes,
            })
    else:
        # If a CustomerID is provided, return service records for that customer
        service_exists = ServiceRecords.query.filter_by(Customerid = id1).first() is not None

        if not service_exists:
            abort(409)

        for i in ServiceRecords.query.filter_by(Customerid = id1).all():
            gName = Generators.query.filter_by(Generatorid = i.Generatorid).first()
            services.append({
                "ServiceID": i.Serviceid,
                "Generator": gName.Name,
                "ServiceType": i.ServiceType,
                "ServicePerformed": i.ServicePerformed,
                "Date": i.StartDate,
                "Time": i.StartTime,
                "FinishDate": i.FinishDate,
                "FinishTime": i.FinishTime,
                "Notes": i.Notes,
            })

    return services




# редактировать задания со страницы расписания
# Доступно для учетных записей администратора
@api.route("/schedule/edit", methods=["POST"])
@jwt_required()
def edit_Job():
    # Проверка, что пользователь является администратором
    user = Employees.query.filter_by(Email=get_jwt_identity()).first()
    reqs = request.get_json()
    sid = reqs.get("ServiceID")
    generatorname = reqs.get("GeneratorName")
    startdate = reqs.get("Date")
    starttime = reqs.get("Time")
    servicetype = reqs.get("ServiceType")
    notes = reqs.get("Notes")

    if user.Admin == True:
        service = ServiceRecords.query.filter_by(Serviceid = sid).first()
        service.Generatorid = generatorname
        service.StartDate = startdate
        service.StartTime = starttime
        service.ServiceType = servicetype
        service.Notes = notes
        
        db.session.commit()
        
        return jsonify({
        "service_id": sid,
        "generator_name": generatorname,
        "start_date": startdate,
        "start_time": starttime,
        "service_type": servicetype,
        "notes": notes,
    })

    return
    
# Добавляет техников к заданиям
# Доступно для администраторов
@api.route("/schedule/techs", methods = ["POST"])
@jwt_required()
def add_techs():  
    
    # Проверка, что пользователь является администратором
    user = Employees.query.filter_by(Email=get_jwt_identity()).first()

    if user.Admin == True:
        reqs = request.get_json()
        sid = reqs.get("ServiceID")
        tech_id = []
        tech_id.append(request.json["FirstEmployeeID"])
        tech_id.append(request.json["SecondEmployeeID"])
        tech_id.append(request.json["ThirdEmployeeID"])
        tech_id.append(request.json["FourthEmployeeID"])

        for i in Service_Employee_Int.query.filter_by(Serviceid = sid).all():
            db.session.delete(i)
            db.session.commit()

        for k in tech_id:
            if k != "default":
                assigned = Service_Employee_Int(Serviceid = sid, Employeeid = k)
                db.session.add(assigned)
        
        db.session.commit()

        return jsonify({
            "ServiceID": sid,
            "First_Employee_ID": tech_id[0],
            "Second_Employee_ID": tech_id[1],
            "Third_Employee_ID": tech_id[2],
            "Fourth_Employee_ID": tech_id[3],
        })

# Завершает задание со страницы расписания и устанавливает дату/время окончания
# Доступно для всех, у кого это отображается
@api.route("/schedule/complete", methods = ["POST"])
@jwt_required()
def complete_job():
    reqs = request.get_json()
    sid = reqs.get("ServiceID")
    finishdate = reqs.get("completeDate")
    finishtime = reqs.get("completeTime")
    service = ServiceRecords.query.filter_by(Serviceid = sid).first()
    
    if service.ServicePerformed == False:
        service.ServicePerformed = True
        service.FinishDate = finishdate
        service.FinishTime = finishtime
    else:
        service.ServicePerformed = False
        service.FinishDate = None
        service.FinishTime = None
    
    
 
    db.session.commit()

    return jsonify({
        "ServiceID": service.Serviceid,
        "Service_Performed": service.ServicePerformed,
        "Finish Date": service.FinishDate,
        "Finish Time": service.FinishTime
    })

# Отображает предстоящие услуги
@api.route("/schedule/display", methods = ["POST"])
@jwt_required()
def get_all_services():
    start_date = request.json.get("startDate", None)
    end_date = request.json.get("endDate", None)
    services = []
    techs = []
    user = Employees.query.filter_by(Email=get_jwt_identity()).first()
    if start_date is None and end_date is None:
        service_records = ServiceRecords.query.all()
    else:
        service_records = ServiceRecords.query.filter(ServiceRecords.StartDate.between(start_date, end_date)).all()
    
    #This Code May No Longer Be Necessary
    #if not service_records:
       # return jsonify({'message': 'no jobs found'})

    for service in service_records:
        customer = Customers.query.filter_by(Customerid=service.Customerid).first()
        generator = Generators.query.filter_by(Generatorid=service.Generatorid).first()

        if user.Admin == True:
            for ser_emp_int in Service_Employee_Int.query.filter_by(Serviceid = service.Serviceid).all():
                emp = Employees.query.filter_by(Employeeid = ser_emp_int.Employeeid).first()
                techs.append({
                    'service_id': service.Serviceid,
                    'employee_first_name': emp.FirstName,
                    'employee_last_name': emp.LastName
                })

            services.append({
                'service_id': service.Serviceid,
                'customer_first_name': customer.FirstName,
                'customer_last_name': customer.LastName,
                'city': customer.City,
                'street': customer.Street,
                'generator_name': generator.Name,
                'service_type': service.ServiceType,
                'start_date': service.StartDate,
                'start_time': service.StartTime,
                'finish_date': service.FinishDate,
                'finish_time': service.FinishTime,
                'notes': service.Notes
            })

        else:
            for guy in Service_Employee_Int.query.filter_by(Employeeid = user.Employeeid).all():
                if service.Serviceid == guy.Serviceid:
                    techs.append({
                        'service_id': service.Serviceid,
                        'employee_first_name': user.FirstName,
                        'employee_last_name': user.LastName
                    })

                    services.append({
                        'service_id': service.Serviceid,
                        'customer_first_name': customer.FirstName,
                        'customer_last_name': customer.LastName,
                        'city': customer.City,
                        'street': customer.Street,
                        'generator_name': generator.Name,
                        'service_type': service.ServiceType,
                        'start_date': service.StartDate,
                        'start_time': service.StartTime,
                        'finish_date': service.FinishDate,
                        'finish_time': service.FinishTime,
                        'notes': service.Notes
                    })

    return jsonify({'services': services, 'techs': techs, 'team': team(), 'admin': user.Admin, 'generators': retrieve_generators()})

# Удаляет задания со страницы расписания
# Доступно для администраторов
@api.route("/schedule/delete", methods = ["POST"])
@jwt_required()
def delete_job():
    
    # Проверка, является ли вошедший в систему пользователь администратором
    user = Employees.query.filter_by(Email=get_jwt_identity()).first()

    if user.Admin == True:
        reqs = request.get_json()
        id1 = reqs.get("ServiceID")

        service_exists = ServiceRecords.query.filter_by(Serviceid = id1).first() is not None

        if not service_exists:
            abort(409)

        badrecord = ServiceRecords.query.filter_by(Serviceid = id1).first()
        #Deletes ser_emp_int records that go with the service record being deleted
        for i in Service_Employee_Int.query.filter_by(Serviceid = id1).all():
            db.session.delete(i)
        db.session.delete(badrecord)
        db.session.commit()

    return jsonify({"ID": id1})

# Получает все разговоры для пользователя
@api.route('/api/conversations/<int:user_id>', methods=['GET'])
@jwt_required()
def get_conversations(user_id):
    user = Employees.query.get(user_id)
    if not user:
        return jsonify({"msg": "Пользователь не найден"}), 404

    conversations = Conversation.query.filter(
        or_(Conversation.user_one_id == user_id, Conversation.user_two_id == user_id)
    ).all()

    results = []
    for conv in conversations:
        other_user_id = conv.user_two_id if conv.user_one_id == user_id else conv.user_one_id
        other_user = Employees.query.get(other_user_id)
        
        last_message = Message.query.filter_by(conversation_id=conv.id).order_by(Message.timestamp.desc()).first()
        read_state = ConversationRead.query.filter_by(conversation_id=conv.id, user_id=user_id).first()
        last_read_at = read_state.last_read_at if read_state else None
        unread_query = Message.query.filter_by(conversation_id=conv.id).filter(Message.sender_id != user_id)
        if last_read_at:
            unread_query = unread_query.filter(Message.timestamp > last_read_at)
        unread_count = unread_query.count()
        
        results.append({
            "conversation_id": conv.id,
            "other_user": {
                "id": other_user.Employeeid,
                "name": f"{other_user.FirstName} {other_user.LastName}",
                "email": other_user.Email
            },
            "last_message": {
                "content": last_message.content if last_message else None,
                "timestamp": last_message.timestamp.isoformat() if last_message else None
            },
            "unread_count": unread_count
        })

    return jsonify(results)

# Находит или создает разговор между двумя пользователями
@api.route('/api/conversations', methods=['POST'])
@jwt_required()
def find_or_create_conversation():
    user_id = request.json.get('user_id')
    recipient_id = request.json.get('recipient_id')

    if not user_id or not recipient_id:
        return jsonify({"msg": "Отсутствует user_id или recipient_id"}), 400

    conversation = Conversation.query.filter(
        or_(
            and_(Conversation.user_one_id == user_id, Conversation.user_two_id == recipient_id),
            and_(Conversation.user_one_id == recipient_id, Conversation.user_two_id == user_id)
        )
    ).first()

    if not conversation:
        conversation = Conversation(user_one_id=user_id, user_two_id=recipient_id)
        db.session.add(conversation)
        db.session.commit()

    messages = Message.query.filter_by(conversation_id=conversation.id).order_by(Message.timestamp.asc()).all()
    message_list = [
        {
            "conversation_id": conversation.id,
            "sender_id": msg.sender_id,
            "content": msg.content,
            "timestamp": msg.timestamp.isoformat()
        } for msg in messages
    ]

    return jsonify({
        "conversation_id": conversation.id,
        "messages": message_list
    })

# Обновляет состояние прочтения разговора
@api.route('/api/conversations/read', methods=['POST'])
@jwt_required()
def mark_conversation_read():
    user = Employees.query.filter_by(Email=get_jwt_identity()).first()
    conversation_id = request.json.get('conversation_id')
    user_id = request.json.get('user_id')

    if not conversation_id or not user_id:
        return jsonify({"msg": "Отсутствует conversation_id или user_id"}), 400

    if user.Employeeid != user_id:
        return jsonify({"msg": "Недостаточно прав"}), 403

    conversation = Conversation.query.get(conversation_id)
    if not conversation:
        return jsonify({"msg": "Разговор не найден"}), 404

    if user_id not in [conversation.user_one_id, conversation.user_two_id]:
        return jsonify({"msg": "Недоступный разговор"}), 403

    read_state = ConversationRead.query.filter_by(conversation_id=conversation_id, user_id=user_id).first()
    if not read_state:
        read_state = ConversationRead(conversation_id=conversation_id, user_id=user_id)
        db.session.add(read_state)

    read_state.last_read_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"msg": "Прочитано"})

# Обработчик событий SocketIO для присоединения пользователя к комнате
@socketio.on('join')
def on_join(data):
    user_id = data.get('user_id')
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return
    room = f"user_{user_id}"
    join_room(room)
    emit('status', {'msg': f'Пользователь {user_id} присоединился к комнате {room}.'}, room=room)

# Обработчик событий SocketIO для отправки сообщения
@socketio.on('send_message')
def on_send_message(data):
    conversation_id = data.get('conversation_id')
    sender_id = data.get('sender_id')
    content = data.get('content')

    if not all([conversation_id, sender_id, content]):
        return
    try:
        conversation_id = int(conversation_id)
        sender_id = int(sender_id)
    except (TypeError, ValueError):
        return

    # Найти разговор и получателя
    conversation = Conversation.query.get(conversation_id)
    if not conversation:
        return

    recipient_id = conversation.user_two_id if conversation.user_one_id == sender_id else conversation.user_one_id

    # Сохранить сообщение в базе данных
    new_message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content
    )
    db.session.add(new_message)
    db.session.commit()

    # Отправить сообщение в комнату получателя
    recipient_room = f"user_{recipient_id}"
    emit('new_message', {
        'conversation_id': conversation_id,
        'sender_id': sender_id,
        'content': content,
        'timestamp': new_message.timestamp.isoformat()
    }, room=recipient_room)

    # Также отправить в комнату отправителя для обновления пользовательского интерфейса
    sender_room = f"user_{sender_id}"
    emit('new_message', {
        'conversation_id': conversation_id,
        'sender_id': sender_id,
        'content': content,
        'timestamp': new_message.timestamp.isoformat()
    }, room=sender_room)

# Индикатор печати: отправить событие получателю
@socketio.on('typing')
def on_typing(data):
    conversation_id = data.get('conversation_id')
    sender_id = data.get('sender_id')
    recipient_id = data.get('recipient_id')

    if not all([conversation_id, sender_id, recipient_id]):
        return
    try:
        conversation_id = int(conversation_id)
        sender_id = int(sender_id)
        recipient_id = int(recipient_id)
    except (TypeError, ValueError):
        return

    recipient_room = f"user_{recipient_id}"
    emit('typing', {
        'conversation_id': conversation_id,
        'sender_id': sender_id
    }, room=recipient_room)

# Остановить индикатор печати
@socketio.on('stop_typing')
def on_stop_typing(data):
    conversation_id = data.get('conversation_id')
    sender_id = data.get('sender_id')
    recipient_id = data.get('recipient_id')

    if not all([conversation_id, sender_id, recipient_id]):
        return
    try:
        conversation_id = int(conversation_id)
        sender_id = int(sender_id)
        recipient_id = int(recipient_id)
    except (TypeError, ValueError):
        return

    recipient_room = f"user_{recipient_id}"
    emit('stop_typing', {
        'conversation_id': conversation_id,
        'sender_id': sender_id
    }, room=recipient_room)

# Конечная точка для статистики панели управления
@api.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    user = Employees.query.filter_by(Email=get_jwt_identity()).first()
    if not user.Admin:
        return jsonify({"msg": "Только для администраторов"}), 403

    completed = ServiceRecords.query.filter_by(ServicePerformed=True).count()
    in_progress = ServiceRecords.query.filter_by(ServicePerformed=False).count()
    
    return jsonify({
        "completed": completed,
        "in_progress": in_progress,
        "scheduled": 0  # Заполнитель, так как в модели нет статуса 'scheduled'
    })

# Конечная точка для производительности сотрудников
@api.route('/api/dashboard/performance', methods=['GET'])
@jwt_required()
def get_employee_performance():
    user = Employees.query.filter_by(Email=get_jwt_identity()).first()
    if not user.Admin:
        return jsonify({"msg": "Только для администраторов"}), 403

    employees = Employees.query.all()
    performance = []
    for emp in employees:
        completed_tasks = ServiceRecords.query.join(Service_Employee_Int).filter(
            Service_Employee_Int.Employeeid == emp.Employeeid,
            ServiceRecords.ServicePerformed == True
        ).count()
        performance.append({
            "name": f"{emp.FirstName} {emp.LastName}",
            "tasks": completed_tasks
        })

    return jsonify(performance)

# Конечная точка для дохода с течением времени
@api.route('/api/dashboard/revenue_over_time', methods=['GET'])
@jwt_required()
def get_revenue_over_time():
    user = Employees.query.filter_by(Email=get_jwt_identity()).first()
    if not user.Admin:
        return jsonify({"msg": "Только для администраторов"}), 403

    month_labels = {
        1: "Январь",
        2: "Февраль",
        3: "Март",
        4: "Апрель",
        5: "Май",
        6: "Июнь",
        7: "Июль",
        8: "Август",
        9: "Сентябрь",
        10: "Октябрь",
        11: "Ноябрь",
        12: "Декабрь"
    }

    services = ServiceRecords.query.filter_by(ServicePerformed=True).all()
    revenue_by_month = {}

    for service in services:
        try:
            date = datetime.strptime(service.StartDate, '%Y-%m-%d')
            month_index = date.month
            
            generator = Generators.query.get(service.Generatorid)
            if generator:
                if month_index not in revenue_by_month:
                    revenue_by_month[month_index] = 0
                revenue_by_month[month_index] += generator.Cost
        except ValueError:
            # Обработка случаев, когда формат даты не соответствует ожидаемому
            continue

    revenue = [
        {"month": month_labels.get(month_index, str(month_index)), "month_index": month_index, "revenue": total}
        for month_index, total in revenue_by_month.items()
    ]
    
    return jsonify(revenue)

# Конечная точка для основных метрик администратора
@api.route('/api/admin/metrics', methods=['GET'])
@jwt_required()
def get_admin_metrics():
    user = Employees.query.filter_by(Email=get_jwt_identity()).first()
    if not user.Admin:
        return jsonify({"msg": "Только для администраторов"}), 403

    total_clients = Customers.query.count()
    active_projects = ServiceRecords.query.filter_by(ServicePerformed=False).count()
    completed_projects = ServiceRecords.query.filter_by(ServicePerformed=True).count()
    total_projects = ServiceRecords.query.count()

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    messages_today = Message.query.filter(Message.timestamp >= today_start).count()

    revenue_total = 0
    for service in ServiceRecords.query.filter_by(ServicePerformed=True).all():
        generator = Generators.query.get(service.Generatorid)
        if generator:
            revenue_total += generator.Cost

    completion_rate = round((completed_projects / total_projects) * 100, 2) if total_projects else 0

    return jsonify({
        "total_clients": total_clients,
        "active_projects": active_projects,
        "messages_today": messages_today,
        "revenue_total": revenue_total,
        "completion_rate": completion_rate
    })

# Список активных проектов для админ-панели
@api.route('/api/admin/active-projects', methods=['GET'])
@jwt_required()
def get_active_projects():
    user = Employees.query.filter_by(Email=get_jwt_identity()).first()
    if not user.Admin:
        return jsonify({"msg": "Только для администраторов"}), 403

    active = ServiceRecords.query.filter_by(ServicePerformed=False).all()
    results = []
    for service in active:
        customer = Customers.query.filter_by(Customerid=service.Customerid).first()
        generator = Generators.query.filter_by(Generatorid=service.Generatorid).first()
        techs = []
        for assignment in Service_Employee_Int.query.filter_by(Serviceid=service.Serviceid).all():
            tech = Employees.query.filter_by(Employeeid=assignment.Employeeid).first()
            if tech:
                techs.append({
                    "id": tech.Employeeid,
                    "name": f"{tech.FirstName} {tech.LastName}"
                })
        results.append({
            "service_id": service.Serviceid,
            "customer_name": f"{customer.FirstName} {customer.LastName}" if customer else "Неизвестно",
            "city": customer.City if customer else "",
            "street": customer.Street if customer else "",
            "generator_name": generator.Name if generator else "",
            "service_type": service.ServiceType,
            "start_date": service.StartDate,
            "start_time": service.StartTime,
            "notes": service.Notes,
            "techs": techs
        })

    return jsonify(results)

# Конечная точка для линии активности (за последние N дней)
@api.route('/api/admin/activity', methods=['GET'])
@jwt_required()
def get_admin_activity():
    user = Employees.query.filter_by(Email=get_jwt_identity()).first()
    if not user.Admin:
        return jsonify({"msg": "Только для администраторов"}), 403

    days_param = request.args.get('days', 14)
    try:
        days = max(1, min(int(days_param), 60))
    except ValueError:
        days = 14

    def parse_service_date(date_str):
        if not date_str:
            return None
        for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%Y/%m/%d"):
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        return None

    today = datetime.now(timezone.utc).date()
    start_day = today - timedelta(days=days - 1)
    counts_by_day = { (start_day + timedelta(days=i)).isoformat(): 0 for i in range(days) }

    for service in ServiceRecords.query.all():
        service_date = parse_service_date(service.StartDate)
        if service_date is None:
            continue
        if service_date < start_day or service_date > today:
            continue
        key = service_date.isoformat()
        counts_by_day[key] += 1

    activity = [{"date": date_key, "count": count} for date_key, count in counts_by_day.items()]
    activity.sort(key=lambda item: item["date"])
    return jsonify(activity)

# Конечная точка для получения всех администраторов
@api.route('/api/admins', methods=['GET'])
@jwt_required()
def get_admins():
    admins = Employees.query.filter_by(Admin=True).all()
    admin_list = [
        {
            "id": admin.Employeeid,
            "name": f"{admin.FirstName} {admin.LastName}",
            "email": admin.Email
        }
        for admin in admins
    ]
    return jsonify(admin_list)

if __name__ == '__main__':
    socketio.run(api, debug=True, port=3000)
        
