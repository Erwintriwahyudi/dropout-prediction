import bcrypt
from app import create_app
from models import db, User, Admin

app = create_app()

with app.app_context():
    dummy_admins = [
        {"username": "admin_utama", "password": "password123"},
        {"username": "admin_akademik", "password": "password123"},
        {"username": "admin_sistem", "password": "password123"},
    ]
    
    for i, data in enumerate(dummy_admins):
        # Check if username exists
        if not User.query.filter_by(username=data["username"]).first():
            hashed_pwd = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt())
            new_user = User(
                username=data["username"],
                password_hash=hashed_pwd.decode('utf-8'),
                role='admin'
            )
            db.session.add(new_user)
            db.session.flush() # get ID
            
            # get next admin code
            count = Admin.query.count() + 1
            admin_code = f"ADM-{count:03d}"
            
            new_admin = Admin(
                user_id=new_user.id,
                admin_code=admin_code
            )
            db.session.add(new_admin)
            print(f"Added admin: {data['username']} with code {admin_code}")
            
    db.session.commit()
    print("Seeding complete.")
