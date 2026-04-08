from flask import Blueprint, request, jsonify
from models import db, Sale, SaleItem, Product, Customer, Expense
from sqlalchemy import func
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@dashboard_bp.route('/stats', methods=['GET'])
def get_stats():
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def get_period_stats(start):
        result = db.session.query(
            func.count(Sale.id).label('count'),
            func.coalesce(func.sum(Sale.total), 0).label('revenue'),
        ).filter(Sale.created_at >= start, Sale.status == 'completed').first()
        return {'count': result.count, 'revenue': float(result.revenue)}

    today_stats = get_period_stats(today_start)
    week_stats = get_period_stats(week_start)
    month_stats = get_period_stats(month_start)

    total_customers = Customer.query.count()
    low_stock_count = Product.query.filter(Product.stock <= 5, Product.is_active == True).count()
    month_expenses = db.session.query(
        func.coalesce(func.sum(Expense.amount), 0)
    ).filter(Expense.created_at >= month_start).scalar() or 0

    return jsonify({
        'today': today_stats,
        'week': week_stats,
        'month': month_stats,
        'total_customers': total_customers,
        'low_stock_count': low_stock_count,
        'month_expenses': float(month_expenses),
        'month_profit': float(month_stats['revenue']) - float(month_expenses),
    })


@dashboard_bp.route('/sales-chart', methods=['GET'])
def sales_chart():
    days = int(request.args.get('days', 30))
    start_date = datetime.utcnow() - timedelta(days=days)

    results = db.session.query(
        func.date(Sale.created_at).label('date'),
        func.count(Sale.id).label('count'),
        func.coalesce(func.sum(Sale.total), 0).label('revenue'),
    ).filter(
        Sale.created_at >= start_date, Sale.status == 'completed'
    ).group_by(func.date(Sale.created_at)).order_by('date').all()

    return jsonify([
        {'date': str(r.date), 'count': r.count, 'revenue': float(r.revenue)}
        for r in results
    ])


@dashboard_bp.route('/top-products', methods=['GET'])
def top_products():
    limit = int(request.args.get('limit', 10))
    start = request.args.get('start')
    end = request.args.get('end')

    query = db.session.query(
        Product.id,
        Product.name,
        func.sum(SaleItem.quantity).label('qty_sold'),
        func.sum(SaleItem.total).label('revenue'),
    ).join(SaleItem, Product.id == SaleItem.product_id
    ).join(Sale, SaleItem.sale_id == Sale.id
    ).filter(Sale.status == 'completed')

    if start:
        query = query.filter(Sale.created_at >= datetime.fromisoformat(start))
    if end:
        query = query.filter(Sale.created_at <= datetime.fromisoformat(end))

    results = query.group_by(Product.id).order_by(func.sum(SaleItem.quantity).desc()).limit(limit).all()
    return jsonify([
        {'id': r.id, 'name': r.name, 'qty_sold': int(r.qty_sold), 'revenue': float(r.revenue)}
        for r in results
    ])


@dashboard_bp.route('/payment-methods', methods=['GET'])
def payment_methods():
    start = request.args.get('start')
    end = request.args.get('end')

    query = db.session.query(
        Sale.payment_method,
        func.count(Sale.id).label('count'),
        func.sum(Sale.total).label('total'),
    ).filter(Sale.status == 'completed')

    if start:
        query = query.filter(Sale.created_at >= datetime.fromisoformat(start))
    if end:
        query = query.filter(Sale.created_at <= datetime.fromisoformat(end))

    results = query.group_by(Sale.payment_method).all()
    return jsonify([
        {'method': r.payment_method, 'count': r.count, 'total': float(r.total or 0)}
        for r in results
    ])


@dashboard_bp.route('/cash-flow', methods=['GET'])
def cash_flow():
    days = int(request.args.get('days', 30))
    start_date = datetime.utcnow() - timedelta(days=days)

    sales = db.session.query(
        func.date(Sale.created_at).label('date'),
        func.coalesce(func.sum(Sale.total), 0).label('income'),
    ).filter(Sale.created_at >= start_date, Sale.status == 'completed'
    ).group_by(func.date(Sale.created_at)).all()

    expenses = db.session.query(
        func.date(Expense.created_at).label('date'),
        func.coalesce(func.sum(Expense.amount), 0).label('expense'),
    ).filter(Expense.created_at >= start_date
    ).group_by(func.date(Expense.created_at)).all()

    data = {}
    for r in sales:
        data[str(r.date)] = {'date': str(r.date), 'income': float(r.income), 'expense': 0.0}
    for r in expenses:
        key = str(r.date)
        if key not in data:
            data[key] = {'date': key, 'income': 0.0, 'expense': 0.0}
        data[key]['expense'] = float(r.expense)

    return jsonify(sorted(data.values(), key=lambda x: x['date']))