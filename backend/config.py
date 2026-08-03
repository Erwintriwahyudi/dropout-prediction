import os

class Config:
    # Use Laragon default MySQL connection
    _db_url = os.getenv('DATABASE_URL', 'mysql+pymysql://root:@localhost/db_prediksi_dropout')
    if _db_url.startswith("mysql://"):
        _db_url = _db_url.replace("mysql://", "mysql+pymysql://", 1)
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Secret
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'super-secret-key-1234')
