from flask import Blueprint, request, jsonify
from models import db, User, GuruBK
import bcrypt
from routes.students import token_required
from sqlalchemy.exc import IntegrityError

guru_bk_bp = Blueprint('guru_bk', __name__)


@guru_bk_bp.route('/', methods=['GET'])
@token_required
def get_guru_bk(current_user_id):
    try:
        gbks = GuruBK.query.all()
        result = [
            {
                "id": gbk.id,
                "user_code": f"GBK-{gbk.id:03d}",
                "nama": gbk.nama,
                "nip": gbk.nip,
                "username": gbk.user.username if gbk.user else gbk.username
            }
            for gbk in gbks
        ]
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@guru_bk_bp.route('/', methods=['POST'])
@token_required
def add_guru_bk(current_user_id):
    data = request.json
    try:
        username = data.get('username', '').strip()
        password = data.get('password')
        nama = data.get('nama', '').strip()
        nip = data.get('nip', '').strip()

        if not username or not password:
            return jsonify({"status": "error", "message": "Username and password are required"}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"status": "error", "message": "Username already exists"}), 400

        hashed_pwd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        new_user = User(
            username=username,
            password_hash=hashed_pwd.decode('utf-8'),
            role='guru_bk',
            nama=nama,
            nip=nip
        )
        db.session.add(new_user)
        db.session.flush()

        new_gbk = GuruBK(
            user_id=new_user.id,
            username=username,
            password=hashed_pwd.decode('utf-8'),
            nama=nama,
            nip=nip
        )
        db.session.add(new_gbk)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Guru BK added successfully",
            "data": {"id": new_gbk.id, "user_code": f"GBK-{new_gbk.id:03d}"}
        }), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"status": "error", "message": "Username already exists"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@guru_bk_bp.route('/<int:id>', methods=['PUT'])
@token_required
def update_guru_bk(current_user_id, id):
    gbk = GuruBK.query.get_or_404(id)
    data = request.json
    try:
        gbk.nama = data.get('nama', gbk.nama)
        gbk.nip = data.get('nip', gbk.nip)

        if gbk.user:
            if 'username' in data:
                username = data['username'].strip()
                if username != gbk.user.username:
                    if User.query.filter_by(username=username).first():
                        return jsonify({"status": "error", "message": "Username already exists"}), 400
                    gbk.user.username = username
                    gbk.username = username
            if 'password' in data and data['password']:
                hashed_pwd = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
                gbk.user.password_hash = hashed_pwd.decode('utf-8')
                gbk.password = hashed_pwd.decode('utf-8')

        db.session.commit()
        return jsonify({"status": "success", "message": "Guru BK updated successfully"}), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"status": "error", "message": "Username already exists"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@guru_bk_bp.route('/<int:id>', methods=['DELETE'])
@token_required
def delete_guru_bk(current_user_id, id):
    gbk = GuruBK.query.get_or_404(id)
    try:
        user = gbk.user
        db.session.delete(gbk)
        if user:
            db.session.delete(user)
        db.session.commit()
        return jsonify({"status": "success", "message": "Guru BK deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
