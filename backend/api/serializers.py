from rest_framework import serializers

from .models import (
    Award_Miles_Package,
    Bandara,
    Claim_Missing_Miles,
    Hadiah,
    Identitas,
    Maskapai,
    Member,
    Mitra,
    Redeem,
    Staf,
    Tier,
    Transfer,
    User,
    UserData,
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email']


class UserDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserData
        fields = '__all__'


class TierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tier
        fields = '__all__'


class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = '__all__'


class MaskapaiSerializer(serializers.ModelSerializer):
    class Meta:
        model = Maskapai
        fields = '__all__'


class StafSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staf
        fields = '__all__'


class MitraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mitra
        fields = '__all__'


class IdentitasSerializer(serializers.ModelSerializer):
    class Meta:
        model = Identitas
        fields = '__all__'


class AwardMilesPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Award_Miles_Package
        fields = '__all__'


class BandaraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bandara
        fields = '__all__'


class ClaimMissingMilesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Claim_Missing_Miles
        fields = '__all__'


class TransferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transfer
        fields = '__all__'


class HadiahSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hadiah
        fields = '__all__'


class RedeemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Redeem
        fields = '__all__'
