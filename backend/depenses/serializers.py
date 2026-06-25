from rest_framework import serializers
from .models import Depense

class DepenseSerializer(serializers.ModelSerializer):
    effectuee_par_nom = serializers.CharField(
        source='effectuee_par.get_full_name',
        read_only=True
    )
    boutique_nom = serializers.CharField(source='boutique.nom', read_only=True)

    class Meta:
        model = Depense
        fields = [
            'id', 'boutique', 'boutique_nom', 'effectuee_par', 'effectuee_par_nom',
            'titre', 'description', 'montant', 'categorie', 'type_depense',
            'justificatif', 'statut_remboursement', 'date_depense',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'effectuee_par', 'created_at', 'updated_at']


class DepenseListSerializer(serializers.ModelSerializer):
    effectuee_par_nom = serializers.CharField(
        source='effectuee_par.get_full_name',
        read_only=True
    )
    boutique_nom = serializers.CharField(source='boutique.nom', read_only=True)

    class Meta:
        model = Depense
        fields = [
            'id', 'boutique_nom', 'effectuee_par_nom', 'titre',
            'montant', 'categorie', 'type_depense', 'statut_remboursement',
            'date_depense'
        ]