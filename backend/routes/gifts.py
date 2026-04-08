from flask import Blueprint, request, jsonify
from models import db, Gift, GiftMilestone, Customer
from datetime import datetime

gifts_bp = Blueprint('gifts', __name__, url_prefix='/api/gifts')
milestones_bp = Blueprint('milestones', __name__, url_prefix='/api/gift-milestones')

@gifts_bp.route('/', methods=['GET'])
def get_gifts():
    status = request.args.get('status')
    search = request.args.get('search', '').strip()
    query = Gift.query
    if status: query = query.filter_by(status=status)
    if search:
        query = query.filter(Gift.customer_name.ilike(f'%{search}%') | Gift.description.ilike(f'%{search}%'))
    return jsonify([g.to_dict() for g in query.order_by(Gift.created_at.desc()).all()])

@gifts_bp.route('/', methods=['POST'])
def create_gift():
    data = request.get_json()
    if not data.get('customer_name'): return jsonify({'error': 'Customer name required'}), 400
    if not data.get('description'): return jsonify({'error': 'Description required'}), 400
    gift = Gift(
        customer_id=data.get('customer_id'), customer_name=data['customer_name'],
        gift_type=data.get('gift_type', 'product'), description=data['description'],
        gift_value=float(data.get('gift_value', 0)), status=data.get('status', 'Pending'),
        reason=data.get('reason', 'manual'), milestone_id=data.get('milestone_id'),
        notes=data.get('notes', ''), valid_until=data.get('valid_until'), date=data.get('date'),
    )
    db.session.add(gift)
    db.session.commit()
    return jsonify(gift.to_dict()), 201

@gifts_bp.route('/<int:gift_id>/status', methods=['PATCH'])
def update_gift_status(gift_id):
    gift = Gift.query.get_or_404(gift_id)
    data = request.get_json()
    gift.status = data.get('status', gift.status)
    if gift.status == 'Sent': gift.sent_at = datetime.utcnow()
    db.session.commit()
    return jsonify(gift.to_dict())

@gifts_bp.route('/<int:gift_id>', methods=['DELETE'])
def delete_gift(gift_id):
    gift = Gift.query.get_or_404(gift_id)
    db.session.delete(gift)
    db.session.commit()
    return jsonify({'success': True})

@gifts_bp.route('/eligible', methods=['GET'])
def get_eligible_customers():
    milestones = GiftMilestone.query.filter_by(active=True).all()
    customers = Customer.query.all()
    result = []
    for customer in customers:
        spent = customer.total_spent or 0
        gifted_milestone_ids = [g.milestone_id for g in Gift.query.filter_by(customer_id=customer.id).all() if g.status != 'Cancelled' and g.milestone_id]
        eligible = [ms.to_dict() for ms in milestones if spent >= ms.threshold and ms.id not in gifted_milestone_ids]
        if eligible:
            result.append({**customer.to_dict(), 'eligible_milestones': eligible})
    return jsonify(result)

@milestones_bp.route('/', methods=['GET'])
def get_milestones():
    return jsonify([m.to_dict() for m in GiftMilestone.query.order_by(GiftMilestone.threshold).all()])

@milestones_bp.route('/', methods=['POST'])
def create_milestone():
    data = request.get_json()
    if not data.get('threshold'): return jsonify({'error': 'Threshold required'}), 400
    if not data.get('description'): return jsonify({'error': 'Description required'}), 400
    ms = GiftMilestone(threshold=float(data['threshold']), gift_type=data.get('gift_type', 'discount'), gift_value=float(data.get('gift_value', 0)), description=data['description'], active=data.get('active', True))
    db.session.add(ms)
    db.session.commit()
    return jsonify(ms.to_dict()), 201

@milestones_bp.route('/<int:ms_id>/toggle', methods=['PATCH'])
def toggle_milestone(ms_id):
    ms = GiftMilestone.query.get_or_404(ms_id)
    ms.active = not ms.active
    db.session.commit()
    return jsonify(ms.to_dict())

@milestones_bp.route('/<int:ms_id>', methods=['DELETE'])
def delete_milestone(ms_id):
    ms = GiftMilestone.query.get_or_404(ms_id)
    db.session.delete(ms)
    db.session.commit()
    return jsonify({'success': True})
