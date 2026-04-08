from flask import Blueprint, request, jsonify
from models import db, Employee

employees_bp = Blueprint('employees', __name__, url_prefix='/api/employees')


@employees_bp.route('/', methods=['GET'])
def get_employees():
    search = request.args.get('search', '').strip()
    status = request.args.get('status')
    query = Employee.query
    if search:
        query = query.filter(
            Employee.name.ilike(f'%{search}%') |
            Employee.role.ilike(f'%{search}%') |
            Employee.phone.ilike(f'%{search}%')
        )
    if status:
        query = query.filter_by(status=status)
    return jsonify([e.to_dict() for e in query.order_by(Employee.name).all()])


@employees_bp.route('/', methods=['POST'])
def create_employee():
    data = request.get_json()
    if not data.get('name'):
        return jsonify({'error': 'Name required'}), 400
    if not data.get('phone'):
        return jsonify({'error': 'Phone required'}), 400
    emp = Employee(
        name=data['name'],
        role=data.get('role', 'Cashier'),
        phone=data['phone'],
        email=data.get('email'),
        salary=float(data.get('salary', 0)),
        start_date=data.get('start_date'),
        national_id=data.get('national_id'),
        status=data.get('status', 'Active'),
        notes=data.get('notes'),
    )
    db.session.add(emp)
    db.session.commit()
    return jsonify(emp.to_dict()), 201


@employees_bp.route('/<int:emp_id>', methods=['PUT'])
def update_employee(emp_id):
    emp = Employee.query.get_or_404(emp_id)
    data = request.get_json()
    emp.name = data.get('name', emp.name)
    emp.role = data.get('role', emp.role)
    emp.phone = data.get('phone', emp.phone)
    emp.email = data.get('email', emp.email)
    emp.salary = float(data.get('salary', emp.salary))
    emp.start_date = data.get('start_date', emp.start_date)
    emp.national_id = data.get('national_id', emp.national_id)
    emp.status = data.get('status', emp.status)
    emp.notes = data.get('notes', emp.notes)
    db.session.commit()
    return jsonify(emp.to_dict())


@employees_bp.route('/<int:emp_id>', methods=['DELETE'])
def delete_employee(emp_id):
    emp = Employee.query.get_or_404(emp_id)
    db.session.delete(emp)
    db.session.commit()
    return jsonify({'success': True})