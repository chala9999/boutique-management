from django.contrib import admin
from .models import (
    Fournisseur, 
    Commande, 
    LigneCommande, 
    PaiementCommande,
    ReceptionCommande,
    LigneReception
)

@admin.register(Fournisseur)
class FournisseurAdmin(admin.ModelAdmin):
    list_display = ['nom', 'entreprise', 'telephone', 'email', 'boutique', 
                    'is_active', 'nombre_commandes', 'created_at']
    list_filter = ['boutique', 'is_active', 'created_at']
    search_fields = ['nom', 'entreprise', 'telephone', 'email']


class LigneCommandeInline(admin.TabularInline):
    model = LigneCommande
    extra = 0
    readonly_fields = ['sous_total', 'quantite_restante']


class PaiementCommandeInline(admin.TabularInline):
    model = PaiementCommande
    extra = 0


@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    list_display = ['numero_commande', 'fournisseur', 'boutique', 'montant_total',
                    'statut', 'statut_paiement', 'date_commande', 'date_livraison_prevue']
    list_filter = ['statut', 'statut_paiement', 'boutique', 'date_commande']
    search_fields = ['numero_commande', 'fournisseur__nom']
    readonly_fields = ['numero_commande', 'montant_total', 'montant_restant']
    inlines = [LigneCommandeInline, PaiementCommandeInline]


class LigneReceptionInline(admin.TabularInline):
    model = LigneReception
    extra = 0


@admin.register(ReceptionCommande)
class ReceptionCommandeAdmin(admin.ModelAdmin):
    list_display = ['commande', 'received_by', 'numero_bon_livraison', 'date_reception']
    list_filter = ['date_reception']
    search_fields = ['commande__numero_commande', 'numero_bon_livraison']
    inlines = [LigneReceptionInline]