from flask import Blueprint, request, jsonify
from models import db, Product, Customer, Expense, Category, Sale, SaleItem, Debt, DebtPayment
from datetime import date

products_bp = Blueprint('products', __name__, url_prefix='/api/products')
customers_bp = Blueprint('customers', __name__, url_prefix='/api/customers')
expenses_bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')
categories_bp = Blueprint('categories', __name__, url_prefix='/api/categories')


# ─── CATEGORIES ──────────────────────────────────────────────────────────────

@categories_bp.route('/', methods=['GET'])
def get_categories():
    cats = Category.query.order_by(Category.name).all()
    return jsonify([c.to_dict() for c in cats])

@categories_bp.route('/', methods=['POST'])
def create_category():
    data = request.get_json()
    if not data.get('name'):
        return jsonify({'error': 'Name required'}), 400
    cat = Category(name=data['name'])
    db.session.add(cat)
    db.session.commit()
    return jsonify(cat.to_dict()), 201

@categories_bp.route('/<int:cat_id>', methods=['PUT'])
def update_category(cat_id):
    cat = Category.query.get_or_404(cat_id)
    data = request.get_json()
    cat.name = data.get('name', cat.name)
    db.session.commit()
    return jsonify(cat.to_dict())

@categories_bp.route('/<int:cat_id>', methods=['DELETE'])
def delete_category(cat_id):
    cat = Category.query.get_or_404(cat_id)
    db.session.delete(cat)
    db.session.commit()
    return jsonify({'success': True})


# ─── PRODUCTS ────────────────────────────────────────────────────────────────

@products_bp.route('/', methods=['GET'])
def get_products():
    query = Product.query
    search = request.args.get('search', '').strip()
    category_id = request.args.get('category_id')
    low_stock = request.args.get('low_stock')
    if search:
        query = query.filter(Product.name.ilike(f'%{search}%') | Product.barcode.ilike(f'%{search}%'))
    if category_id:
        query = query.filter_by(category_id=int(category_id))
    if low_stock == 'true':
        query = query.filter(Product.stock <= 5)
    products = query.order_by(Product.name).all()
    return jsonify([p.to_dict() for p in products])

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    return jsonify(Product.query.get_or_404(product_id).to_dict())

@products_bp.route('/', methods=['POST'])
def create_product():
    data = request.get_json()
    if not data.get('name') or data.get('price') is None:
        return jsonify({'error': 'Name and price required'}), 400

    # ── Check if product already exists (by barcode first, then by name) ──
    existing = None
    if data.get('barcode') and data['barcode'].strip():
        existing = Product.query.filter_by(
            barcode=data['barcode'].strip(), is_active=True
        ).first()
    if not existing and data.get('name') and data['name'].strip():
        existing = Product.query.filter(
            Product.name.ilike(data['name'].strip()), Product.is_active == True
        ).first()

    if existing:
        new_units      = int(data.get('stock', 0))
        new_cost       = float(data.get('cost', existing.cost))
        total_units    = existing.stock + new_units

        # ── Weighted average cost ──
        old_total_cost = existing.cost * existing.stock
        new_total_cost = new_cost * new_units
        avg_cost = (old_total_cost + new_total_cost) / total_units if total_units > 0 else new_cost

        # ── Keep same profit margin ratio → recalculate sell price ──
        if existing.cost > 0:
            margin_ratio = existing.price / existing.cost
            new_price    = avg_cost * margin_ratio
        else:
            new_price = existing.price

        existing.cost  = round(avg_cost, 2)
        existing.price = round(new_price, 2)
        existing.stock = total_units
        db.session.commit()

        result = existing.to_dict()
        result['_merged']      = True
        result['_avg_cost']    = round(avg_cost, 2)
        result['_new_price']   = round(new_price, 2)
        result['_added_units'] = new_units
        return jsonify(result), 200

    # ── New product — create normally ──
    product = Product(
        name=data['name'], barcode=data.get('barcode'),
        price=float(data['price']), cost=float(data.get('cost', 0)),
        stock=int(data.get('stock', 0)), category_id=data.get('category_id'),
        image_url=data.get('image_url'),
    )
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict()), 201

@products_bp.route('/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json()
    product.name        = data.get('name', product.name)
    product.barcode     = data.get('barcode', product.barcode)
    product.price       = float(data.get('price', product.price))
    product.cost        = float(data.get('cost', product.cost))
    product.stock       = int(data.get('stock', product.stock))
    product.category_id = data.get('category_id', product.category_id)
    product.image_url   = data.get('image_url', product.image_url)
    product.is_active   = data.get('is_active', product.is_active)
    db.session.commit()
    return jsonify(product.to_dict())

@products_bp.route('/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    product.is_active = False
    db.session.commit()
    return jsonify({'success': True})

@products_bp.route('/<int:product_id>/adjust-stock', methods=['POST'])
def adjust_stock(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json()
    adjustment = int(data.get('adjustment', 0))
    product.stock = max(0, product.stock + adjustment)
    db.session.commit()
    return jsonify(product.to_dict())


# ─── CUSTOMERS ───────────────────────────────────────────────────────────────

@customers_bp.route('/', methods=['GET'])
def get_customers():
    search = request.args.get('search', '').strip()
    query = Customer.query
    if search:
        query = query.filter(
            Customer.name.ilike(f'%{search}%') |
            Customer.phone.ilike(f'%{search}%')
        )
    customers = query.order_by(Customer.name).all()
    return jsonify([c.to_dict() for c in customers])

@customers_bp.route('/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    return jsonify(Customer.query.get_or_404(customer_id).to_dict())

@customers_bp.route('/', methods=['POST'])
def create_customer():
    data = request.get_json()
    if not data.get('name'):
        return jsonify({'error': 'Name required'}), 400
    customer = Customer(
        name=data['name'], phone=data.get('phone'),
        email=data.get('email'), address=data.get('address'),
    )
    db.session.add(customer)
    db.session.commit()
    return jsonify(customer.to_dict()), 201

@customers_bp.route('/<int:customer_id>', methods=['PUT'])
def update_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    data = request.get_json()
    customer.name    = data.get('name', customer.name)
    customer.phone   = data.get('phone', customer.phone)
    customer.email   = data.get('email', customer.email)
    customer.address = data.get('address', customer.address)
    db.session.commit()
    return jsonify(customer.to_dict())

@customers_bp.route('/<int:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    db.session.delete(customer)
    db.session.commit()
    return jsonify({'success': True})


@customers_bp.route('/<int:customer_id>/history', methods=['GET'])
def get_customer_history(customer_id):
    """Full activity history for a customer"""
    customer = Customer.query.get_or_404(customer_id)

    # ── Sales ──
    sales = Sale.query.filter_by(customer_id=customer_id).order_by(Sale.created_at.desc()).all()
    total_revenue = sum(s.total for s in sales)
    total_cost = sum(
        sum((item.product.cost if item.product else 0) * item.quantity for item in s.items)
        for s in sales
    )
    total_profit = total_revenue - total_cost
    profit_margin = round((total_profit / total_revenue * 100), 1) if total_revenue > 0 else 0

    # ── Debts ──
    debts = Debt.query.filter_by(debt_type='sale', party_id=customer_id).all()
    if not debts:
        debts = Debt.query.filter_by(debt_type='sale', party_name=customer.name).all()
    today = date.today().isoformat()
    total_debt = sum(d.remaining_amount for d in debts if d.status != 'paid')
    total_paid_debt = sum(d.paid_amount for d in debts)

    # ── Build timeline ──
    timeline = []

    for sale in sales:
        items_summary = ', '.join(
            f"{item.quantity}x {item.product.name if item.product else '?'}"
            for item in sale.items[:3]
        )
        if len(sale.items) > 3:
            items_summary += f' +{len(sale.items) - 3} more'
        timeline.append({
            'type': 'sale',
            'date': sale.created_at.isoformat(),
            'title': f'Invoice {sale.invoice_number}',
            'amount': sale.total,
            'detail': items_summary,
            'payment_method': sale.payment_method,
            'status': sale.status,
        })

    for debt in debts:
        timeline.append({
            'type': 'debt_created',
            'date': debt.created_at.isoformat(),
            'title': 'Debt Created',
            'amount': debt.total_amount,
            'detail': debt.notes or '',
            'status': debt.status,
        })
        for payment in debt.payments:
            timeline.append({
                'type': 'debt_payment',
                'date': payment.created_at.isoformat(),
                'title': 'Debt Payment',
                'amount': payment.amount,
                'detail': payment.note or '',
                'status': 'paid',
            })

    timeline.sort(key=lambda x: x['date'], reverse=True)

    return jsonify({
        'customer': customer.to_dict(),
        'summary': {
            'total_invoices': len(sales),
            'total_revenue': round(total_revenue, 2),
            'total_cost': round(total_cost, 2),
            'total_profit': round(total_profit, 2),
            'profit_margin': profit_margin,
            'total_debt': round(total_debt, 2),
            'total_paid_debt': round(total_paid_debt, 2),
            'active_debts': len([d for d in debts if d.status != 'paid']),
        },
        'timeline': timeline,
    })


# ─── EXPENSES ────────────────────────────────────────────────────────────────

@expenses_bp.route('/', methods=['GET'])
def get_expenses():
    expenses = Expense.query.order_by(Expense.created_at.desc()).all()
    return jsonify([e.to_dict() for e in expenses])

@expenses_bp.route('/', methods=['POST'])
def create_expense():
    data = request.get_json()
    if not data.get('title') or data.get('amount') is None:
        return jsonify({'error': 'Title and amount required'}), 400
    expense = Expense(
        title=data['title'], amount=float(data['amount']),
        category=data.get('category'), date=data.get('date'),
        vendor=data.get('vendor'), recurring=data.get('recurring', False),
        note=data.get('notes') or data.get('note'),
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify(expense.to_dict()), 201

@expenses_bp.route('/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    expense = Expense.query.get_or_404(expense_id)
    data = request.get_json()
    expense.title     = data.get('title', expense.title)
    expense.amount    = float(data.get('amount', expense.amount))
    expense.category  = data.get('category', expense.category)
    expense.date      = data.get('date', expense.date)
    expense.vendor    = data.get('vendor', expense.vendor)
    expense.recurring = data.get('recurring', expense.recurring)
    expense.note      = data.get('notes') or data.get('note') or expense.note
    db.session.commit()
    return jsonify(expense.to_dict())

@expenses_bp.route('/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    expense = Expense.query.get_or_404(expense_id)
    db.session.delete(expense)
    db.session.commit()
    return jsonify({'success': True})


# ─── RECURRING EXPENSES ───────────────────────────────────────────────────────

@expenses_bp.route('/recurring', methods=['GET'])
def get_recurring():
    recurring = Expense.query.filter_by(recurring=True).order_by(Expense.title).all()
    return jsonify([e.to_dict() for e in recurring])

@expenses_bp.route('/generate-monthly', methods=['POST'])
def generate_monthly():
    today = date.today()
    current_month = today.strftime('%Y-%m')
    first_day = today.strftime('%Y-%m-01')
    templates = Expense.query.filter_by(recurring=True).all()
    if not templates:
        return jsonify({'generated': 0, 'expenses': [], 'message': 'No recurring templates found'}), 200
    generated = []
    skipped = 0
    for tmpl in templates:
        existing = Expense.query.filter(
            Expense.title == tmpl.title,
            Expense.recurring == False,
            Expense.date.like(f'{current_month}%')
        ).first()
        if existing:
            skipped += 1
            continue
        new_expense = Expense(
            title=tmpl.title, amount=tmpl.amount, category=tmpl.category,
            date=first_day, vendor=tmpl.vendor, recurring=False,
            note=f'Auto-generated from recurring template — {current_month}',
        )
        db.session.add(new_expense)
        generated.append(new_expense)
    db.session.commit()
    return jsonify({
        'generated': len(generated), 'skipped': skipped,
        'month': current_month, 'expenses': [e.to_dict() for e in generated],
    }), 201

@expenses_bp.route('/check-monthly', methods=['GET'])
def check_monthly():
    current_month = date.today().strftime('%Y-%m')
    templates = Expense.query.filter_by(recurring=True).all()
    result = []
    for tmpl in templates:
        existing = Expense.query.filter(
            Expense.title == tmpl.title,
            Expense.recurring == False,
            Expense.date.like(f'{current_month}%')
        ).first()
        result.append({
            'title': tmpl.title, 'amount': tmpl.amount,
            'category': tmpl.category, 'generated': existing is not None,
        })
    total_templates = len(templates)
    total_generated = sum(1 for r in result if r['generated'])
    return jsonify({
        'month': current_month, 'total_templates': total_templates,
        'total_generated': total_generated,
        'all_generated': total_generated == total_templates,
        'details': result,
    })