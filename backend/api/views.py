from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import DatabaseError

from . import sql_queries


@api_view(['GET'])
def health_check(request):
    return Response({'status': 'ok', 'message': 'AeroMiles API is running'})


@api_view(['GET'])
def dashboard(request):
    email = request.query_params.get('email')
    if not email:
        return Response({'error': 'Email wajib diisi.'}, status=400)

    try:
        return Response(sql_queries.get_dashboard(email))
    except sql_queries.DashboardError as error:
        return Response({'error': str(error)}, status=error.status_code)
    except DatabaseError as error:
        return Response({'error': sql_queries.database_error_message(error)}, status=400)


@api_view(['POST'])
def login(request):
    try:
        user = sql_queries.verify_login(
            request.data.get('email'),
            request.data.get('password'),
        )
    except DatabaseError as error:
        return Response({'error': sql_queries.database_error_message(error)}, status=401)

    return Response({'message': 'Login berhasil.', 'user': user})


@api_view(['POST'])
def register_member(request):
    try:
        member = sql_queries.register_member(request.data)
    except DatabaseError as error:
        return Response({'error': sql_queries.database_error_message(error)}, status=400)

    return Response({'message': 'Registrasi member berhasil.', 'member': member}, status=201)


@api_view(['POST'])
def register_staff(request):
    try:
        staff = sql_queries.register_staff(request.data)
    except DatabaseError as error:
        return Response({'error': sql_queries.database_error_message(error)}, status=400)

    return Response({'message': 'Registrasi staf berhasil.', 'staff': staff}, status=201)


@api_view(['GET'])
def member_list(request):
    return Response(sql_queries.get_members())


@api_view(['GET'])
def staff_list(request):
    return Response(sql_queries.get_staff())


@api_view(['GET'])
def claim_list(request):
    return Response(sql_queries.get_claims())


@api_view(['GET'])
def reward_list(request):
    return Response(sql_queries.get_rewards())


@api_view(['GET'])
def airport_list(request):
    return Response(sql_queries.get_airports())


@api_view(['GET'])
def airline_list(request):
    return Response(sql_queries.get_airlines())


@api_view(['GET'])
def tier_list(request):
    return Response(sql_queries.get_tiers())


@api_view(['GET'])
def miles_package_list(request):
    return Response(sql_queries.get_miles_packages())


@api_view(['POST'])
def redeem_reward(request):
    email = request.data.get('email')
    reward_code = request.data.get('kode_hadiah')

    if not email or not reward_code:
        return Response({'error': 'Email dan kode hadiah wajib diisi.'}, status=400)

    try:
        message = sql_queries.redeem_reward(email, reward_code)
        return Response({'message': message})
    except DatabaseError as error:
        return Response({'error': sql_queries.database_error_message(error)}, status=400)


@api_view(['POST'])
def purchase_package(request):
    email = request.data.get('email')
    package_id = request.data.get('id_paket')

    if not email or not package_id:
        return Response({'error': 'Email dan ID paket wajib diisi.'}, status=400)

    try:
        message = sql_queries.purchase_package(email, package_id)
        return Response({'message': message})
    except DatabaseError as error:
        return Response({'error': sql_queries.database_error_message(error)}, status=400)
