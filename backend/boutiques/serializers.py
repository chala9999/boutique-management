from rest_framework import serializers
from .models import Boutique
from users.serializers import UserSerializer

class BoutiqueSerializer(serializers.ModelSerializer):
    proprietaire_info = UserSerializer(source='proprietaire', read_only=True)
    gestionnaires_info = UserSerializer(source='gestionnaires', many=True, read_only=True)
    nombre_produits = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Boutique
        fields = [
            'id', 'nom', 'description', 'adresse', 'telephone', 'email',
            'type_boutique', 'proprietaire', 'proprietaire_info',
            'gestionnaires', 'gestionnaires_info', 'is_active', 'logo', 'logo_url',
            'nombre_produits', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'proprietaire']
    
    def get_nombre_produits(self, obj):
        return obj.produits.count()
    
    def get_logo_url(self, obj):
        if obj.logo:
            return obj.logo.url
        return None


class BoutiqueListSerializer(serializers.ModelSerializer):
    """Version simplifiée pour les listes"""
    proprietaire_nom = serializers.CharField(source='proprietaire.get_full_name', read_only=True)
    nombre_produits = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Boutique
        fields = [
            'id', 'nom', 'adresse', 'telephone', 'description', 'email', 'type_boutique',
            'proprietaire_nom', 'is_active', 'logo', 'logo_url', 'nombre_produits'
        ]
    
    def get_nombre_produits(self, obj):
        return obj.produits.count()
    
    def get_logo_url(self, obj):
        if obj.logo:
            return obj.logo.url
        return None