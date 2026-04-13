from flask import Blueprint, request, jsonify
from models import db, Sale, SaleItem, PurchaseOrder, Debt, DebtPayment, Customer, Supplier, Return
from datetime import datetime, date

history_bp = Blueprint('history', __name__, url_prefix='/api/history')


@history_bp.route('/', methods=['GET'])
def get_history():
    """
    Global activity history — sales, purchases, debts, payments, returns.
    Supports filtering by type, search, date range, and pagination.
    """
    type_filter  = request.args.get('type', 'all')   # all|sale|purchase|debt|payment|return
    search       = request.args.get('search', '').strip().lower()
    date_from    = request.args.get('date_from')
    date_to      = request.args.get('date_to')
    page         = int(request.args.get('page', 1))
    per_page     = int(request.args.get('per_page', 30))

    timeline = []

    # ── Sales ──────────────────────────────────────────────────────────────
    if type_filter in ('all', 'sale'):
        sales = Sale.query.all()
        for s in sales:
            party = s.customer.name if s.customer else 'Walk-in'
            items_summary = ', '.join(
                f"{i.quantity}x {i.product.name if i.product else '?'}"
                for i in s.items[:3]
            )
            if len(s.items) > 3:
                items_summary += f' +{len(s.items)-3} more'
            timeline.append({
                'type': 'sale',
                'date': s.created_at.isoformat(),
                'party': party,
                'party_type': 'customer',
                'title': f'Invoice {s.invoice_number}',
                'amount': s.total,
                'detail': items_summary,
                'status': s.status,
                'payment_method': s.payment_method,
                'reference_id': s.id,
            })

    # ── Purchase Orders ────────────────────────────────────────────────────
    if type_filter in ('all', 'purchase'):
        orders = PurchaseOrder.query.all()
        for o in orders:
            items_summary = ', '.join(
                f"{i.qty}x {i.product_name}" for i in o.items[:3]
            )
            if len(o.items) > 3:
                items_summary += f' +{len(o.items)-3} more'
            timeline.append({
                'type': 'purchase',
                'date': o.created_at.isoformat(),
                'party': o.supplier_name,
                'party_type': 'supplier',
                'title': f'PO #{o.id}',
                'amount': o.total,
                'detail': items_summary,
                'status': o.status,
                'payment_method': None,
                'reference_id': o.id,
            })

    # ── Debts ──────────────────────────────────────────────────────────────
    if type_filter in ('all', 'debt'):
        debts = Debt.query.all()
        for d in debts:
            timeline.append({
                'type': 'debt',
                'date': d.created_at.isoformat(),
                'party': d.party_name,
                'party_type': 'supplier' if d.debt_type == 'purchase' else 'customer',
                'title': f'Debt — {d.debt_type}',
                'amount': d.total_amount,
                'detail': f'Remaining: {d.remaining_amount} · {d.notes or ""}',
                'status': d.status,
                'payment_method': None,
                'reference_id': d.id,
            })

    # ── Debt Payments ──────────────────────────────────────────────────────
    if type_filter in ('all', 'payment'):
        payments = DebtPayment.query.all()
        for p in payments:
            debt = p.debt
            timeline.append({
                'type': 'payment',
                'date': p.created_at.isoformat(),
                'party': debt.party_name if debt else '—',
                'party_type': 'supplier' if (debt and debt.debt_type == 'purchase') else 'customer',
                'title': 'Debt Payment',
                'amount': p.amount,
                'detail': p.note or '',
                'status': 'paid',
                'payment_method': 'cash',
                'reference_id': p.id,
            })

    # ── Returns ────────────────────────────────────────────────────────────
    if type_filter in ('all', 'return'):
        returns = Return.query.all()
        for r in returns:
            timeline.append({
                'type': 'return',
                'date': r.created_at.isoformat(),
                'party': r.customer_name,
                'party_type': 'customer',
                'title': f'Return — {r.return_type}',
                'amount': r.refund_amount,
                'detail': r.reason,
                'status': r.status,
                'payment_method': None,
                'reference_id': r.id,
            })

    # ── Filter by search ───────────────────────────────────────────────────
    if search:
        timeline = [
            e for e in timeline
            if search in e['party'].lower()
            or search in e['title'].lower()
            or search in (e['detail'] or '').lower()
        ]

    # ── Filter by date ─────────────────────────────────────────────────────
    if date_from:
        timeline = [e for e in timeline if e['date'] >= date_from]
    if date_to:
        timeline = [e for e in timeline if e['date'] <= date_to + 'T23:59:59']

    # ── Sort ───────────────────────────────────────────────────────────────
    timeline.sort(key=lambda x: x['date'], reverse=True)

    # ── Summary ────────────────────────────────────────────────────────────
    total_sales     = sum(e['amount'] for e in timeline if e['type'] == 'sale')
    total_purchases = sum(e['amount'] for e in timeline if e['type'] == 'purchase')
    total_payments  = sum(e['amount'] for e in timeline if e['type'] == 'payment')
    total_returns   = sum(e['amount'] for e in timeline if e['type'] == 'return')

    # ── Paginate ───────────────────────────────────────────────────────────
    total = len(timeline)
    start = (page - 1) * per_page
    end   = start + per_page
    paginated = timeline[start:end]

    return jsonify({
        'timeline': paginated,
        'total': total,
        'page': page,
        'pages': (total + per_page - 1) // per_page,
        'summary': {
            'total_sales': round(total_sales, 2),
            'total_purchases': round(total_purchases, 2),
            'total_payments': round(total_payments, 2),
            'total_returns': round(total_returns, 2),
            'net': round(total_sales - total_purchases, 2),
        }
    })