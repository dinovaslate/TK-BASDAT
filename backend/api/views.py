from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Award_Miles_Package, Bandara, Claim_Missing_Miles, Hadiah, Maskapai, Member, Staf, Tier
from .serializers import (
    AwardMilesPackageSerializer,
    BandaraSerializer,
    ClaimMissingMilesSerializer,
    HadiahSerializer,
    MaskapaiSerializer,
    MemberSerializer,
    StafSerializer,
    TierSerializer,
)


@api_view(['GET'])
def health_check(request):
    return Response({'status': 'ok', 'message': 'AeroMiles API is running'})


@api_view(['GET'])
def member_list(request):
    members = Member.objects.all()
    serializer = MemberSerializer(members, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def staff_list(request):
    staff = Staf.objects.all()
    serializer = StafSerializer(staff, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def claim_list(request):
    claims = Claim_Missing_Miles.objects.all()
    serializer = ClaimMissingMilesSerializer(claims, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def reward_list(request):
    rewards = Hadiah.objects.all()
    serializer = HadiahSerializer(rewards, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def airport_list(request):
    airports = Bandara.objects.all()
    serializer = BandaraSerializer(airports, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def airline_list(request):
    airlines = Maskapai.objects.all()
    serializer = MaskapaiSerializer(airlines, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def tier_list(request):
    tiers = Tier.objects.all()
    serializer = TierSerializer(tiers, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def miles_package_list(request):
    packages = Award_Miles_Package.objects.all()
    serializer = AwardMilesPackageSerializer(packages, many=True)
    return Response(serializer.data)
