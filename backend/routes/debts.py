from flask import Blueprint, request, jsonify
from models import db, Debt, DebtPayment
from datetime import datetime, date

debts_bp = Blueprint('debts', __name__)


# ── GET all debts ──────────────────────────────────────────────
@debts_bp.route('/api/debts', methods=['GET'])
def get_debts():
    debt_type = request.args.get('type')        # 'purchase' or 'sale'
    status = request.args.get('status')         # 'unpaid', 'partial', 'paid'

    query = Debt.query
    if debt_type:
        query = query.filter_by(debt_type=debt_type)
    if status:
        query = query.filter_by(status=status)

    debts = query.order_by(Debt.created_at.desc()).all()

    # calculate overdue
    today = date.today().isoformat()
    result = []
    for d in debts:
        data = d.to_dict()
        data['overdue'] = bool(d.due_date and d.due_date < today and d.status != 'paid')
        result.append(data)

    return jsonify(result)


# ── GET single debt ────────────────────────────────────────────
@debts_bp.route('/api/debts/<int:debt_id>', methods=['GET'])
def get_debt(debt_id):
    debt = Debt.query.get_or_404(debt_id)
    data = debt.to_dict()
    today = date.today().isoformat()
    data['overdue'] = bool(debt.due_date and debt.due_date < today and debt.status != 'paid')
    return jsonify(data)


# ── CREATE debt manually ───────────────────────────────────────
@debts_bp.route('/api/debts', methods=['POST'])
def create_debt():
    data = request.get_json()
    debt = Debt(
        debt_type=data['debt_type'],
        reference_id=data.get('reference_id'),
        party_name=data['party_name'],
        party_id=data.get('party_id'),
        total_amount=float(data['total_amount']),
        paid_amount=float(data.get('paid_amount', 0)),
        due_date=data.get('due_date'),
        notes=data.get('notes'),
        status='paid' if float(data.get('paid_amount', 0)) >= float(data['total_amount'])
               else 'partial' if float(data.get('paid_amount', 0)) > 0
               else 'unpaid',
    )
    db.session.add(debt)
    db.session.commit()
    return jsonify(debt.to_dict()), 201


# ── ADD payment to debt ────────────────────────────────────────
@debts_bp.route('/api/debts/<int:debt_id>/payments', methods=['POST'])
def add_payment(debt_id):
    debt = Debt.query.get_or_404(debt_id)
    data = request.get_json()

    amount = float(data['amount'])
    if amount <= 0:
        return jsonify({'error': 'Amount must be positive'}), 400
    if amount > debt.remaining_amount:
        return jsonify({'error': 'Amount exceeds remaining debt'}), 400

    payment = DebtPayment(
        debt_id=debt_id,
        amount=amount,
        payment_date=data.get('payment_date', date.today().isoformat()),
        note=data.get('note'),
    )
    db.session.add(payment)

    debt.paid_amount = round(debt.paid_amount + amount, 2)
    if debt.paid_amount >= debt.total_amount:
        debt.status = 'paid'
    elif debt.paid_amount > 0:
        debt.status = 'partial'

    db.session.commit()
    return jsonify(debt.to_dict()), 200


# ── UPDATE debt ────────────────────────────────────────────────
@debts_bp.route('/api/debts/<int:debt_id>', methods=['PUT'])
def update_debt(debt_id):
    debt = Debt.query.get_or_404(debt_id)
    data = request.get_json()

    if 'due_date' in data:
        debt.due_date = data['due_date']
    if 'notes' in data:
        debt.notes = data['notes']
    if 'party_name' in data:
        debt.party_name = data['party_name']
    if 'total_amount' in data:
        debt.total_amount = float(data['total_amount'])

    # recalculate status
    if debt.paid_amount >= debt.total_amount:
        debt.status = 'paid'
    elif debt.paid_amount > 0:
        debt.status = 'partial'
    else:
        debt.status = 'unpaid'

    db.session.commit()
    return jsonify(debt.to_dict())


# ── DELETE debt ────────────────────────────────────────────────
@debts_bp.route('/api/debts/<int:debt_id>', methods=['DELETE'])
def delete_debt(debt_id):
    debt = Debt.query.get_or_404(debt_id)
    db.session.delete(debt)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


# ── SUMMARY stats ──────────────────────────────────────────────
@debts_bp.route('/api/debts/summary', methods=['GET'])
def debts_summary():
    today = date.today().isoformat()

    all_debts = Debt.query.filter(Debt.status != 'paid').all()

    purchase_total = sum(d.remaining_amount for d in all_debts if d.debt_type == 'purchase')
    sale_total = sum(d.remaining_amount for d in all_debts if d.debt_type == 'sale')
    overdue_count = sum(1 for d in all_debts if d.due_date and d.due_date < today)

    return jsonify({
        'purchase_debt': round(purchase_total, 2),
        'sale_debt': round(sale_total, 2),
        'total_debt': round(purchase_total + sale_total, 2),
        'overdue_count': overdue_count,
    })