from flask import Blueprint, request, jsonify
from models import db
from sqlalchemy import text
from datetime import datetime
import uuid

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


def get_notifications_table():
    """Ensure notifications table exists"""
    db.session.execute(text('''
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            message TEXT,
            type TEXT,
            time TEXT,
            read INTEGER DEFAULT 0
        )
    '''))
    db.session.commit()


@notifications_bp.route('', methods=['GET'])
def get_notifications():
    try:
        get_notifications_table()
        result = db.session.execute(
            text('SELECT id, message, type, time, read FROM notifications ORDER BY time DESC LIMIT 100')
        ).fetchall()
        notifications = [
            {
                'id': row[0],
                'message': row[1],
                'type': row[2],
                'time': row[3],
                'read': bool(row[4]),
            }
            for row in result
        ]
        return jsonify(notifications)
    except Exception as e:
        return jsonify([])


@notifications_bp.route('', methods=['POST'])
def add_notification():
    try:
        get_notifications_table()
        data = request.get_json()
        notif_id = str(uuid.uuid4())
        message = data.get('message', '')
        notif_type = data.get('type', 'info')
        time = datetime.utcnow().isoformat()
        db.session.execute(
            text('INSERT INTO notifications (id, message, type, time, read) VALUES (:id, :message, :type, :time, 0)'),
            {'id': notif_id, 'message': message, 'type': notif_type, 'time': time}
        )
        db.session.commit()
        return jsonify({'success': True, 'id': notif_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@notifications_bp.route('/mark-read', methods=['POST'])
def mark_all_read():
    try:
        get_notifications_table()
        db.session.execute(text('UPDATE notifications SET read = 1'))
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@notifications_bp.route('/clear', methods=['POST'])
def clear_notifications():
    try:
        get_notifications_table()
        db.session.execute(text('DELETE FROM notifications WHERE read = 1'))
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500