from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db

# Import blueprints (Flask)
from routes.auth import auth_bp
from routes.students import students_bp
from routes.predict import predict_bp
from routes.wali_kelas import wali_kelas_bp
from routes.guru_bk import guru_bk_bp
from routes.admin import admin_bp
from routes.preprocessing import preprocessing_bp
from routes.laporan import laporan_bp
from routes.c45 import c45_bp
from routes.naive_bayes import naive_bayes_bp
from routes.hybrid import hybrid_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, origins=["http://localhost:3000"], supports_credentials=True)
    db.init_app(app)

    # Register blueprints ke Flask
    app.register_blueprint(auth_bp,          url_prefix='/api/auth')
    app.register_blueprint(students_bp,      url_prefix='/api/students')
    app.register_blueprint(predict_bp,       url_prefix='/api/predict')
    app.register_blueprint(wali_kelas_bp,    url_prefix='/api/wali-kelas')
    app.register_blueprint(guru_bk_bp,       url_prefix='/api/guru-bk')
    app.register_blueprint(admin_bp,         url_prefix='/api/admin')
    app.register_blueprint(preprocessing_bp, url_prefix='/api')
    app.register_blueprint(laporan_bp,       url_prefix='/api/laporan')
    app.register_blueprint(c45_bp,           url_prefix='/api')
    app.register_blueprint(naive_bayes_bp,   url_prefix='/api')
    app.register_blueprint(hybrid_bp,        url_prefix='/api')

    @app.route('/')
    def index():
        return jsonify({"message": "Sistem Prediksi Potensi Risiko Drop-Out Siswa API"})

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)