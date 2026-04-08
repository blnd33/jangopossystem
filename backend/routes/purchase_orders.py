from flask import Blueprint, request, jsonify
from models import db, PurchaseOrder, PurchaseOrderItem, Product

po_bp = Blueprint('purchase_orders', __name__, url_prefix='/api/purchase-orders')

@po_bp.route('/', methods=['GET'])
def get_orders():
    status = request.args.get('status')
    search = request.args.get('search', '').strip()
    query = PurchaseOrder.query
    if status: query = query.filter_by(status=status)
    if search: query = query.filter(PurchaseOrder.supplier_name.ilike(f'%{search}%'))
    return jsonify([o.to_dict() for o in query.order_by(PurchaseOrder.created_at.desc()).all()])

@po_bp.route('/', methods=['POST'])
def create_order():
    data = request.get_json()
    if not data.get('supplier_name'): return jsonify({'error': 'Supplier name required'}), 400
    items_data = data.get('items', [])
    if not items_data: return jsonify({'error': 'Items required'}), 400
    total = sum(float(i.get('unit_cost', 0)) * int(i.get('qty', 1)) for i in items_data)
    order = PurchaseOrder(supplier_name=data['supplier_name'], order_date=data.get('order_date'), expected_date=data.get('expected_date'), status=data.get('status', 'Draft'), notes=data.get('notes', ''), total=total)
    db.session.add(order)
    db.session.flush()
    for item in items_data:
        db.session.add(PurchaseOrderItem(order_id=order.id, product_id=item.get('product_id') or None, product_name=item.get('product_name', ''), qty=int(item.get('qty', 1)), unit_cost=float(item.get('unit_cost', 0))))
    db.session.commit()
    return jsonify(order.to_dict()), 201

@po_bp.route('/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    order = PurchaseOrder.query.get_or_404(order_id)
    data = request.get_json()
    order.supplier_name = data.get('supplier_name', order.supplier_name)
    order.order_date = data.get('order_date', order.order_date)
    order.expected_date = data.get('expected_date', order.expected_date)
    order.status = data.get('status', order.status)
    order.notes = data.get('notes', order.notes)
    if 'items' in data:
        for item in order.items: db.session.delete(item)
        total = 0
        for item in data['items']:
            poi = PurchaseOrderItem(order_id=order.id, product_id=item.get('product_id') or None, product_name=item.get('product_name', ''), qty=int(item.get('qty', 1)), unit_cost=float(item.get('unit_cost', 0)))
            total += poi.qty * poi.unit_cost
            db.session.add(poi)
        order.total = total
    db.session.commit()
    return jsonify(order.to_dict())

@po_bp.route('/<int:order_id>/status', methods=['PATCH'])
def update_status(order_id):
    order = PurchaseOrder.query.get_or_404(order_id)
    data = request.get_json()
    new_status = data.get('status', order.status)
    if new_status == 'Received' and order.status != 'Received':
        for item in order.items:
            if item.product_id:
                product = Product.query.get(item.product_id)
                if product: product.stock += item.qty
    order.status = new_status
    db.session.commit()
    return jsonify(order.to_dict())

@po_bp.route('/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    order = PurchaseOrder.query.get_or_404(order_id)
    db.session.delete(order)
    db.session.commit()
    return jsonify({'success': True})
