from flask import Blueprint, request, jsonify
from models import db, Siswa
from functools import wraps
import jwt
from config import Config
from sqlalchemy.exc import IntegrityError
from ml.predict import predict_categorical, predict_with_detail

students_bp = Blueprint('students', __name__)


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            current_user_id = data['user_id']
        except:
            return jsonify({'message': 'Token is invalid!'}), 401

        return f(current_user_id, *args, **kwargs)
    return decorated


@students_bp.route('/', methods=['GET'])
@token_required
def get_students(current_user_id):
    students = Siswa.query.all()
    return jsonify({'students': [s.to_dict() for s in students]})


@students_bp.route('/', methods=['POST'])
@token_required
def create_student(current_user_id):
    data = request.get_json()

    # Generate unique siswa_id S-001, S-002, ...
    next_num = Siswa.query.count() + 1
    while True:
        siswa_id = f"S-{next_num:03d}"
        if not Siswa.query.filter_by(siswa_id=siswa_id).first():
            break
        next_num += 1

    # Hitung jumlah_absensi dari kehadiran_angka
    if 'kehadiran_angka' in data:
        jumlah_kehadiran = int(data['kehadiran_angka'] or 0)
        jumlah_absensi = max(0, 240 - jumlah_kehadiran)
    else:
        jumlah_absensi = int(data.get('jumlah_absensi', 0))
        jumlah_kehadiran = max(0, 240 - jumlah_absensi)

    predict_input = {
        'jumlah_kehadiran': jumlah_kehadiran,
        'nilai_rata_rata': float(data.get('nilai_rata_rata', data.get('nilai_angka', 0.0))),
        'jumlah_pelanggaran': int(data.get('jumlah_pelanggaran', data.get('pelanggaran_angka', 0))),
        'pekerjaan_orang_tua': data.get('pekerjaan_ortu', data.get('pekerjaan_orang_tua', 'Wiraswasta')),
        'penghasilan_orang_tua': data.get('penghasilan_ortu', data.get('penghasilan_orang_tua', 'Rp 2.000.000 - Rp 5.000.000')),
        'status_spp': data.get('status_spp', 'Lancar'),
        'status_orang_tua': data.get('status_ortu', data.get('status_orang_tua', 'Lengkap')),
    }
    status_risiko = predict_categorical(predict_input)

    new_student = Siswa(
        siswa_id=siswa_id,
        nisn=data.get('nisn', f'TEMP-{next_num}'),
        nama_lengkap=data.get('nama', ''),
        kelas=data.get('kelas', ''),
        tahun_ajaran=data.get('tahun_ajaran', '2026/2027'),
        jumlah_absensi=jumlah_absensi,
        nilai_rata=float(data.get('nilai_rata_rata', data.get('nilai_angka', 0.0))),
        jumlah_pelanggaran=int(data.get('jumlah_pelanggaran', data.get('pelanggaran_angka', 0))),
        pekerjaan_ortu=data.get('pekerjaan_ortu', data.get('pekerjaan_orang_tua', '')),
        penghasilan_ortu=data.get('penghasilan_ortu', data.get('penghasilan_orang_tua', '')),
        status_spp=data.get('status_spp', ''),
        status_ortu=data.get('status_ortu', data.get('status_orang_tua', '')),
        risiko_dropout=status_risiko
    )
    try:
        db.session.add(new_student)
        db.session.commit()
        return jsonify({
            'message': 'Siswa berhasil ditambahkan',
            'data': {'siswa_id': siswa_id, 'status_risiko': status_risiko}
        }), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Gagal menyimpan. NISN sudah terdaftar.'}), 400


@students_bp.route('/<int:id>', methods=['PUT'])
@token_required
def update_student(current_user_id, id):
    student = Siswa.query.get_or_404(id)
    data = request.get_json()

    student.nisn = data.get('nisn', student.nisn)
    student.nama_lengkap = data.get('nama', student.nama_lengkap)
    student.kelas = data.get('kelas', student.kelas)
    student.tahun_ajaran = data.get('tahun_ajaran', student.tahun_ajaran)
    
    if 'kehadiran_angka' in data:
        jumlah_kehadiran = int(data['kehadiran_angka'] or 0)
        student.jumlah_absensi = max(0, 240 - jumlah_kehadiran)
    else:
        student.jumlah_absensi = int(data.get('jumlah_absensi', student.jumlah_absensi or 0))

    student.nilai_rata = float(data.get('nilai_rata_rata', data.get('nilai_angka', student.nilai_rata or 0.0)))
    student.jumlah_pelanggaran = int(data.get('jumlah_pelanggaran', data.get('pelanggaran_angka', student.jumlah_pelanggaran or 0)))
    student.pekerjaan_ortu = data.get('pekerjaan_ortu', data.get('pekerjaan_orang_tua', student.pekerjaan_ortu))
    student.penghasilan_ortu = data.get('penghasilan_ortu', data.get('penghasilan_orang_tua', student.penghasilan_ortu))
    student.status_spp = data.get('status_spp', student.status_spp)
    student.status_ortu = data.get('status_ortu', data.get('status_orang_tua', student.status_ortu))

    # Re-predict setelah update
    jumlah_kehadiran = max(0, 240 - (student.jumlah_absensi or 0))
    predict_input = {
        'jumlah_kehadiran': jumlah_kehadiran,
        'nilai_rata_rata': student.nilai_rata or 0.0,
        'jumlah_pelanggaran': student.jumlah_pelanggaran or 0,
        'pekerjaan_orang_tua': student.pekerjaan_ortu or 'Wiraswasta',
        'penghasilan_orang_tua': student.penghasilan_ortu or 'Rp 2.000.000 - Rp 5.000.000',
        'status_spp': student.status_spp or 'Lancar',
        'status_orang_tua': student.status_ortu or 'Lengkap',
    }
    student.risiko_dropout = predict_categorical(predict_input)

    try:
        db.session.commit()
        return jsonify({'message': 'Siswa berhasil diperbarui', 'status_risiko': student.risiko_dropout})
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Gagal memperbarui. NISN sudah terdaftar pada siswa lain.'}), 400


@students_bp.route('/<int:id>', methods=['DELETE'])
@token_required
def delete_student(current_user_id, id):
    student = Siswa.query.get_or_404(id)
    try:
        db.session.delete(student)
        db.session.commit()
        return jsonify({'message': 'Siswa berhasil dihapus'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Gagal menghapus siswa. Data mungkin sedang digunakan.'}), 400


@students_bp.route('/<int:id>/detail', methods=['GET'])
@token_required
def get_student_detail(current_user_id, id):
    student = Siswa.query.get_or_404(id)
    try:
        jumlah_kehadiran = max(0, 240 - (student.jumlah_absensi or 0))
        predict_input = {
            'jumlah_kehadiran': jumlah_kehadiran,
            'nilai_rata_rata': student.nilai_rata or 0.0,
            'jumlah_pelanggaran': student.jumlah_pelanggaran or 0,
            'pekerjaan_orang_tua': student.pekerjaan_ortu,
            'penghasilan_orang_tua': student.penghasilan_ortu,
            'status_spp': student.status_spp,
            'status_orang_tua': student.status_ortu,
        }
        detail = predict_with_detail(predict_input)
        return jsonify({
            'student': student.to_dict(),
            'data_raw': detail['data_raw'],
            'data_encoded': detail['data_encoded'],
            'prediction_detail': detail['prediction_detail']
        })
    except Exception as e:
        return jsonify({'message': str(e)}), 500