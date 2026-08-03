from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# ----------------- AKTOR -----------------
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='admin')
    nama = db.Column(db.String(100), nullable=True)
    nip = db.Column(db.String(50), nullable=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'nama': self.nama,
            'nip': self.nip
        }


class Admin(db.Model):
    __tablename__ = 'admins'
    admin_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    username = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=True)

    user = db.relationship('User', backref=db.backref('admin_profile', uselist=False))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class WaliKelas(db.Model):
    __tablename__ = 'wali_kelas'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    username = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    nama = db.Column(db.String(100), nullable=False)
    nip = db.Column(db.String(50), nullable=True)
    kelas_diampu = db.Column(db.String(50), nullable=True)
    role = db.Column(db.String(20), default='wali_kelas')

    user = db.relationship('User', backref=db.backref('wali_kelas_profile', uselist=False))


class GuruBK(db.Model):
    __tablename__ = 'guru_bk'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    username = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    nama = db.Column(db.String(100), nullable=False)
    nip = db.Column(db.String(50), nullable=True)
    role = db.Column(db.String(20), default='guru_bk')

    user = db.relationship('User', backref=db.backref('guru_bk_profile', uselist=False))


# ----------------- DATA SISWA -----------------
class Siswa(db.Model):
    __tablename__ = 'siswa'
    data_id = db.Column(db.Integer, primary_key=True)
    siswa_id = db.Column(db.String(20), unique=True, nullable=False)
    nisn = db.Column(db.String(20), unique=True, nullable=True)
    nama_lengkap = db.Column(db.String(100), nullable=False)
    kelas = db.Column(db.String(50), nullable=False)
    jumlah_absensi = db.Column(db.Integer, nullable=True, default=0)
    tahun_ajaran = db.Column(db.String(20), nullable=True, default='2026/2027')
    nilai_rata = db.Column(db.Float, nullable=True, default=0.0)
    jumlah_pelanggaran = db.Column(db.Integer, nullable=True, default=0)
    pekerjaan_ortu = db.Column(db.String(100), nullable=True)
    penghasilan_ortu = db.Column(db.String(100), nullable=True)
    status_spp = db.Column(db.String(50), nullable=True)
    status_ortu = db.Column(db.String(50), nullable=True)
    risiko_dropout = db.Column(db.String(50), nullable=True, default='Belum Diprediksi')

    def to_dict(self):
        return {
            'data_id': self.data_id,
            'siswa_id': self.siswa_id,
            'nisn': self.nisn,
            'nama_lengkap': self.nama_lengkap,
            'kelas': self.kelas,
            'tahun_ajaran': self.tahun_ajaran,
            'jumlah_absensi': self.jumlah_absensi,
            'nilai_rata': self.nilai_rata,
            'jumlah_pelanggaran': self.jumlah_pelanggaran,
            'pekerjaan_ortu': self.pekerjaan_ortu,
            'penghasilan_ortu': self.penghasilan_ortu,
            'status_spp': self.status_spp,
            'status_ortu': self.status_ortu,
            'risiko_dropout': self.risiko_dropout,
            
            # Aliases for frontend compatibility
            'id': self.data_id,
            'nama': self.nama_lengkap,
            'kehadiran_angka': 240 - (self.jumlah_absensi or 0),
            'nilai_angka': self.nilai_rata,
            'pelanggaran_angka': self.jumlah_pelanggaran,
            'status_risiko': self.risiko_dropout
        }


# ----------------- TAHAPAN PREDIKSI -----------------
class HasilPreprocessingData(db.Model):
    __tablename__ = 'hasil_preprocessing_data'
    id_preprocessing = db.Column(db.Integer, primary_key=True)
    data_id = db.Column(db.Integer, db.ForeignKey('siswa.data_id'), nullable=False)
    
    # Optional fields to store the actual preprocessed state
    raw_data_json = db.Column(db.Text, nullable=True)
    encoded_data_json = db.Column(db.Text, nullable=True)
    
    siswa = db.relationship('Siswa', backref=db.backref('preprocessing', lazy=True, cascade="all, delete-orphan"))

class HasilProsesC45(db.Model):
    __tablename__ = 'hasil_proses_c45'
    id_hasil_c45 = db.Column(db.Integer, primary_key=True)
    id_preprocessing = db.Column(db.Integer, db.ForeignKey('hasil_preprocessing_data.id_preprocessing'), nullable=False)
    atribut_terpilih = db.Column(db.String(255), nullable=True)
    status_c45 = db.Column(db.String(50), nullable=True)

    preprocessing = db.relationship('HasilPreprocessingData', backref=db.backref('c45', lazy=True, cascade="all, delete-orphan"))


class HasilNaiveBayes(db.Model):
    __tablename__ = 'hasil_naive_bayes'
    id_probabilitas = db.Column(db.Integer, primary_key=True)
    id_hasil_c45 = db.Column(db.Integer, db.ForeignKey('hasil_proses_c45.id_hasil_c45'), nullable=False)
    nilai_peluang = db.Column(db.Float, nullable=True)
    
    c45 = db.relationship('HasilProsesC45', backref=db.backref('naive_bayes', lazy=True, cascade="all, delete-orphan"))


class HasilPrediksiSiswaBerisiko(db.Model):
    __tablename__ = 'hasil_prediksi_siswa_berisiko'
    prediksi_id = db.Column(db.Integer, primary_key=True)
    data_id = db.Column(db.Integer, db.ForeignKey('siswa.data_id'), nullable=False)
    siswa_id = db.Column(db.String(20), nullable=False)
    tanggal_prediksi = db.Column(db.DateTime, default=datetime.utcnow)
    kategori_risiko = db.Column(db.String(50), nullable=False)
    skor_probabilitas = db.Column(db.Float, nullable=True)
    
    # We will tie the Laporan through a backref from LaporanSiswaBerisiko
    siswa = db.relationship('Siswa', backref=db.backref('prediksi_akhir', lazy=True, cascade="all, delete-orphan"))


class LaporanSiswaBerisiko(db.Model):
    __tablename__ = 'laporan_siswa_berisiko'
    laporan_id = db.Column(db.Integer, primary_key=True)
    prediksi_id = db.Column(db.Integer, db.ForeignKey('hasil_prediksi_siswa_berisiko.prediksi_id'), nullable=False)
    tanggal = db.Column(db.DateTime, default=datetime.utcnow)
    keterangan = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), nullable=False, default='Belum Diproses')
    
    prediksi = db.relationship('HasilPrediksiSiswaBerisiko', backref=db.backref('laporan', lazy=True, cascade="all, delete-orphan"))
    
    def to_dict(self):
        return {
            'laporan_id': self.laporan_id,
            'prediksi_id': self.prediksi_id,
            'tanggal': self.tanggal.isoformat() if self.tanggal else None,
            'keterangan': self.keterangan,
            'status': self.status,
            'siswa': self.prediksi.siswa.to_dict() if self.prediksi and self.prediksi.siswa else None
        }