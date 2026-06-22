from rest_framework import serializers
from .models import Client
from .models import Client, NiveauFidelite, Recompense, EchangeRecompense

class NiveauFideliteSerializer(serializers.ModelSerializer):
    class Meta:
        model = NiveauFidelite
        fields = ['id', 'nom', 'description', 'points_minimum', 'remise_pourcentage', 'couleur', 'icon']

class RecompenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recompense
        fields = ['id', 'nom', 'description', 'points_requis', 'image', 'stock']

class ClientSerializer(serializers.ModelSerializer):
    nom_complet = serializers.ReadOnlyField()
    total_achats = serializers.ReadOnlyField()
    nombre_achats = serializers.ReadOnlyField()
    boutique_nom = serializers.CharField(source='boutique.nom', read_only=True)

    niveau_info = NiveauFideliteSerializer(source='niveau', read_only=True)
    prochain_niveau_info = NiveauFideliteSerializer(source='prochain_niveau', read_only=True)
    points_restants_prochain_niveau = serializers.ReadOnlyField()
    
    class Meta:
        model = Client
        fields = [
            'id', 'nom', 'prenom', 'nom_complet', 'email', 'telephone', 
            'telephone2', 'adresse', 'ville', 'pays', 'boutique', 
            'boutique_nom', 'points_fidelite', 'notes', 'total_achats',
            'nombre_achats', 'niveau_info', 'prochain_niveau_info',
            'points_restants_prochain_niveau', 'date_dernier_achat',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'points_fidelite', 'created_at', 'updated_at']


class ClientListSerializer(serializers.ModelSerializer):
    """Version simplifiée pour les listes"""
    nom_complet = serializers.ReadOnlyField()
    
    class Meta:
        model = Client
        fields = ['id', 'nom', 'prenom', 'nom_complet', 'telephone', 'telephone2', 'adresse', 'email', 'ville', 'pays', 'boutique', 'notes', 'points_fidelite']