from django.urls import path

from . import views

urlpatterns = [
    path('health/', views.health_check, name='api-health'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('auth/login/', views.login, name='auth-login'),
    path('auth/register/member/', views.register_member, name='register-member'),
    path('auth/register/staff/', views.register_staff, name='register-staff'),
    path('members/', views.member_list, name='member-list'),
    path('staff/', views.staff_list, name='staff-list'),
    path('claims/', views.claim_list, name='claim-list'),
    path('claims/<str:claim_id>/review/', views.claim_review, name='claim-review'),
    path('transfers/', views.transfer_list, name='transfer-list'),
    path('redeems/', views.redeem_list, name='redeem-list'),
    path('miles-packages/purchases/', views.miles_package_purchase_list, name='miles-package-purchase-list'),
    path('rewards/', views.reward_list, name='reward-list'),
    path('master-data/airports/', views.airport_list, name='airport-list'),
    path('master-data/airlines/', views.airline_list, name='airline-list'),
    path('master-data/tiers/', views.tier_list, name='tier-list'),
    path('master-data/miles-packages/', views.miles_package_list, name='miles-package-list'),
    path('rewards/redeem/', views.redeem_reward, name='redeem-reward'),
    path('miles-packages/purchase/', views.purchase_package, name='purchase-package'),
    path('reports/top-members/', views.top_member_report, name='top-member-report'),

]
