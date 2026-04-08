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
    price = db.Column(db.Float, nullable=False)
    cost = db.Column(db.Float, default=0.0)
    stock = db.Column(db.Integer, default=0)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sale_items = db.relationship('SaleItem', backref='product', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'barcode': self.barcode,
            'price': self.price,
            'cost': self.cost,
            'stock': self.stock,
            'category_id': self.category_id,
            'category': self.category.name if self.category else None,
            'image_url': self.image_url,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
        }


class Customer(db.Model):
    __tablename__ = 'customers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(200), nullable=True)
    address = db.Column(db.String(500), nullable=True)
    total_spent = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sales = db.relationship('Sale', backref='customer', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'total_spent': self.total_spent,
            'created_at': self.created_at.isoformat(),
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
    payment_method = db.Column(db.String(50), default='cash')  # cash, card, debt
    amount_paid = db.Column(db.Float, default=0.0)
    change_given = db.Column(db.Float, default=0.0)
    note = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(50), default='completed')  # completed, refunded, pending
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('SaleItem', backref='sale', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_items=False):
        data = {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'customer_id': self.customer_id,
            'customer': self.customer.name if self.customer else 'Walk-in',
            'subtotal': self.subtotal,
            'discount': self.discount,
            'tax': self.tax,
            'total': self.total,
            'payment_method': self.payment_method,
            'amount_paid': self.amount_paid,
            'change_given': self.change_given,
            'note': self.note,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
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
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else '',
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'discount': self.discount,
            'total': self.total,
        }


class Expense(db.Model):
    __tablename__ = 'expenses'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=True)
    note = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'amount': self.amount,
            'category': self.category,
            'note': self.note,
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
            'id': self.id,
            'customer_id': self.customer_id,
            'customer_name': self.customer_name,
            'delivery_address': self.delivery_address,
            'scheduled_date': self.scheduled_date,
            'driver_name': self.driver_name,
            'status': self.status,
            'installation_required': self.installation_required,
            'notes': self.notes,
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
            'id': self.id,
            'customer_id': self.customer_id,
            'customer_name': self.customer_name,
            'gift_type': self.gift_type,
            'description': self.description,
            'gift_value': self.gift_value,
            'status': self.status,
            'reason': self.reason,
            'milestone_id': self.milestone_id,
            'notes': self.notes,
            'valid_until': self.valid_until,
            'date': self.date,
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
            'id': self.id,
            'threshold': self.threshold,
            'gift_type': self.gift_type,
            'gift_value': self.gift_value,
            'description': self.description,
            'active': self.active,
            'created_at': self.created_at.isoformat(),
        }
    




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
            'id': self.id,
            'name': self.name,
            'barcode': self.barcode,
            'sku': self.sku,
            'price': self.price,
            'cost': self.cost,
            'stock': self.stock,
            'low_stock_alert': self.low_stock_alert,
            'category_id': self.category_id,
            'category': self.category.name if self.category else None,
            'image_url': self.image_url,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
        }
    

