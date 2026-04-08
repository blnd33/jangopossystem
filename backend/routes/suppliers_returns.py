from flask import Blueprint, request, jsonify
from models import db, Supplier, Return

suppliers_bp = Blueprint('suppliers', __name__, url_prefix='/api/suppliers')
returns_bp = Blueprint('returns', __name__, url_prefix='/api/returns')

@suppliers_bp.route('/', methods=['GET'])
def get_suppliers():
    search = request.args.get('search', '').strip()
    query = Supplier.query
    if search: query = query.filter(Supplier.name.ilike(f'%{search}%') | Supplier.phone.ilike(f'%{search}%'))
    return jsonify([s.to_dict() for s in query.order_by(Supplier.name).all()])

@suppliers_bp.route('/', methods=['POST'])
def create_supplier():
    data = request.get_json()
    if not data.get('name'): return jsonify({'error': 'Name required'}), 400
    if not data.get('phone'): return jsonify({'error': 'Phone required'}), 400
    s = Supplier(name=data['name'], phone=data['phone'], email=data.get('email'), address=data.get('address'), notes=data.get('notes'))
    db.session.add(s)
    db.session.commit()
    return jsonify(s.to_dict()), 201

@suppliers_bp.route('/<int:sid>', methods=['PUT'])
def update_supplier(sid):
    s = Supplier.query.get_or_404(sid)
    data = request.get_json()
    s.name = data.get('name', s.name)
    s.phone = data.get('phone', s.phone)
    s.email = data.get('email', s.email)
    s.address = data.get('address', s.address)
    s.notes = data.get('notes', s.notes)
    db.session.commit()
    return jsonify(s.to_dict())

@suppliers_bp.route('/<int:sid>', methods=['DELETE'])
def delete_supplier(sid):
    s = Supplier.query.get_or_404(sid)
    db.session.delete(s)
    db.session.commit()
    return jsonify({'success': True})

@returns_bp.route('/', methods=['GET'])
def get_returns():
    status = request.args.get('status')
    search = request.args.get('search', '').strip()
    query = Return.query
    if status: query = query.filter_by(status=status)
    if search: query = query.filter(Return.customer_name.ilike(f'%{search}%') | Return.reason.ilike(f'%{search}%'))
    return jsonify([r.to_dict() for r in query.order_by(Return.created_at.desc()).all()])

@returns_bp.route('/', methods=['POST'])
def create_return():
    data = request.get_json()
    if not data.get('customer_name'): return jsonify({'error': 'Customer name required'}), 400
    if not data.get('reason'): return jsonify({'error': 'Reason required'}), 400
    r = Return(sale_id=data.get('sale_id'), customer_name=data['customer_name'], return_type=data.get('return_type', 'Refund'), reason=data['reason'], refund_amount=float(data.get('refund_amount', 0)), restock=data.get('restock', True), status=data.get('status', 'Pending'), notes=data.get('notes', ''), date=data.get('date'))
    db.session.add(r)
    db.session.commit()
    return jsonify(r.to_dict()), 201

@returns_bp.route('/<int:rid>', methods=['PUT'])
def update_return(rid):
    r = Return.query.get_or_404(rid)
    data = request.get_json()
    r.customer_name = data.get('customer_name', r.customer_name)
    r.return_type = data.get('return_type', r.return_type)
    r.reason = data.get('reason', r.reason)
    r.refund_amount = float(data.get('refund_amount', r.refund_amount))
    r.restock = data.get('restock', r.restock)
    r.status = data.get('status', r.status)
    r.notes = data.get('notes', r.notes)
    r.date = data.get('date', r.date)
    db.session.commit()
    return jsonify(r.to_dict())

@returns_bp.route('/<int:rid>/status', methods=['PATCH'])
def update_return_status(rid):
    r = Return.query.get_or_404(rid)
    data = request.get_json()
    r.status = data.get('status', r.status)
    db.session.commit()
    return jsonify(r.to_dict())

@returns_bp.route('/<int:rid>', methods=['DELETE'])
def delete_return(rid):
    r = Return.query.get_or_404(rid)
    db.session.delete(r)
    db.session.commit()
    return jsonify({'success': True})
