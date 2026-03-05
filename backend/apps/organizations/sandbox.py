import random
import logging

from django.contrib.auth import get_user_model
from apps.organizations.models import Organization, Department
from apps.entities.models import Entity
from apps.procedures.models import Procedure, ProcedureStep
from apps.core.constants import UserRole, ProcedurePriority, IntervalUnit

logger = logging.getLogger(__name__)
User = get_user_model()

DEPARTMENTS = [
    {'name': 'Bakım ve Onarım', 'code': 'MNT'},
    {'name': 'Hassas Üretim', 'code': 'PRD'},
    {'name': 'Kalite Güvence', 'code': 'QLT'},
    {'name': 'Lojistik ve Depo', 'code': 'WHS'},
    {'name': 'Tesis Yönetimi', 'code': 'FAC'},
    {'name': 'BT ve Altyapı', 'code': 'ITS'},
]

ENTITIES_PER_DEPT = {
    'MNT': [
        {'name': 'Ana Jeneratör Seti', 'type': 'equipment'},
        {'name': 'Hava Kompresörü V1', 'type': 'equipment'},
        {'name': 'Kaynak Robotu Fanuc', 'type': 'machine'},
    ],
    'PRD': [
        {'name': '5 Eksenli CNC İşleme Merkezi', 'type': 'machine'},
        {'name': 'Lazer Kesim Ünitesi XL', 'type': 'machine'},
        {'name': 'Endüstriyel 3D Yazıcı - Formlabs', 'type': 'machine'},
        {'name': 'Vakum Kaplama Cihazı', 'type': 'machine'},
    ],
    'QLT': [
        {'name': 'CMM Ölçüm Laboratuvarı', 'type': 'location'},
        {'name': 'Optik Profil Projeksiyon', 'type': 'equipment'},
        {'name': 'Sertlik Ölçme Cihazı', 'type': 'equipment'},
    ],
    'WHS': [
        {'name': 'Elektrikli Forklift 01', 'type': 'vehicle'},
        {'name': 'Otomatik Depolama Raf Sistemi', 'type': 'equipment'},
        {'name': 'Soğuk Hava Deposu', 'type': 'location'},
    ],
    'FAC': [
        {'name': 'Merkezi İklimlendirme Ünitesi', 'type': 'equipment'},
        {'name': 'Yangın Güvenlik Panosu', 'type': 'equipment'},
        {'name': 'Su Arıtma Sistemi', 'type': 'equipment'},
        {'name': 'Asansör Batı Blok', 'type': 'equipment'},
    ],
    'ITS': [
        {'name': 'Sunucu Odası Klima', 'type': 'equipment'},
        {'name': 'Yedek Güç Kaynağı (UPS)', 'type': 'equipment'},
    ],
}

PROCEDURE_TEMPLATES = {
    'Daily Check': {
        'priority': ProcedurePriority.MEDIUM,
        'unit': IntervalUnit.DAYS,
        'val': 1,
        'steps': [
            ('Görsel Kontrol', 'Sızıntı veya hasar var mı?', True, True),
            ('Sıvı Seviyeleri', 'Yağ ve soğutma suyu kontrolü.', False, True),
            ('Temizlik', 'Yüzey temizliğinin yapılması.', True, False),
            ('Çalışma Sesi', 'Anormal ses kontrolü.', False, True),
            ('Güvenlik Butonları', 'E-Stop testi.', False, True),
        ],
    },
    'Weekly Maintenance': {
        'priority': ProcedurePriority.HIGH,
        'unit': IntervalUnit.WEEKS,
        'val': 1,
        'steps': [
            ('Filtre Değişimi/Temizliği', 'Hava ve yağ filtreleri.', True, True),
            ('Hareketli Parça Yağlama', 'Kızak ve rulman bakımı.', True, False),
            ('Elektrik Bağlantıları', 'Klemens gevşeklik kontrolü.', False, True),
            ('Kalibrasyon Doğrulama', 'Standart değer ölçümü.', True, True),
            ('Hata Kayıtları', 'Sistem loglarının incelenmesi.', False, False),
            ('Yazılım Kontrolü', 'Güncelleme var mı?', False, False),
            ('Yedekleme', 'Konfigürasyon yedeği al.', False, True),
        ],
    },
    'Monthly Detailed Audit': {
        'priority': ProcedurePriority.CRITICAL,
        'unit': IntervalUnit.MONTHS,
        'val': 1,
        'steps': [
            ('Yapısal Bütünlük', 'Şasi ve gövde kontrolü.', True, True),
            ('Hidrolik Basınç Testi', 'Sistem basınç verimi.', True, True),
            ('Yalıtım Testi', 'Elektriksel izolasyon ölçümü.', False, True),
            ('Aşınma Analizi', 'Deforme olan parçaların listelenmesi.', True, False),
            ('Enerji Verimliliği', 'Tüketim değerlerinin okunması.', False, False),
            ('Operatör Geri Bildirimi', 'Kullanım zorluklarını not et.', False, False),
            ('Yedek Parça Stok', 'Kritik parça kontrolü.', False, False),
            ('İş Güvenliği Ekipmanı', 'LOTO ekipman kontrolü.', True, True),
            ('Atık Yönetimi', 'Kullanılmış yağ ve parça imhası.', False, True),
            ('Rapor Hazırlama', 'Yönetim özetinin çıkarılması.', False, False),
        ],
    },
}


def seed_sandbox_organization(org: Organization, password: str) -> dict:
    departments = {}
    for d in DEPARTMENTS:
        dept, _ = Department.objects.get_or_create(
            organization=org,
            name=d['name'],
            defaults={'code': d['code']},
        )
        departments[d['code']] = dept

    admin, created = User.objects.get_or_create(
        email='admin@orionstudio.com',
        defaults={
            'full_name': 'Orion Sistem Yöneticisi',
            'organization': org,
            'role': UserRole.ADMIN,
            'is_active': True,
        },
    )
    if created:
        admin.set_password(password)
        admin.save()

    staff = {}
    for code, dept in departments.items():
        mgr_email = f'manager.{code.lower()}@orionstudio.com'
        mgr, created = User.objects.get_or_create(
            email=mgr_email,
            defaults={
                'full_name': f'{dept.name} Müdürü',
                'organization': org,
                'department': dept,
                'role': UserRole.MANAGER,
                'is_active': True,
            },
        )
        if created:
            mgr.set_password(password)
            mgr.save()

        workers = []
        for i in range(1, 4):
            wrk_email = f'worker{i}.{code.lower()}@orionstudio.com'
            wrk, created = User.objects.get_or_create(
                email=wrk_email,
                defaults={
                    'full_name': f'{dept.name} Görevlisi {i}',
                    'organization': org,
                    'department': dept,
                    'role': UserRole.WORKER,
                    'is_active': True,
                },
            )
            if created:
                wrk.set_password(password)
                wrk.save()
            workers.append(wrk)

        staff[code] = {'manager': mgr, 'workers': workers}

    entity_count = 0
    procedure_count = 0

    for code, entity_list in ENTITIES_PER_DEPT.items():
        dept = departments[code]
        manager = staff[code]['manager']

        for idx, e_info in enumerate(entity_list):
            entity, _ = Entity.objects.get_or_create(
                organization=org,
                code=f'{code}-{idx + 101}',
                defaults={
                    'name': e_info['name'],
                    'department': dept,
                    'entity_type': e_info['type'],
                    'status': 'ACTIVE',
                },
            )
            entity_count += 1

            available_types = list(PROCEDURE_TEMPLATES.keys())
            chosen_types = random.sample(available_types, k=random.randint(2, 3))

            for p_type in chosen_types:
                p_data = PROCEDURE_TEMPLATES[p_type]
                proc, _ = Procedure.objects.update_or_create(
                    organization=org,
                    entity=entity,
                    title=f'{entity.name} - {p_type}',
                    defaults={
                        'priority': p_data['priority'],
                        'interval_value': p_data['val'],
                        'interval_unit': p_data['unit'],
                        'created_by': manager,
                        'is_active': True,
                    },
                )
                proc.steps.all().delete()
                for s_idx, (s_title, s_desc, req_photo, req_comp) in enumerate(p_data['steps']):
                    ProcedureStep.objects.create(
                        procedure=proc,
                        step_order=s_idx + 1,
                        title=s_title,
                        description=s_desc,
                        requires_photo=req_photo,
                        requires_compliance_check=req_comp,
                    )
                procedure_count += 1

    return {
        'organization_id': org.id,
        'admin_email': 'admin@orionstudio.com',
        'departments_created': len(departments),
        'users_created': 1 + len(departments) * 4,
        'entities_created': entity_count,
        'procedures_created': procedure_count,
    }
