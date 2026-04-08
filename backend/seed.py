"""
Run once to seed the database with demo data:
    python seed.py
"""
from app import create_app
from models import db, Category, Product, Customer, Expense, Sale, SaleItem
from datetime import datetime, timedelta
import random

app = create_app()

with app.app_context():
    # Clear existing data
    db.drop_all()
    db.create_all()

    # Categories
    cats = [Category(name=n) for n in ['Drinks', 'Food', 'Snacks', 'Equipment', 'Other']]
    db.session.add_all(cats)
    db.session.flush()

    drinks, food, snacks, equip, other = cats

    # Products
    products = [
        Product(name='Pepsi 500ml', barcode='1001', price=1.5, cost=0.8, stock=100, category_id=drinks.id),
        Product(name='Water 1L', barcode='1002', price=0.75, cost=0.3, stock=200, category_id=drinks.id),
        Product(name='Orange Juice', barcode='1003', price=2.0, cost=1.2, stock=50, category_id=drinks.id),
        Product(name='Coffee', barcode='1004', price=3.0, cost=1.0, stock=80, category_id=drinks.id),
        Product(name='Sandwich', barcode='2001', price=4.5, cost=2.5, stock=30, category_id=food.id),
        Product(name='Pizza Slice', barcode='2002', price=3.0, cost=1.5, stock=20, category_id=food.id),
        Product(name='Chips Lays', barcode='3001', price=1.25, cost=0.6, stock=150, category_id=snacks.id),
        Product(name='Chocolate Bar', barcode='3002', price=1.0, cost=0.5, stock=120, category_id=snacks.id),
        Product(name='Notebook', barcode='4001', price=5.0, cost=2.0, stock=3, category_id=equip.id),  # low stock
        Product(name='Pen Pack', barcode='4002', price=2.0, cost=0.8, stock=4, category_id=equip.id),  # low stock
    ]
    db.session.add_all(products)
    db.session.flush()

    # Customers
    customers = [
        Customer(name='Ahmed Hassan', phone='07501234567'),
        Customer(name='Sara Ali', phone='07509876543'),
        Customer(name='Mohammed Kareem', phone='07512345678'),
        Customer(name='Narin Rostam', phone='07518765432'),
    ]
    db.session.add_all(customers)
    db.session.flush()

    # Expenses (last 30 days)
    expense_data = [
        ('Rent', 500, 'Fixed'),
        ('Electricity', 80, 'Utilities'),
        ('Water Bill', 30, 'Utilities'),
        ('Internet', 25, 'Utilities'),
        ('Cleaning Supplies', 40, 'Operations'),
        ('Staff Lunch', 60, 'HR'),
    ]
    for i, (title, amount, cat) in enumerate(expense_data):
        db.session.add(Expense(
            title=title,
            amount=amount,
            category=cat,
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 25))
        ))

    # Sales (last 30 days)
    import string
    def gen_invoice():
        return 'INV-SEED-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    methods = ['cash', 'card', 'debt']
    for day_offset in range(30):
        sale_date = datetime.utcnow() - timedelta(days=day_offset)
        num_sales = random.randint(2, 8)
        for _ in range(num_sales):
            chosen_products = random.sample(products[:8], k=random.randint(1, 3))
            subtotal = 0
            sale_items_data = []
            for p in chosen_products:
                qty = random.randint(1, 4)
                item_total = p.price * qty
                subtotal += item_total
                sale_items_data.append((p, qty, item_total))

            total = subtotal
            method = random.choice(methods)
            customer = random.choice(customers + [None])

            sale = Sale(
                invoice_number=gen_invoice(),
                customer_id=customer.id if customer else None,
                subtotal=subtotal,
                discount=0,
                tax=0,
                total=total,
                payment_method=method,
                amount_paid=total,
                change_given=0,
                status='completed',
                created_at=sale_date,
            )
            db.session.add(sale)
            db.session.flush()

            for p, qty, item_total in sale_items_data:
                db.session.add(SaleItem(
                    sale_id=sale.id,
                    product_id=p.id,
                    quantity=qty,
                    unit_price=p.price,
                    discount=0,
                    total=item_total,
                ))
            if customer:
                customer.total_spent += total

    db.session.commit()
    print("✅ Database seeded successfully!")
    print(f"   {len(products)} products, {len(customers)} customers, 6 expenses, ~{30*5} sales")