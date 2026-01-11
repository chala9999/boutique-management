from django.contrib import admin
from .models import Client

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['nom_complet', 'telephone', 'email', 'boutique', 
                    'points_fidelite', 'nombre_achats', 'created_at']
    list_filter = ['boutique', 'created_at']
    search_fields = ['nom', 'prenom', 'telephone', 'email']
    readonly_fields = ['total_achats', 'nombre_achats']