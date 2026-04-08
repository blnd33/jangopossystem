from flask import Blueprint, request, jsonify
from models import db, Product, Customer, Expense, Category

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

    product = Product(
        name=data['name'],
        barcode=data.get('barcode'),
        price=float(data['price']),
        cost=float(data.get('cost', 0)),
        stock=int(data.get('stock', 0)),
        category_id=data.get('category_id'),
        image_url=data.get('image_url'),
    )
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict()), 201

@products_bp.route('/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json()
    product.name = data.get('name', product.name)
    product.barcode = data.get('barcode', product.barcode)
    product.price = float(data.get('price', product.price))
    product.cost = float(data.get('cost', product.cost))
    product.stock = int(data.get('stock', product.stock))
    product.category_id = data.get('category_id', product.category_id)
    product.image_url = data.get('image_url', product.image_url)
    product.is_active = data.get('is_active', product.is_active)
    db.session.commit()
    return jsonify(product.to_dict())

@products_bp.route('/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    product.is_active = False  # soft delete
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
        name=data['name'],
        phone=data.get('phone'),
        email=data.get('email'),
        address=data.get('address'),
    )
    db.session.add(customer)
    db.session.commit()
    return jsonify(customer.to_dict()), 201

@customers_bp.route('/<int:customer_id>', methods=['PUT'])
def update_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    data = request.get_json()
    customer.name = data.get('name', customer.name)
    customer.phone = data.get('phone', customer.phone)
    customer.email = data.get('email', customer.email)
    customer.address = data.get('address', customer.address)
    db.session.commit()
    return jsonify(customer.to_dict())

@customers_bp.route('/<int:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    db.session.delete(customer)
    db.session.commit()
    return jsonify({'success': True})


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
        title=data['title'],
        amount=float(data['amount']),
        category=data.get('category'),
        note=data.get('note'),
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify(expense.to_dict()), 201

@expenses_bp.route('/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    expense = Expense.query.get_or_404(expense_id)
    db.session.delete(expense)
    db.session.commit()
    return jsonify({'success': True})