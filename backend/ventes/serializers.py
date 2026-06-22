from rest_framework import serializers
from .models import Vente, LigneVente, Paiement
from produits.serializers import ProduitListSerializer
from clients.serializers import ClientListSerializer

class LigneVenteSerializer(serializers.ModelSerializer):
    produit_info = ProduitListSerializer(source='produit', read_only=True)
    benefice = serializers.ReadOnlyField()
    
    class Meta:
        model = LigneVente
        fields = [
            'id', 'vente', 'produit', 'produit_info', 'prix_unitaire',
            'prix_achat_unitaire', 'quantite', 'remise_pourcentage',
            'remise_montant', 'sous_total', 'benefice', 'created_at'
        ]
        read_only_fields = ['id', 'sous_total', 'created_at']
    
    def validate(self, data):
        """Vérifie le stock disponible"""
        produit = data.get('produit')
        quantite = data.get('quantite', 0)
        
        if produit and quantite > produit.stock_actuel:
            raise serializers.ValidationError(
                f"Stock insuffisant. Stock disponible: {produit.stock_actuel}"
            )
        
        return data


class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = [
            'id', 'vente', 'montant', 'mode_paiement', 'reference',
            'notes', 'date_paiement'
        ]
        read_only_fields = ['id', 'date_paiement']


class VenteSerializer(serializers.ModelSerializer):
    lignes = LigneVenteSerializer(many=True, read_only=True)
    paiements = PaiementSerializer(many=True, read_only=True)
    vendeur_nom = serializers.CharField(source='vendeur.get_full_name', read_only=True)
    boutique_nom = serializers.CharField(source='boutique.nom', read_only=True)
    client_info = ClientListSerializer(source='client', read_only=True)
    benefice_total = serializers.ReadOnlyField()
    
    class Meta:
        model = Vente
        fields = [
            'id', 'numero_vente', 'boutique', 'boutique_nom', 'vendeur',
            'vendeur_nom', 'client', 'client_info', 'montant_total',
            'montant_remise', 'montant_final', 'tva_pourcentage',
            'montant_tva', 'remise_type', 'remise_valeur', 'mode_paiement',
            'statut', 'statut_paiement', 'montant_paye', 'montant_restant',
            'notes', 'lignes', 'paiements', 'benefice_total',
            'date_vente', 'updated_at'
        ]
        read_only_fields = [
            'id', 'numero_vente', 'montant_total', 'montant_remise',
            'montant_final', 'montant_tva', 'montant_restant',
            'date_vente', 'updated_at'
        ]


class VenteListSerializer(serializers.ModelSerializer):
    """Version simplifiée pour les listes"""
    vendeur_nom = serializers.CharField(source='vendeur.get_full_name', read_only=True)
    boutique_nom = serializers.CharField(source='boutique.nom', read_only=True)
    client_nom = serializers.CharField(source='client.nom_complet', read_only=True)
    
    class Meta:
        model = Vente
        fields = [
            'id', 'numero_vente', 'boutique_nom', 'vendeur_nom',
            'client_nom', 'montant_final', 'mode_paiement', 'statut',
            'statut_paiement', 'date_vente'
        ]


class CreerVenteSerializer(serializers.Serializer):
    """Serializer pour créer une vente complète avec ses lignes"""
    boutique = serializers.IntegerField()
    client = serializers.IntegerField(required=False, allow_null=True)
    mode_paiement = serializers.ChoiceField(choices=Vente.MODE_PAIEMENT_CHOICES)
    remise_type = serializers.ChoiceField(
        choices=Vente.REMISE_TYPE_CHOICES, 
        default='pourcentage'
    )
    remise_valeur = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0
    )
    tva_pourcentage = serializers.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0
    )
    montant_paye = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    # Lignes de vente
    lignes = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
    def validate_lignes(self, lignes):
        """Valide les lignes de vente"""
        if not lignes:
            raise serializers.ValidationError("Au moins une ligne est requise")
        
        for ligne in lignes:
            if 'produit' not in ligne or 'quantite' not in ligne:
                raise serializers.ValidationError(
                    "Chaque ligne doit avoir 'produit' et 'quantite'"
                )
        
        return lignes