from flask import Blueprint, request, jsonify
from models import db, Sale, SaleItem, Product, Customer
from datetime import datetime
import random
import string

pos_bp = Blueprint('pos', __name__, url_prefix='/api/pos')


def generate_invoice_number():
    date_str = datetime.utcnow().strftime('%Y%m%d')
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f'INV-{date_str}-{random_part}'


@pos_bp.route('/checkout', methods=['POST'])
def checkout():
    data = request.get_json()
    items_data = data.get('items', [])
    if not items_data:
        return jsonify({'error': 'No items in cart'}), 400
    subtotal = 0.0
    validated_items = []
    for item in items_data:
        product = Product.query.get(item['product_id'])
        if not product:
            return jsonify({'error': f'Product {item["product_id"]} not found'}), 404
        if product.stock < item['quantity']:
            return jsonify({'error': f'Insufficient stock for {product.name}. Available: {product.stock}'}), 400
        unit_price = item.get('unit_price', product.price)
        item_discount = item.get('discount', 0.0)
        item_total = (unit_price * item['quantity']) - item_discount
        subtotal += item_total
        validated_items.append({'product': product, 'quantity': item['quantity'], 'unit_price': unit_price, 'discount': item_discount, 'total': item_total})
    sale_discount = data.get('discount', 0.0)
    tax = data.get('tax', 0.0)
    total = (subtotal - sale_discount) + tax
    amount_paid = data.get('amount_paid', total)
    change_given = max(0.0, amount_paid - total)
    buyer_name = data.get('buyer_name', None)
    sale = Sale(
        invoice_number=generate_invoice_number(),
        customer_id=data.get('customer_id'),
        buyer_name=buyer_name,
        subtotal=subtotal, discount=sale_discount, tax=tax, total=total,
        payment_method=data.get('payment_method', 'cash'),
        amount_paid=amount_paid, change_given=change_given,
        note=data.get('note', ''), status='completed',
    )
    db.session.add(sale)
    db.session.flush()
    for item_data in validated_items:
        sale_item = SaleItem(
            sale_id=sale.id, product_id=item_data['product'].id,
            quantity=item_data['quantity'], unit_price=item_data['unit_price'],
            discount=item_data['discount'], total=item_data['total'],
        )
        db.session.add(sale_item)
        item_data['product'].stock -= item_data['quantity']
    if sale.customer_id:
        customer = Customer.query.get(sale.customer_id)
        if customer:
            customer.total_spent += total
    db.session.commit()

    # Build response manually to ensure buyer_name is always included
    sale_dict = sale.to_dict(include_items=True)
    sale_dict['buyer_name'] = sale.buyer_name

    return jsonify({'success': True, 'sale': sale_dict}), 201


@pos_bp.route('/products', methods=['GET'])
def get_products():
    query = Product.query.filter_by(is_active=True)
    search = request.args.get('search', '').strip()
    category_id = request.args.get('category_id')
    if search:
        query = query.filter(Product.name.ilike(f'%{search}%') | Product.barcode.ilike(f'%{search}%'))
    if category_id:
        query = query.filter_by(category_id=int(category_id))
    return jsonify([p.to_dict() for p in query.order_by(Product.name).all()])


@pos_bp.route('/products/barcode/<barcode>', methods=['GET'])
def get_product_by_barcode(barcode):
    product = Product.query.filter_by(barcode=barcode, is_active=True).first()
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify(product.to_dict())


@pos_bp.route('/sales', methods=['GET'])
def get_sales():
    query = Sale.query
    start = request.args.get('start')
    end = request.args.get('end')
    payment_method = request.args.get('payment_method')
    status = request.args.get('status')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    if start:
        query = query.filter(Sale.created_at >= datetime.fromisoformat(start))
    if end:
        query = query.filter(Sale.created_at <= datetime.fromisoformat(end))
    if payment_method:
        query = query.filter_by(payment_method=payment_method)
    if status:
        query = query.filter_by(status=status)
    paginated = query.order_by(Sale.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({'sales': [s.to_dict() for s in paginated.items], 'total': paginated.total, 'pages': paginated.pages, 'page': page})


@pos_bp.route('/sales/<int:sale_id>', methods=['GET'])
def get_sale(sale_id):
    return jsonify(Sale.query.get_or_404(sale_id).to_dict(include_items=True))


@pos_bp.route('/sales/<int:sale_id>/refund', methods=['POST'])
def refund_sale(sale_id):
    sale = Sale.query.get_or_404(sale_id)
    if sale.status == 'refunded':
        return jsonify({'error': 'Sale already refunded'}), 400
    for item in sale.items:
        item.product.stock += item.quantity
    if sale.customer_id and sale.customer:
        sale.customer.total_spent -= sale.total
    sale.status = 'refunded'
    db.session.commit()
    return jsonify({'success': True, 'sale': sale.to_dict()})