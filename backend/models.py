from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    products = db.relationship('Product', backref='category', lazy=True)

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'created_at': self.created_at.isoformat()}


class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    barcode = db.Column(db.String(100), unique=True, nullable=True)
    sku = db.Column(db.String(100), unique=True, nullable=True)
    price = db.Column(db.Float, nullable=False)
    cost = db.Column(db.Float, default=0.0)
    stock = db.Column(db.Integer, default=0)
    low_stock_alert = db.Column(db.Integer, default=5)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    description = db.Column(db.String(1000), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sale_items = db.relationship('SaleItem', backref='product', lazy=True)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'barcode': self.barcode, 'sku': self.sku,
            'price': self.price, 'cost': self.cost, 'stock': self.stock,
            'low_stock_alert': self.low_stock_alert, 'category_id': self.category_id,
            'category': self.category.name if self.category else None,
            'image_url': self.image_url, 'description': self.description,
            'is_active': self.is_active, 'created_at': self.created_at.isoformat(),
        }


class Customer(db.Model):
    __tablename__ = 'customers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(200), nullable=True)
    address = db.Column(db.String(500), nullable=True)
    tag = db.Column(db.String(50), default='Regular')
    total_spent = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sales = db.relationship('Sale', backref='customer', lazy=True)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'phone': self.phone,
            'email': self.email, 'address': self.address, 'tag': self.tag,
            'total_spent': self.total_spent, 'created_at': self.created_at.isoformat(),
        }


class Sale(db.Model):
    __tablename__ = 'sales'
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    subtotal = db.Column(db.Float, nullable=False)
    discount = db.Column(db.Float, default=0.0)
    tax = db.Column(db.Float, default=0.0)
    total = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), default='cash')
    amount_paid = db.Column(db.Float, default=0.0)
    change_given = db.Column(db.Float, default=0.0)
    note = db.Column(db.String(500), nullable=True)
    buyer_name = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(50), default='completed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('SaleItem', backref='sale', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_items=False):
        data = {
            'id': self.id, 'invoice_number': self.invoice_number,
            'customer_id': self.customer_id,
            'customer': self.customer.name if self.customer else 'Walk-in',
            'subtotal': self.subtotal, 'discount': self.discount, 'tax': self.tax,
            'total': self.total, 'payment_method': self.payment_method,
            'amount_paid': self.amount_paid, 'change_given': self.change_given,
            'note': self.note, 'buyer_name': self.buyer_name, 'status': self.status, 'created_at': self.created_at.isoformat(),
        }
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        return data


class SaleItem(db.Model):
    __tablename__ = 'sale_items'
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    discount = db.Column(db.Float, default=0.0)
    total = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'id': self.id, 'product_id': self.product_id,
            'product_name': self.product.name if self.product else '',
            'quantity': self.quantity, 'unit_price': self.unit_price,
            'discount': self.discount, 'total': self.total,
        }


class Expense(db.Model):
    __tablename__ = 'expenses'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=True)
    date = db.Column(db.String(20), nullable=True)
    vendor = db.Column(db.String(200), nullable=True)
    recurring = db.Column(db.Boolean, default=False)
    note = db.Column(db.String(500), nullable=True)
    buyer_name = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'amount': self.amount,
            'category': self.category, 'date': self.date or self.created_at.strftime('%Y-%m-%d'),
            'vendor': self.vendor, 'recurring': self.recurring, 'note': self.note,
            'created_at': self.created_at.isoformat(),
        }


class Delivery(db.Model):
    __tablename__ = 'deliveries'
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    customer_name = db.Column(db.String(200), nullable=False)
    delivery_address = db.Column(db.String(500), nullable=False)
    scheduled_date = db.Column(db.String(20), nullable=True)
    driver_name = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(50), default='Pending')
    installation_required = db.Column(db.Boolean, default=False)
    notes = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'customer_id': self.customer_id, 'customer_name': self.customer_name,
            'delivery_address': self.delivery_address, 'scheduled_date': self.scheduled_date,
            'driver_name': self.driver_name, 'status': self.status,
            'installation_required': self.installation_required, 'notes': self.notes,
            'created_at': self.created_at.isoformat(),
        }


class Employee(db.Model):
    __tablename__ = 'employees'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(100), default='Cashier')
    phone = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(200), nullable=True)
    salary = db.Column(db.Float, default=0.0)
    start_date = db.Column(db.String(20), nullable=True)
    national_id = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(50), default='Active')
    notes = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'role': self.role, 'phone': self.phone,
            'email': self.email, 'salary': self.salary, 'start_date': self.start_date,
            'national_id': self.national_id, 'status': self.status, 'notes': self.notes,
            'created_at': self.created_at.isoformat(),
        }


class Gift(db.Model):
    __tablename__ = 'gifts'
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    customer_name = db.Column(db.String(200), nullable=False)
    gift_type = db.Column(db.String(50), default='product')
    description = db.Column(db.String(500), nullable=False)
    gift_value = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(50), default='Pending')
    reason = db.Column(db.String(100), default='manual')
    milestone_id = db.Column(db.Integer, nullable=True)
    notes = db.Column(db.String(500), nullable=True)
    valid_until = db.Column(db.String(20), nullable=True)
    date = db.Column(db.String(20), nullable=True)
    sent_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'customer_id': self.customer_id, 'customer_name': self.customer_name,
            'gift_type': self.gift_type, 'description': self.description, 'gift_value': self.gift_value,
            'status': self.status, 'reason': self.reason, 'milestone_id': self.milestone_id,
            'notes': self.notes, 'valid_until': self.valid_until, 'date': self.date,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'created_at': self.created_at.isoformat(),
        }


class GiftMilestone(db.Model):
    __tablename__ = 'gift_milestones'
    id = db.Column(db.Integer, primary_key=True)
    threshold = db.Column(db.Float, nullable=False)
    gift_type = db.Column(db.String(50), default='discount')
    gift_value = db.Column(db.Float, default=0.0)
    description = db.Column(db.String(500), nullable=False)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'threshold': self.threshold, 'gift_type': self.gift_type,
            'gift_value': self.gift_value, 'description': self.description,
            'active': self.active, 'created_at': self.created_at.isoformat(),
        }


class PurchaseOrder(db.Model):
    __tablename__ = 'purchase_orders'
    id = db.Column(db.Integer, primary_key=True)
    supplier_name = db.Column(db.String(200), nullable=False)
    order_date = db.Column(db.String(20), nullable=True)
    expected_date = db.Column(db.String(20), nullable=True)
    status = db.Column(db.String(50), default='Draft')
    notes = db.Column(db.String(500), nullable=True)
    total = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('PurchaseOrderItem', backref='order', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_items=True):
        data = {
            'id': self.id, 'supplier_name': self.supplier_name, 'order_date': self.order_date,
            'expected_date': self.expected_date, 'status': self.status, 'notes': self.notes,
            'total': self.total, 'created_at': self.created_at.isoformat(),
        }
        if include_items:
            data['items'] = [i.to_dict() for i in self.items]
        return data


class PurchaseOrderItem(db.Model):
    __tablename__ = 'purchase_order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('purchase_orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    product_name = db.Column(db.String(200), nullable=False)
    qty = db.Column(db.Integer, default=1)
    unit_cost = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            'id': self.id, 'product_id': self.product_id, 'product_name': self.product_name,
            'qty': self.qty, 'unit_cost': self.unit_cost, 'total': self.qty * self.unit_cost,
        }


class Supplier(db.Model):
    __tablename__ = 'suppliers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(200), nullable=True)
    address = db.Column(db.String(500), nullable=True)
    notes = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'phone': self.phone, 'email': self.email,
            'address': self.address, 'notes': self.notes, 'created_at': self.created_at.isoformat(),
        }


class Return(db.Model):
    __tablename__ = 'returns'
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.id'), nullable=True)
    customer_name = db.Column(db.String(200), nullable=False)
    return_type = db.Column(db.String(50), default='Refund')
    reason = db.Column(db.String(500), nullable=False)
    refund_amount = db.Column(db.Float, default=0.0)
    restock = db.Column(db.Boolean, default=True)
    status = db.Column(db.String(50), default='Pending')
    notes = db.Column(db.String(500), nullable=True)
    date = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'sale_id': self.sale_id, 'customer_name': self.customer_name,
            'return_type': self.return_type, 'reason': self.reason, 'refund_amount': self.refund_amount,
            'restock': self.restock, 'status': self.status, 'notes': self.notes,
            'date': self.date, 'created_at': self.created_at.isoformat(),
        }


class Debt(db.Model):
    __tablename__ = 'debts'
    id = db.Column(db.Integer, primary_key=True)
    debt_type = db.Column(db.String(20), nullable=False)  # 'purchase' or 'sale'
    reference_id = db.Column(db.Integer, nullable=True)   # purchase_order.id or sale.id
    party_name = db.Column(db.String(200), nullable=False) # supplier or customer name
    party_id = db.Column(db.Integer, nullable=True)
    total_amount = db.Column(db.Float, nullable=False)
    paid_amount = db.Column(db.Float, default=0.0)
    due_date = db.Column(db.String(20), nullable=True)
    status = db.Column(db.String(20), default='unpaid')   # 'unpaid', 'partial', 'paid'
    notes = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    payments = db.relationship('DebtPayment', backref='debt', lazy=True, cascade='all, delete-orphan')

    @property
    def remaining_amount(self):
        return round(self.total_amount - self.paid_amount, 2)

    def to_dict(self):
        return {
            'id': self.id,
            'debt_type': self.debt_type,
            'reference_id': self.reference_id,
            'party_name': self.party_name,
            'party_id': self.party_id,
            'total_amount': self.total_amount,
            'paid_amount': self.paid_amount,
            'remaining_amount': self.remaining_amount,
            'due_date': self.due_date,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'payments': [p.to_dict() for p in self.payments],
        }


class DebtPayment(db.Model):
    __tablename__ = 'debt_payments'
    id = db.Column(db.Integer, primary_key=True)
    debt_id = db.Column(db.Integer, db.ForeignKey('debts.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_date = db.Column(db.String(20), nullable=True)
    note = db.Column(db.String(500), nullable=True)
    buyer_name = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'debt_id': self.debt_id,
            'amount': self.amount,
            'payment_date': self.payment_date,
            'note': self.note,
            'created_at': self.created_at.isoformat(),
        }


class Warehouse(db.Model):
    __tablename__ = 'warehouses'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    location = db.Column(db.String(500), nullable=True)
    manager = db.Column(db.String(200), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    notes = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    stock_items = db.relationship('WarehouseStock', backref='warehouse', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        total_items = sum(s.quantity for s in self.stock_items)
        return {
            'id': self.id, 'name': self.name, 'location': self.location,
            'manager': self.manager, 'is_active': self.is_active,
            'notes': self.notes, 'created_at': self.created_at.isoformat(),
            'total_items': total_items,
            'product_count': len(self.stock_items),
        }


class WarehouseStock(db.Model):
    __tablename__ = 'warehouse_stock'
    id = db.Column(db.Integer, primary_key=True)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=0)
    low_stock_alert = db.Column(db.Integer, default=5)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    product = db.relationship('Product', lazy=True)
    __table_args__ = (db.UniqueConstraint('warehouse_id', 'product_id', name='unique_warehouse_product'),)

    def to_dict(self):
        return {
            'id': self.id,
            'warehouse_id': self.warehouse_id,
            'warehouse_name': self.warehouse.name if self.warehouse else '',
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else '',
            'product_barcode': self.product.barcode if self.product else '',
            'product_price': self.product.price if self.product else 0,
            'product_cost': self.product.cost if self.product else 0,
            'quantity': self.quantity,
            'low_stock_alert': self.low_stock_alert,
            'is_low': self.quantity <= self.low_stock_alert,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
