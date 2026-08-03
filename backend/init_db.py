import pymysql
import bcrypt
from app import create_app
from models import db, User, Admin
from config import Config
import re
from sqlalchemy import text


def init_db():
    app = create_app()

    # Ensure database exists
    uri = app.config['SQLALCHEMY_DATABASE_URI']
    match = re.search(r'mysql\+pymysql://(.*?):(.*?)@(.*?)/(.*)', uri)
    if match:
        user, password, host, db_name = match.groups()
        try:
            conn = pymysql.connect(host=host, user=user, password=password)
            cursor = conn.cursor()
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
            conn.commit()
            cursor.close()
            conn.close()
            print(f"Database '{db_name}' ensured.")
        except Exception as e:
            print(f"Error ensuring database: {e}")
            return

    with app.app_context():
        # Hard drop all tables (disable FK checks first)
        with db.engine.connect() as conn:
            conn.execute(text('SET FOREIGN_KEY_CHECKS = 0;'))
            tables = conn.execute(text('SHOW TABLES')).fetchall()
            for table in tables:
                conn.execute(text(f'DROP TABLE IF EXISTS `{table[0]}`'))
            conn.execute(text('SET FOREIGN_KEY_CHECKS = 1;'))
            conn.commit()
        print("All tables dropped.")

        db.create_all()
        print("All tables created.")

        # Seed default admin user
        hashed_pwd = bcrypt.hashpw('admin'.encode('utf-8'), bcrypt.gensalt())
        admin_user = User(
            username='admin',
            password_hash=hashed_pwd.decode('utf-8'),
            role='admin',
            nama='Administrator'
        )
        db.session.add(admin_user)
        db.session.flush()

        admin_detail = Admin(
            user_id=admin_user.id,
            username='admin',
            password=hashed_pwd.decode('utf-8'),
            name='Administrator'
        )
        db.session.add(admin_detail)
        db.session.commit()
        print("Admin seeded: username='admin', password='admin'")
        print("Database initialization complete.")


if __name__ == "__main__":
    init_db()
