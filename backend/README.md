# Generator Service Management Backend

A Flask + SQLAlchemy backend for managing generator service operations: employees, customers, generators, service tasks, scheduling, and real-time team messaging. This API powers admin and technician workflows like creating tasks, assigning techs, filtering schedules, and dashboard analytics.

## What This Project Does

- Authenticates employees with JWT and role-based access (admin vs user)
- Manages customers, generators, and service records (tasks)
- Provides scheduling, assignment, and completion flows for service jobs
- Supports real-time chat between employees with Socket.IO
- Exposes dashboard/analytics endpoints for charts and admin KPIs
- Includes CSV import for generators and Alembic migrations

## Roles And Permissions

- Admin
- Create, edit, delete employees
- Create, edit, delete customers
- Create, edit, delete service tasks
- Assign technicians to tasks
- View all schedules, analytics, dashboards
- User (Technician)
- View assigned tasks only
- Mark tasks complete
- Participate in messaging

## Core Modules

- `base.py`: Flask app entry point, routes, JWT, Socket.IO, and core business logic
- `models.py`: SQLAlchemy models (employees, customers, generators, services, chat)
- `config.py`: Application configuration (SQLite + env)
- `generator_reader.py`: CSV loader for generator catalog
- `migrations/`: Alembic migration scripts

## Data Model Summary

- Employees: accounts, roles, contact info
- Customers: client contact and address
- Generators: catalog of generator models and pricing
- ServiceRecords: service tasks with dates, type, and notes
- Service_Employee_Int: many-to-many assignment of techs to tasks
- Conversation, Message, ConversationRead: chat threads, messages, read state

## API Overview

Auth and profile
- `POST /token` login, returns JWT
- `POST /logout` logout
- `GET /profile` current user profile

Employees (admin only)
- `GET /employees` list all employees
- `POST /employees/create` create employee
- `POST /employees/delete` delete employee
- `POST /employees/permission` toggle admin/user

Password recovery
- `POST /recovery/create` create recovery code
- `POST /recovery/check` verify code and reset password
- `POST /recovery/display` show recovery code

Customers
- `POST /customer/display` search customers
- `POST /customer/details` customer details
- `POST /customer/create` create customer
- `POST /customer/delete` delete customer

Generators
- `GET /generators/details` list generators
- `GET /generator/create` load generators from `testFile.csv`

Service tasks and schedule
- `POST /service/create` create a service record
- `POST /service/details` list services (all or by customer)
- `POST /schedule/display` list schedule with filters
- `POST /schedule/edit` edit a job (admin)
- `POST /schedule/techs` assign technicians (admin)
- `POST /schedule/complete` toggle completion
- `POST /schedule/delete` delete a job (admin)

Messaging
- `GET /api/conversations/<user_id>` list conversations and unread counts
- `POST /api/conversations` find or create conversation, fetch messages
- `POST /api/conversations/read` mark conversation read
- Socket.IO events: `join`, `send_message`, `typing`, `stop_typing`

Admin analytics and charts
- `GET /api/dashboard/stats` completed vs in-progress
- `GET /api/dashboard/performance` completed tasks per employee
- `GET /api/dashboard/revenue_over_time` revenue by month
- `GET /api/admin/metrics` KPI cards (clients, revenue, completion)
- `GET /api/admin/active-projects` list active projects
- `GET /api/admin/activity?days=N` activity line chart
- `GET /api/admins` list admins

## Filtering And Scheduling Behavior

- Schedule filtering by date range: `POST /schedule/display` with `startDate` and `endDate`
- Admins see all tasks and all assigned technicians
- Users see only tasks assigned to them
- Completion toggles `ServicePerformed` and sets finish date/time

## Realtime Chat

- Each user joins a private room `user_<id>`
- Sending a message broadcasts to both sender and recipient rooms
- Read state tracked per conversation for unread counts

## Setup

1. Create and activate a virtual environment
2. Install dependencies
3. Set `SECRET_KEY` in `.env`
4. Run the app

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export SECRET_KEY="your-secret"
python base.py
```

The API starts on port `3000` with Socket.IO enabled.

## Database And Migrations

- SQLite is used by default (`db.sqlite`)
- Alembic migration files live in `migrations/`

## Notes

- JWT is required for protected routes (`@jwt_required`)
- Admin checks gate higher-privilege endpoints
- Generator pricing powers revenue calculations

## Quick Use Cases

- Admin creates employees, customers, and generator catalog
- Admin creates service tasks and assigns technicians
- Techs view their tasks, update status, and message admins
- Admin reviews charts for performance and revenue trends
