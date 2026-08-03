from flask import Blueprint, request, jsonify
from models import db, User, Admin
import bcrypt
from routes.students import token_required
from sqlalchemy.exc import IntegrityError

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/', methods=['GET'])
@token_required
def get_admins(current_user_id):
    try:
        admins = Admin.query.all()
        result = [
            {
                "id": adm.admin_id,
                "nama": adm.name,
                "username": adm.user.username if adm.user else adm.username
            }
            for adm in admins
        ]
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@admin_bp.route('/', methods=['POST'])
@token_required
def add_admin(current_user_id):
    data = request.json
    try:
        username = data.get('username', '').strip()
        password = data.get('password')
        nama = data.get('nama', '').strip()

        if not username or not password:
            return jsonify({"status": "error", "message": "Username and password are required"}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"status": "error", "message": "Username already exists"}), 400

        hashed_pwd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        new_user = User(
            username=username,
            password_hash=hashed_pwd.decode('utf-8'),
            role='admin',
            nama=nama
        )
        db.session.add(new_user)
        db.session.flush()

        new_admin = Admin(
            user_id=new_user.id,
            username=username,
            password=hashed_pwd.decode('utf-8'),
            name=nama
        )
        db.session.add(new_admin)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Admin added successfully",
            "data": {"admin_id": new_admin.admin_id}
        }), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"status": "error", "message": "Username already exists"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@admin_bp.route('/<int:id>', methods=['PUT'])
@token_required
def update_admin(current_user_id, id):
    adm = Admin.query.get_or_404(id)
    data = request.json
    try:
        if 'nama' in data:
            adm.name = data['nama'].strip()
        if adm.user:
            if 'username' in data:
                username = data['username'].strip()
                if username != adm.user.username:
                    if User.query.filter_by(username=username).first():
                        return jsonify({"status": "error", "message": "Username already exists"}), 400
                    adm.user.username = username
                    adm.username = username
            if 'password' in data and data['password']:
                hashed_pwd = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
                adm.user.password_hash = hashed_pwd.decode('utf-8')
                adm.password = hashed_pwd.decode('utf-8')

        db.session.commit()
        return jsonify({"status": "success", "message": "Admin updated successfully"}), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"status": "error", "message": "Username already exists"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@admin_bp.route('/<int:id>', methods=['DELETE'])
@token_required
def delete_admin(current_user_id, id):
    adm = Admin.query.get_or_404(id)
    try:
        user = adm.user
        db.session.delete(adm)
        if user:
            db.session.delete(user)
        db.session.commit()
        return jsonify({"status": "success", "message": "Admin deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
