import os

class Config:
    # Use Laragon default MySQL connection
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'mysql+pymysql://root:@localhost/db_prediksi_dropout')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Secret
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'super-secret-key-1234')
