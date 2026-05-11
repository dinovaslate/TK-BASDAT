from django.urls import path

from . import views

urlpatterns = [
    path('health/', views.health_check, name='api-health'),
    path('auth/login/', views.login, name='auth-login'),
    path('auth/register/member/', views.register_member, name='register-member'),
    path('auth/register/staff/', views.register_staff, name='register-staff'),
    path('members/', views.member_list, name='member-list'),
    path('staff/', views.staff_list, name='staff-list'),
    path('claims/', views.claim_list, name='claim-list'),
    path('rewards/', views.reward_list, name='reward-list'),
    path('master-data/airports/', views.airport_list, name='airport-list'),
    path('master-data/airlines/', views.airline_list, name='airline-list'),
    path('master-data/tiers/', views.tier_list, name='tier-list'),
    path('master-data/miles-packages/', views.miles_package_list, name='miles-package-list'),
]
