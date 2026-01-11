from rest_framework import serializers
from .models import Categorie, Produit, ImageProduit

class CategorieSerializer(serializers.ModelSerializer):
    nombre_produits = serializers.SerializerMethodField()
    
    class Meta:
        model = Categorie
        fields = ['id', 'nom', 'description', 'image', 'nombre_produits', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_nombre_produits(self, obj):
        return obj.produits.count()


class ImageProduitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImageProduit
        fields = ['id', 'image', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProduitSerializer(serializers.ModelSerializer):
    categorie_info = CategorieSerializer(source='categorie', read_only=True)
    boutique_nom = serializers.CharField(source='boutique.nom', read_only=True)
    images = ImageProduitSerializer(many=True, read_only=True)
    marge_benefice = serializers.ReadOnlyField()
    pourcentage_marge = serializers.ReadOnlyField()
    stock_faible = serializers.ReadOnlyField()
    
    class Meta:
        model = Produit
        fields = [
            'id', 'nom', 'description', 'code_barre', 'reference',
            'categorie', 'categorie_info', 'boutique', 'boutique_nom',
            'prix_achat', 'prix_vente', 'prix_promo', 'stock_actuel',
            'stock_minimum', 'stock_maximum', 'unite', 'image_principale',
            'images', 'is_active', 'marge_benefice', 'pourcentage_marge',
            'stock_faible', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validation personnalisée"""
        if data.get('prix_vente', 0) < data.get('prix_achat', 0):
            raise serializers.ValidationError(
                "Le prix de vente ne peut pas être inférieur au prix d'achat"
            )
        
        if data.get('stock_actuel', 0) < 0:
            raise serializers.ValidationError(
                "Le stock ne peut pas être négatif"
            )
        
        return data


class ProduitListSerializer(serializers.ModelSerializer):
    """Version simplifiée pour les listes"""
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    boutique_nom = serializers.CharField(source='boutique.nom', read_only=True)
    stock_faible = serializers.ReadOnlyField()
    
    class Meta:
        model = Produit
        fields = [
            'id', 'nom', 'reference', 'categorie_nom', 'boutique_nom',
            'prix_vente', 'stock_actuel', 'stock_faible', 'is_active',
            'image_principale'
        ]