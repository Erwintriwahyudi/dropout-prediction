from flask import Blueprint, request, jsonify
from models import db, User, WaliKelas
import bcrypt
from routes.students import token_required
from sqlalchemy.exc import IntegrityError

wali_kelas_bp = Blueprint('wali_kelas', __name__)


@wali_kelas_bp.route('/', methods=['GET'])
@token_required
def get_wali_kelas(current_user_id):
    try:
        wks = WaliKelas.query.all()
        result = [
            {
                "id": wk.id,
                "user_code": f"WK-{wk.id:03d}",
                "nama": wk.nama,
                "nip": wk.nip,
                "kelas_diampu": wk.kelas_diampu or '',
                "username": wk.user.username if wk.user else wk.username
            }
            for wk in wks
        ]
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@wali_kelas_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user_id):
    """Mengembalikan profil wali kelas yang sedang login."""
    wk = WaliKelas.query.filter_by(user_id=current_user_id).first()
    if not wk:
        return jsonify({"status": "error", "message": "Profil Wali Kelas tidak ditemukan."}), 404
    return jsonify({
        "id": wk.id,
        "user_code": f"WK-{wk.id:03d}",
        "nama": wk.nama,
        "nip": wk.nip,
        "kelas_diampu": wk.kelas_diampu or '',
        "username": wk.user.username if wk.user else wk.username
    })


@wali_kelas_bp.route('/', methods=['POST'])
@token_required
def add_wali_kelas(current_user_id):
    data = request.json
    try:
        username = data.get('username', '').strip()
        password = data.get('password')
        nama = data.get('nama', '').strip()
        nip = data.get('nip', '').strip()
        kelas_diampu = data.get('kelas_diampu', '').strip()

        if not username or not password:
            return jsonify({"status": "error", "message": "Username and password are required"}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"status": "error", "message": "Username already exists"}), 400

        hashed_pwd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        new_user = User(
            username=username,
            password_hash=hashed_pwd.decode('utf-8'),
            role='wali_kelas',
            nama=nama,
            nip=nip
        )
        db.session.add(new_user)
        db.session.flush()

        new_wk = WaliKelas(
            user_id=new_user.id,
            username=username,
            password=hashed_pwd.decode('utf-8'),
            nama=nama,
            nip=nip,
            kelas_diampu=kelas_diampu
        )
        db.session.add(new_wk)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Wali Kelas added successfully",
            "data": {"id": new_wk.id, "user_code": f"WK-{new_wk.id:03d}"}
        }), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"status": "error", "message": "Username already exists"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@wali_kelas_bp.route('/<int:id>', methods=['PUT'])
@token_required
def update_wali_kelas(current_user_id, id):
    wk = WaliKelas.query.get_or_404(id)
    data = request.json
    try:
        wk.nama = data.get('nama', wk.nama)
        wk.nip = data.get('nip', wk.nip)
        wk.kelas_diampu = data.get('kelas_diampu', wk.kelas_diampu)

        if wk.user:
            if 'username' in data:
                username = data['username'].strip()
                if username != wk.user.username:
                    if User.query.filter_by(username=username).first():
                        return jsonify({"status": "error", "message": "Username already exists"}), 400
                    wk.user.username = username
                    wk.username = username
            if 'password' in data and data['password']:
                hashed_pwd = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
                wk.user.password_hash = hashed_pwd.decode('utf-8')
                wk.password = hashed_pwd.decode('utf-8')

        db.session.commit()
        return jsonify({"status": "success", "message": "Wali Kelas updated successfully"}), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"status": "error", "message": "Username already exists"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@wali_kelas_bp.route('/<int:id>', methods=['DELETE'])
@token_required
def delete_wali_kelas(current_user_id, id):
    wk = WaliKelas.query.get_or_404(id)
    try:
        user = wk.user
        db.session.delete(wk)
        if user:
            db.session.delete(user)
        db.session.commit()
        return jsonify({"status": "success", "message": "Wali Kelas deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
