from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager

# Create your models here.
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)

        user = self.model(email=email, **extra_fields)

        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, password, **extra_fields)

# User class
# Only saves email and password for logins
class User(AbstractUser):
    username = None

    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email

# User data class
# Saves non-authenticating data for User
class UserData(models.Model):
    user = models.OneToOneField(to=settings.AUTH_USER_MODEL, primary_key=True, on_delete=models.CASCADE)

    SALUTATION_CHOICES = [
        ('Mr.', 'Mr.'),
        ('Ms.', 'Ms.'),
        ('Mrs.', 'Mrs.'),
        ('Dr.', 'Dr.'),
        ('', 'No Salutation')
    ]

    # Name
    salutation = models.CharField(max_length=10, choices=SALUTATION_CHOICES)
    first_mid_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    # Phone
    country_code = models.CharField(max_length=5)
    mobile_number = models.CharField(max_length=20)

    tanggal_lahir = models.DateField()
    kewarganegaraan = models.CharField(max_length=50)

# Tier class
# Saves data for miles tiers
class Tier(models.Model):
    id_tier = models.CharField(max_length=10, primary_key=True)
    nama = models.CharField(max_length=50)
    minimal_frekuensi_terbang = models.IntegerField()
    minimal_tier_miles = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'tier'

# Member class
# Saves user data exclusive to Member
class Member(models.Model):
    email = models.OneToOneField(to=settings.AUTH_USER_MODEL, to_field='email', db_column='email', on_delete=models.CASCADE, primary_key=True)

    nomor_member = models.CharField(max_length=20) # auto-increment, format: M0001, M0002, ...
    tanggal_bergabung = models.DateField()
    id_tier = models.ForeignKey(to=Tier, to_field='id_tier', db_column='id_tier', on_delete=models.CASCADE)

    # Derived attributes
    award_miles = models.IntegerField()
    total_miles = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'member'

# Penyedia class
# Information for reward providers (airlines + partners)
class Penyedia(models.Model):
    id = models.IntegerField(primary_key=True) # auto-increment, format: 1, 2, 3, ...

    class Meta:
        managed = False
        db_table = 'penyedia'

# Maskapai class
# Information for airlines
class Maskapai(models.Model):
    kode_maskapai = models.CharField(max_length=10, primary_key=True)
    id_penyedia = models.OneToOneField(to=Penyedia, to_field='id', db_column='id_penyedia', on_delete=models.CASCADE)
    nama_maskapai = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'maskapai'

# Staf class
# Information for staff (employees of an airline)
class Staf(models.Model):
    email = models.OneToOneField(to=settings.AUTH_USER_MODEL, to_field='email', db_column='email', on_delete=models.CASCADE, primary_key=True)

    id_staf = models.CharField(max_length=20) # auto-increment, format: S0001, S0002, ...
    kode_maskapai = models.ForeignKey(to=Maskapai, to_field='kode_maskapai', db_column='kode_maskapai', on_delete=models.CASCADE)

    class Meta:
        managed = False
        db_table = 'staf'

# Mitra class
# Information for non-airline partners
class Mitra(models.Model):
    email_mitra = models.CharField(max_length=100, primary_key=True)
    nama_mitra = models.CharField(max_length=100)
    tanggal_kerja_sama = models.DateField()
    id_penyedia = models.OneToOneField(to=Penyedia, to_field='id', db_column='id_penyedia', on_delete=models.CASCADE)

    class Meta:
        managed = False
        db_table = 'mitra'

# Identitas class
# Saves identity documents for users
class Identitas(models.Model):
    JENIS_CHOICES = [
        ('Paspor', 'Paspor'),
        ('KTP', 'KTP'),
        ('SIM', 'SIM')
    ]

    nomor = models.CharField(max_length=50, primary_key=True)
    email_member = models.ForeignKey(to=Member, to_field='email', db_column='email_member', on_delete=models.CASCADE)
    tanggal_habis = models.DateField()
    tanggal_terbit = models.DateField()
    negara_penerbit = models.CharField(max_length=50)
    jenis = models.CharField(max_length=30, choices=JENIS_CHOICES)

    class Meta:
        managed = False
        db_table = 'identitas'

# Award Miles Package class
# Saves data for miles packages users can buy
class Award_Miles_Package(models.Model):
    id = models.CharField(max_length=20, primary_key=True) # auto-increment, format: AMP-001, AMP-002, ...
    harga_paket = models.FloatField()
    jumlah_award_miles = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'award_miles_package'

# Member Award Miles Package class
# Saves information on purchase transactions of miles packages
class Member_Award_Miles_Package(models.Model):
    id_award_miles_package = models.ForeignKey(to=Award_Miles_Package, to_field='id', db_column='id_award_miles_package', on_delete=models.CASCADE)
    email_member = models.ForeignKey(to=Member, to_field='email', db_column='email_member', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(db_column='time_stamp')
    pk = models.CompositePrimaryKey('id_award_miles_package', 'email_member', 'timestamp')

    class Meta:
        managed = False
        db_table = 'member_award_miles_package'

# Bandara class
# Saves information about airports
class Bandara(models.Model):
    iata_code = models.CharField(max_length=3, primary_key=True)
    nama = models.CharField(max_length=100)
    kota = models.CharField(max_length=100)
    negara = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'bandara'

# Claim Missing Miles class
# Saves information about missing miles claims from users
class Claim_Missing_Miles(models.Model):
    KELAS_CHOICES = [
        ('Economy', 'Economy'),
        ('Business', 'Business'),
        ('First', 'First'),
    ]
    STATUS_CHOICES = [
        ('Menunggu', 'Menunggu'),
        ('Disetujui', 'Disetujui'),
        ('Ditolak', 'Ditolak'),
    ]

    id = models.CharField(max_length=20, primary_key=True) # auto-increment, format: CLM-001, CLM-002, ...
    email_member = models.ForeignKey(to=Member, to_field='email', db_column='email_member', on_delete=models.CASCADE)
    email_staf = models.ForeignKey(null=True, to=Staf, to_field='email', db_column='email_staf', on_delete=models.CASCADE)
    maskapai = models.ForeignKey(to=Maskapai, to_field='kode_maskapai', db_column='maskapai', on_delete=models.CASCADE)
    bandara_asal = models.ForeignKey(to=Bandara, to_field='iata_code', db_column='bandara_asal', on_delete=models.CASCADE, related_name='bandara_asal_set')
    bandara_tujuan = models.ForeignKey(to=Bandara, to_field='iata_code', db_column='bandara_tujuan', on_delete=models.CASCADE, related_name='bandara_tujuan_set')
    tanggal_penerbangan = models.DateField()
    flight_number = models.CharField(max_length=10)
    nomor_tiket = models.CharField(max_length=20)
    kelas_kabin = models.CharField(max_length=20, choices=KELAS_CHOICES)
    pnr = models.CharField(max_length=10)
    status_penerimaan = models.CharField(max_length=20, default='Menunggu', choices=STATUS_CHOICES)
    timestamp = models.DateTimeField(db_column='time_stamp')

    class Meta:
        managed = False
        db_table = 'claim_missing_miles'

# Transfer class
# Save information on miles transfer between members
class Transfer(models.Model):
    email_member_1 = models.ForeignKey(to=Member, to_field='email', db_column='email_member_1', on_delete=models.CASCADE, related_name='trf_sender_set')
    email_member_2 = models.ForeignKey(to=Member, to_field='email', db_column='email_member_2', on_delete=models.CASCADE, related_name='trf_receiver_set')
    timestamp = models.DateTimeField(db_column='time_stamp')
    jumlah = models.IntegerField()
    catatan = models.CharField(max_length=255)
    pk = models.CompositePrimaryKey('email_member_1', 'email_member_2', 'timestamp')

    class Meta:
        managed = False
        db_table = 'transfer'

# Hadiah class
# Saves information on rewards buyable with miles
class Hadiah(models.Model):
    kode_hadiah = models.CharField(max_length=20, primary_key=True) # auto-increment, format: RWD-001, RWD-002, ...
    nama = models.CharField(max_length=100)
    miles = models.IntegerField()
    deskripsi = models.TextField()
    valid_start_date = models.DateField()
    program_end = models.DateField()
    id_penyedia = models.ForeignKey(to=Penyedia, to_field='id', db_column='id_penyedia', on_delete=models.CASCADE)

    class Meta:
        managed = False
        db_table = 'hadiah'

# Redeem class
# Saves information on purchases of rewards with miles
class Redeem(models.Model):
    email_member = models.ForeignKey(to=Member, to_field='email', db_column='email_member', on_delete=models.CASCADE)
    kode_hadiah = models.ForeignKey(to=Hadiah, to_field='kode_hadiah', db_column='kode_hadiah', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(db_column='time_stamp')
    pk = models.CompositePrimaryKey('email_member', 'kode_hadiah', 'timestamp')

    class Meta:
        managed = False
        db_table = 'redeem'
