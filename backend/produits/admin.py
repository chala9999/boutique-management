from django.contrib import admin
from .models import Categorie, Produit, ImageProduit

@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ['nom', 'created_at']
    search_fields = ['nom']

class ImageProduitInline(admin.TabularInline):
    model = ImageProduit
    extra = 1

@admin.register(Produit)
class ProduitAdmin(admin.ModelAdmin):
    list_display = ['nom', 'reference', 'boutique', 'categorie', 'prix_vente', 
                    'stock_actuel', 'stock_faible', 'is_active']
    list_filter = ['categorie', 'boutique', 'is_active', 'created_at']
    search_fields = ['nom', 'reference', 'code_barre']
    inlines = [ImageProduitInline]
    
    def stock_faible(self, obj):
        return obj.stock_faible
    stock_faible.boolean = True
    stock_faible.short_description = 'Stock Faible'