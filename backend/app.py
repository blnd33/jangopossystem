from flask import Flask, jsonify
from flask_cors import CORS
from models import db
from routes.pos import pos_bp
from routes.dashboard import dashboard_bp
from routes.crud import products_bp, customers_bp, expenses_bp, categories_bp
from routes.delivery import delivery_bp
import os


def create_app():
    app = Flask(__name__)

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(BASE_DIR, 'pos.db')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-change-in-production')

    db.init_app(app)

    CORS(app, resources={r'/api/*': {
        'origins': [
            'http://localhost:5173',
            'http://localhost:3000',
            os.environ.get('FRONTEND_ORIGIN', ''),
        ]
    }})

    app.register_blueprint(pos_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(delivery_bp)

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok'})

    with app.app_context():
        db.create_all()

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)