from flask import Blueprint, request, jsonify
from models import db, Delivery

delivery_bp = Blueprint('delivery', __name__, url_prefix='/api/deliveries')


@delivery_bp.route('/', methods=['GET'])
def get_deliveries():
    status = request.args.get('status')
    search = request.args.get('search', '').strip()
    query = Delivery.query
    if status:
        query = query.filter_by(status=status)
    if search:
        query = query.filter(
            Delivery.customer_name.ilike(f'%{search}%') |
            Delivery.delivery_address.ilike(f'%{search}%')
        )
    deliveries = query.order_by(Delivery.created_at.desc()).all()
    return jsonify([d.to_dict() for d in deliveries])


@delivery_bp.route('/', methods=['POST'])
def create_delivery():
    data = request.get_json()
    if not data.get('customer_name'):
        return jsonify({'error': 'Customer name required'}), 400
    if not data.get('delivery_address'):
        return jsonify({'error': 'Delivery address required'}), 400
    delivery = Delivery(
        customer_id=data.get('customer_id'),
        customer_name=data['customer_name'],
        delivery_address=data['delivery_address'],
        scheduled_date=data.get('scheduled_date'),
        driver_name=data.get('driver_name', ''),
        status=data.get('status', 'Pending'),
        installation_required=data.get('installation_required', False),
        notes=data.get('notes', ''),
    )
    db.session.add(delivery)
    db.session.commit()
    return jsonify(delivery.to_dict()), 201


@delivery_bp.route('/<int:delivery_id>', methods=['PUT'])
def update_delivery(delivery_id):
    delivery = Delivery.query.get_or_404(delivery_id)
    data = request.get_json()
    delivery.customer_name = data.get('customer_name', delivery.customer_name)
    delivery.delivery_address = data.get('delivery_address', delivery.delivery_address)
    delivery.scheduled_date = data.get('scheduled_date', delivery.scheduled_date)
    delivery.driver_name = data.get('driver_name', delivery.driver_name)
    delivery.status = data.get('status', delivery.status)
    delivery.installation_required = data.get('installation_required', delivery.installation_required)
    delivery.notes = data.get('notes', delivery.notes)
    db.session.commit()
    return jsonify(delivery.to_dict())


@delivery_bp.route('/<int:delivery_id>/status', methods=['PATCH'])
def update_status(delivery_id):
    delivery = Delivery.query.get_or_404(delivery_id)
    data = request.get_json()
    delivery.status = data.get('status', delivery.status)
    db.session.commit()
    return jsonify(delivery.to_dict())


@delivery_bp.route('/<int:delivery_id>', methods=['DELETE'])
def delete_delivery(delivery_id):
    delivery = Delivery.query.get_or_404(delivery_id)
    db.session.delete(delivery)
    db.session.commit()
    return jsonify({'success': True})