from django.contrib import admin
from .models import Boutique

@admin.register(Boutique)
class BoutiqueAdmin(admin.ModelAdmin):
    list_display = ['nom', 'type_boutique', 'proprietaire', 'telephone', 'is_active', 'created_at']
    list_filter = ['type_boutique', 'is_active', 'created_at']
    search_fields = ['nom', 'adresse', 'telephone', 'email']
    filter_horizontal = ['gestionnaires']