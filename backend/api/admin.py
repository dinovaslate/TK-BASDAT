from django.contrib import admin
from .models import (
    Award_Miles_Package,
    Bandara,
    Claim_Missing_Miles,
    Hadiah,
    Identitas,
    Maskapai,
    Member,
    Mitra,
    Penyedia,
    Staf,
    Tier,
    User,
    UserData,
)


@admin.register(User)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('email',)
    ordering = ('email',)


admin.site.register(UserData)
admin.site.register(Tier)
admin.site.register(Member)
admin.site.register(Penyedia)
admin.site.register(Maskapai)
admin.site.register(Staf)
admin.site.register(Mitra)
admin.site.register(Identitas)
admin.site.register(Award_Miles_Package)
admin.site.register(Bandara)
admin.site.register(Claim_Missing_Miles)
admin.site.register(Hadiah)
