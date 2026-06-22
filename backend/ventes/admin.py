from django.contrib import admin
from .models import Vente, LigneVente, Paiement

class LigneVenteInline(admin.TabularInline):
    model = LigneVente
    extra = 0
    readonly_fields = ['sous_total', 'benefice']

class PaiementInline(admin.TabularInline):
    model = Paiement
    extra = 0

@admin.register(Vente)
class VenteAdmin(admin.ModelAdmin):
    list_display = ['numero_vente', 'boutique', 'vendeur', 'client', 
                    'montant_final', 'statut', 'statut_paiement', 'date_vente']
    list_filter = ['statut', 'statut_paiement', 'mode_paiement', 'boutique', 'date_vente']
    search_fields = ['numero_vente', 'client__nom', 'client__prenom']
    readonly_fields = ['numero_vente', 'montant_total', 'montant_remise', 
                       'montant_tva', 'montant_final', 'montant_restant', 'benefice_total']
    inlines = [LigneVenteInline, PaiementInline]

@admin.register(LigneVente)
class LigneVenteAdmin(admin.ModelAdmin):
    list_display = ['vente', 'produit', 'quantite', 'prix_unitaire', 'sous_total']
    list_filter = ['vente__date_vente']
    readonly_fields = ['sous_total', 'benefice']

@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ['vente', 'montant', 'mode_paiement', 'date_paiement']
    list_filter = ['mode_paiement', 'date_paiement']