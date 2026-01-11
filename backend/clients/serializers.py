from rest_framework import serializers
from .models import Client

class ClientSerializer(serializers.ModelSerializer):
    nom_complet = serializers.ReadOnlyField()
    total_achats = serializers.ReadOnlyField()
    nombre_achats = serializers.ReadOnlyField()
    boutique_nom = serializers.CharField(source='boutique.nom', read_only=True)
    
    class Meta:
        model = Client
        fields = [
            'id', 'nom', 'prenom', 'nom_complet', 'email', 'telephone', 
            'telephone2', 'adresse', 'ville', 'pays', 'boutique', 
            'boutique_nom', 'points_fidelite', 'notes', 'total_achats',
            'nombre_achats', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'points_fidelite', 'created_at', 'updated_at']


class ClientListSerializer(serializers.ModelSerializer):
    """Version simplifiée pour les listes"""
    nom_complet = serializers.ReadOnlyField()
    
    class Meta:
        model = Client
        fields = ['id', 'nom_complet', 'telephone', 'email', 'points_fidelite']