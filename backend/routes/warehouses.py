from flask import Blueprint, request, jsonify
from models import db, Warehouse, WarehouseStock, Product
from datetime import datetime

warehouses_bp = Blueprint('warehouses', __name__, url_prefix='/api/warehouses')


# ── GET all warehouses ─────────────────────────────────────────
@warehouses_bp.route('/', methods=['GET'])
def get_warehouses():
    warehouses = Warehouse.query.filter_by(is_active=True).order_by(Warehouse.name).all()
    return jsonify([w.to_dict() for w in warehouses])


# ── GET single warehouse with stock ───────────────────────────
@warehouses_bp.route('/<int:wid>', methods=['GET'])
def get_warehouse(wid):
    w = Warehouse.query.get_or_404(wid)
    data = w.to_dict()
    data['stock'] = [s.to_dict() for s in w.stock_items]
    return jsonify(data)


# ── CREATE warehouse ───────────────────────────────────────────
@warehouses_bp.route('/', methods=['POST'])
def create_warehouse():
    data = request.get_json()
    if not data.get('name'):
        return jsonify({'error': 'Name required'}), 400
    w = Warehouse(
        name=data['name'],
        location=data.get('location'),
        manager=data.get('manager'),
        notes=data.get('notes'),
    )
    db.session.add(w)
    db.session.commit()
    return jsonify(w.to_dict()), 201


# ── UPDATE warehouse ───────────────────────────────────────────
@warehouses_bp.route('/<int:wid>', methods=['PUT'])
def update_warehouse(wid):
    w = Warehouse.query.get_or_404(wid)
    data = request.get_json()
    w.name = data.get('name', w.name)
    w.location = data.get('location', w.location)
    w.manager = data.get('manager', w.manager)
    w.notes = data.get('notes', w.notes)
    w.is_active = data.get('is_active', w.is_active)
    db.session.commit()
    return jsonify(w.to_dict())


# ── DELETE warehouse ───────────────────────────────────────────
@warehouses_bp.route('/<int:wid>', methods=['DELETE'])
def delete_warehouse(wid):
    w = Warehouse.query.get_or_404(wid)
    w.is_active = False
    db.session.commit()
    return jsonify({'success': True})


# ── ADD / UPDATE stock in warehouse ───────────────────────────
@warehouses_bp.route('/<int:wid>/stock', methods=['POST'])
def add_stock(wid):
    Warehouse.query.get_or_404(wid)
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = int(data.get('quantity', 0))

    if not product_id:
        return jsonify({'error': 'product_id required'}), 400

    product = Product.query.get_or_404(product_id)

    # check if stock record exists
    stock = WarehouseStock.query.filter_by(
        warehouse_id=wid, product_id=product_id
    ).first()

    if stock:
        stock.quantity += quantity
        stock.updated_at = datetime.utcnow()
    else:
        stock = WarehouseStock(
            warehouse_id=wid,
            product_id=product_id,
            quantity=quantity,
            low_stock_alert=data.get('low_stock_alert', product.low_stock_alert or 5),
        )
        db.session.add(stock)

    # also update global product stock
    product.stock = db.session.query(
        db.func.sum(WarehouseStock.quantity)
    ).filter_by(product_id=product_id).scalar() or 0

    db.session.commit()
    return jsonify(stock.to_dict()), 201


# ── SET stock (override) ───────────────────────────────────────
@warehouses_bp.route('/<int:wid>/stock/<int:product_id>', methods=['PUT'])
def set_stock(wid, product_id):
    Warehouse.query.get_or_404(wid)
    data = request.get_json()
    quantity = int(data.get('quantity', 0))

    stock = WarehouseStock.query.filter_by(
        warehouse_id=wid, product_id=product_id
    ).first()

    if stock:
        stock.quantity = quantity
        stock.updated_at = datetime.utcnow()
    else:
        product = Product.query.get_or_404(product_id)
        stock = WarehouseStock(
            warehouse_id=wid, product_id=product_id,
            quantity=quantity,
            low_stock_alert=data.get('low_stock_alert', product.low_stock_alert or 5),
        )
        db.session.add(stock)

    # update global product stock
    product = Product.query.get(product_id)
    if product:
        product.stock = db.session.query(
            db.func.sum(WarehouseStock.quantity)
        ).filter_by(product_id=product_id).scalar() or 0

    db.session.commit()
    return jsonify(stock.to_dict())


# ── REMOVE product from warehouse ─────────────────────────────
@warehouses_bp.route('/<int:wid>/stock/<int:product_id>', methods=['DELETE'])
def remove_stock(wid, product_id):
    stock = WarehouseStock.query.filter_by(
        warehouse_id=wid, product_id=product_id
    ).first_or_404()
    db.session.delete(stock)

    # update global product stock
    product = Product.query.get(product_id)
    if product:
        product.stock = db.session.query(
            db.func.sum(WarehouseStock.quantity)
        ).filter_by(product_id=product_id).scalar() or 0

    db.session.commit()
    return jsonify({'success': True})


# ── GET all stock for a product across warehouses ─────────────
@warehouses_bp.route('/product/<int:product_id>', methods=['GET'])
def get_product_stock(product_id):
    stocks = WarehouseStock.query.filter_by(product_id=product_id).all()
    total = sum(s.quantity for s in stocks)
    return jsonify({
        'product_id': product_id,
        'total_quantity': total,
        'warehouses': [s.to_dict() for s in stocks],
    })


# ── TRANSFER stock between warehouses ─────────────────────────
@warehouses_bp.route('/transfer', methods=['POST'])
def transfer_stock():
    data = request.get_json()
    from_wid = data.get('from_warehouse_id')
    to_wid = data.get('to_warehouse_id')
    product_id = data.get('product_id')
    quantity = int(data.get('quantity', 0))

    if not all([from_wid, to_wid, product_id, quantity > 0]):
        return jsonify({'error': 'from_warehouse_id, to_warehouse_id, product_id, quantity required'}), 400

    if from_wid == to_wid:
        return jsonify({'error': 'Cannot transfer to same warehouse'}), 400

    from_stock = WarehouseStock.query.filter_by(
        warehouse_id=from_wid, product_id=product_id
    ).first()

    if not from_stock or from_stock.quantity < quantity:
        return jsonify({'error': 'Insufficient stock in source warehouse'}), 400

    # deduct from source
    from_stock.quantity -= quantity

    # add to destination
    to_stock = WarehouseStock.query.filter_by(
        warehouse_id=to_wid, product_id=product_id
    ).first()

    if to_stock:
        to_stock.quantity += quantity
    else:
        product = Product.query.get_or_404(product_id)
        to_stock = WarehouseStock(
            warehouse_id=to_wid, product_id=product_id,
            quantity=quantity,
            low_stock_alert=product.low_stock_alert or 5,
        )
        db.session.add(to_stock)

    db.session.commit()
    return jsonify({
        'success': True,
        'from': from_stock.to_dict(),
        'to': to_stock.to_dict(),
    })


# ── SUMMARY ────────────────────────────────────────────────────
@warehouses_bp.route('/summary', methods=['GET'])
def summary():
    warehouses = Warehouse.query.filter_by(is_active=True).all()
    low_stock = WarehouseStock.query.filter(
        WarehouseStock.quantity <= WarehouseStock.low_stock_alert
    ).all()
    return jsonify({
        'total_warehouses': len(warehouses),
        'total_low_stock': len(low_stock),
        'warehouses': [w.to_dict() for w in warehouses],
    })