from flask import Blueprint, request, jsonify
import jwt
import bcrypt
from datetime import datetime, timedelta
from config import Config
from models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400
        
    user = User.query.filter_by(username=username).first()
    
    if user and bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        token = jwt.encode({
            'user_id': user.id,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, Config.JWT_SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role
            }
        })
        
    return jsonify({"message": "Invalid username or password"}), 401
