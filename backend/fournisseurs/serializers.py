from rest_framework import serializers
from .models import (
    Fournisseur, 
    Commande, 
    LigneCommande, 
    PaiementCommande,
    ReceptionCommande,
    LigneReception
)
from produits.serializers import ProduitListSerializer

class FournisseurSerializer(serializers.ModelSerializer):
    total_commandes = serializers.ReadOnlyField()
    nombre_commandes = serializers.ReadOnlyField()
    boutique_nom = serializers.CharField(source='boutique.nom', read_only=True)
    
    class Meta:
        model = Fournisseur
        fields = [
            'id', 'nom', 'entreprise', 'email', 'telephone', 'telephone2',
            'adresse', 'ville', 'pays', 'numero_compte', 'banque',
            'boutique', 'boutique_nom', 'is_active', 'notes',
            'total_commandes', 'nombre_commandes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FournisseurListSerializer(serializers.ModelSerializer):
    """Version simplifiée pour les listes"""
    nombre_commandes = serializers.ReadOnlyField()
    
    class Meta:
        model = Fournisseur
        fields = ['id', 'nom', 'entreprise', 'telephone', 'email', 
                  'is_active', 'nombre_commandes']


class LigneCommandeSerializer(serializers.ModelSerializer):
    produit_info = ProduitListSerializer(source='produit', read_only=True)
    quantite_restante = serializers.ReadOnlyField()
    
    class Meta:
        model = LigneCommande
        fields = [
            'id', 'commande', 'produit', 'produit_info', 'prix_unitaire',
            'quantite_commandee', 'quantite_recue', 'quantite_restante',
            'sous_total', 'created_at'
        ]
        read_only_fields = ['id', 'sous_total', 'created_at']


class PaiementCommandeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaiementCommande
        fields = [
            'id', 'commande', 'montant', 'mode_paiement', 'reference',
            'notes', 'date_paiement'
        ]
        read_only_fields = ['id', 'date_paiement']


class LigneReceptionSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(
        source='ligne_commande.produit.nom', 
        read_only=True
    )
    
    class Meta:
        model = LigneReception
        fields = ['id', 'reception', 'ligne_commande', 'produit_nom',
                  'quantite_recue', 'notes']
        read_only_fields = ['id']


class ReceptionCommandeSerializer(serializers.ModelSerializer):
    lignes = LigneReceptionSerializer(many=True, read_only=True)
    received_by_nom = serializers.CharField(
        source='received_by.get_full_name', 
        read_only=True
    )
    
    class Meta:
        model = ReceptionCommande
        fields = [
            'id', 'commande', 'received_by', 'received_by_nom',
            'numero_bon_livraison', 'notes', 'lignes', 'date_reception'
        ]
        read_only_fields = ['id', 'date_reception']


class CommandeSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeSerializer(many=True, read_only=True)
    paiements = PaiementCommandeSerializer(many=True, read_only=True)
    receptions = ReceptionCommandeSerializer(many=True, read_only=True)
    fournisseur_info = FournisseurListSerializer(source='fournisseur', read_only=True)
    boutique_nom = serializers.CharField(source='boutique.nom', read_only=True)
    created_by_nom = serializers.CharField(
        source='created_by.get_full_name', 
        read_only=True
    )
    
    class Meta:
        model = Commande
        fields = [
            'id', 'numero_commande', 'fournisseur', 'fournisseur_info',
            'boutique', 'boutique_nom', 'created_by', 'created_by_nom',
            'montant_total', 'montant_paye', 'montant_restant',
            'statut', 'statut_paiement', 'date_commande',
            'date_livraison_prevue', 'date_livraison_reelle', 'notes',
            'lignes', 'paiements', 'receptions', 'updated_at'
        ]
        read_only_fields = [
            'id', 'numero_commande', 'montant_total', 'montant_restant',
            'date_commande', 'updated_at'
        ]


class CommandeListSerializer(serializers.ModelSerializer):
    """Version simplifiée pour les listes"""
    fournisseur_nom = serializers.CharField(source='fournisseur.nom', read_only=True)
    boutique_nom = serializers.CharField(source='boutique.nom', read_only=True)
    
    class Meta:
        model = Commande
        fields = [
            'id', 'numero_commande', 'fournisseur_nom', 'boutique_nom',
            'montant_total', 'statut', 'statut_paiement', 'date_commande',
            'date_livraison_prevue'
        ]


class CreerCommandeSerializer(serializers.Serializer):
    """Serializer pour créer une commande complète"""
    fournisseur = serializers.IntegerField()
    boutique = serializers.IntegerField()
    date_livraison_prevue = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    # Lignes de commande
    lignes = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
    def validate_lignes(self, lignes):
        """Valide les lignes de commande"""
        if not lignes:
            raise serializers.ValidationError("Au moins une ligne est requise")
        
        for ligne in lignes:
            if 'produit' not in ligne or 'quantite' not in ligne or 'prix_unitaire' not in ligne:
                raise serializers.ValidationError(
                    "Chaque ligne doit avoir 'produit', 'quantite' et 'prix_unitaire'"
                )
        
        return lignes


class RecevoirCommandeSerializer(serializers.Serializer):
    """Serializer pour recevoir une livraison"""
    numero_bon_livraison = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    # Lignes reçues
    lignes = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
    def validate_lignes(self, lignes):
        """Valide les lignes de réception"""
        if not lignes:
            raise serializers.ValidationError("Au moins une ligne est requise")
        
        for ligne in lignes:
            if 'ligne_commande' not in ligne or 'quantite_recue' not in ligne:
                raise serializers.ValidationError(
                    "Chaque ligne doit avoir 'ligne_commande' et 'quantite_recue'"
                )
        
        return lignes