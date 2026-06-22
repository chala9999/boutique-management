from django.db import models
from django.conf import settings
from boutiques.models import Boutique
from produits.models import Produit

class Fournisseur(models.Model):
    # Informations de base
    nom = models.CharField(max_length=200)
    entreprise = models.CharField(max_length=200, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    telephone = models.CharField(max_length=20)
    telephone2 = models.CharField(max_length=20, blank=True, null=True)
    
    # Adresse
    adresse = models.TextField(blank=True, null=True)
    ville = models.CharField(max_length=100, blank=True, null=True)
    pays = models.CharField(max_length=100, blank=True, null=True)
    
    # Informations bancaires
    numero_compte = models.CharField(max_length=50, blank=True, null=True)
    banque = models.CharField(max_length=100, blank=True, null=True)
    
    # Boutique
    boutique = models.ForeignKey(
        Boutique, 
        on_delete=models.CASCADE, 
        related_name='fournisseurs'
    )
    
    # Statut
    is_active = models.BooleanField(default=True)
    
    # Notes
    notes = models.TextField(blank=True, null=True)
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Fournisseur'
        verbose_name_plural = 'Fournisseurs'
        ordering = ['nom']
    
    def __str__(self):
        return self.nom
    
    @property
    def total_commandes(self):
        """Total des commandes passées"""
        return self.commandes.filter(statut='livree').aggregate(
            models.Sum('montant_total')
        )['montant_total__sum'] or 0
    
    @property
    def nombre_commandes(self):
        """Nombre de commandes"""
        return self.commandes.count()


class Commande(models.Model):
    # Référence unique
    numero_commande = models.CharField(max_length=50, unique=True)
    
    # Fournisseur et boutique
    fournisseur = models.ForeignKey(
        Fournisseur, 
        on_delete=models.CASCADE, 
        related_name='commandes'
    )
    boutique = models.ForeignKey(
        Boutique, 
        on_delete=models.CASCADE, 
        related_name='commandes'
    )
    
    # Utilisateur qui a créé la commande
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='commandes_creees'
    )
    
    # Montants
    montant_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_paye = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_restant = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Statut
    STATUT_CHOICES = [
        ('en_attente', 'En Attente'),
        ('confirmee', 'Confirmée'),
        ('en_cours', 'En Cours de Livraison'),
        ('livree', 'Livrée'),
        ('annulee', 'Annulée'),
    ]
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    
    # Statut paiement
    STATUT_PAIEMENT_CHOICES = [
        ('paye', 'Payé'),
        ('impaye', 'Impayé'),
        ('partiel', 'Paiement Partiel'),
    ]
    statut_paiement = models.CharField(
        max_length=20, 
        choices=STATUT_PAIEMENT_CHOICES, 
        default='impaye'
    )
    
    # Dates
    date_commande = models.DateTimeField(auto_now_add=True)
    date_livraison_prevue = models.DateField(blank=True, null=True)
    date_livraison_reelle = models.DateField(blank=True, null=True)
    
    # Notes
    notes = models.TextField(blank=True, null=True)
    
    # Dates de mise à jour
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'
        ordering = ['-date_commande']
    
    def __str__(self):
        return f"Commande {self.numero_commande} - {self.fournisseur.nom}"
    
    def calculer_totaux(self):
        """Calcule les totaux de la commande"""
        self.montant_total = sum(
            ligne.sous_total for ligne in self.lignes.all()
        )
        
        self.montant_restant = self.montant_total - self.montant_paye
        
        # Statut paiement
        if self.montant_paye >= self.montant_total:
            self.statut_paiement = 'paye'
            self.montant_restant = 0
        elif self.montant_paye > 0:
            self.statut_paiement = 'partiel'
        else:
            self.statut_paiement = 'impaye'
        
        self.save()
    
    def save(self, *args, **kwargs):
        # Génère un numéro de commande unique si non existant
        if not self.numero_commande:
            import datetime
            date = datetime.datetime.now()
            self.numero_commande = f"C{date.strftime('%Y%m%d%H%M%S')}"
        super().save(*args, **kwargs)


class LigneCommande(models.Model):
    """Ligne de commande (produit commandé)"""
    commande = models.ForeignKey(
        Commande, 
        on_delete=models.CASCADE, 
        related_name='lignes'
    )
    produit = models.ForeignKey(
        Produit, 
        on_delete=models.PROTECT,
        related_name='lignes_commande'
    )
    
    # Prix et quantité
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    quantite_commandee = models.DecimalField(max_digits=10, decimal_places=2)
    quantite_recue = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Sous-total
    sous_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Ligne de commande'
        verbose_name_plural = 'Lignes de commande'
    
    def __str__(self):
        return f"{self.produit.nom} x {self.quantite_commandee}"
    
    @property
    def quantite_restante(self):
        """Quantité restant à recevoir"""
        return self.quantite_commandee - self.quantite_recue
    
    def save(self, *args, **kwargs):
        # Calcule le sous-total
        self.sous_total = float(self.prix_unitaire) * float(self.quantite_commandee)
        super().save(*args, **kwargs)


class PaiementCommande(models.Model):
    """Paiements effectués pour une commande"""
    commande = models.ForeignKey(
        Commande, 
        on_delete=models.CASCADE, 
        related_name='paiements'
    )
    
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    
    MODE_PAIEMENT_CHOICES = [
        ('especes', 'Espèces'),
        ('carte', 'Carte Bancaire'),
        ('mobile_money', 'Mobile Money'),
        ('cheque', 'Chèque'),
        ('virement', 'Virement'),
    ]
    mode_paiement = models.CharField(max_length=20, choices=MODE_PAIEMENT_CHOICES)
    
    # Référence (numéro de transaction, etc.)
    reference = models.CharField(max_length=100, blank=True, null=True)
    
    # Notes
    notes = models.TextField(blank=True, null=True)
    
    # Dates
    date_paiement = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Paiement Commande'
        verbose_name_plural = 'Paiements Commandes'
        ordering = ['-date_paiement']
    
    def __str__(self):
        return f"Paiement {self.montant} - {self.commande.numero_commande}"


class ReceptionCommande(models.Model):
    """Réception de marchandises (livraison)"""
    commande = models.ForeignKey(
        Commande, 
        on_delete=models.CASCADE, 
        related_name='receptions'
    )
    
    # Utilisateur qui a reçu la livraison
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='receptions_effectuees'
    )
    
    # Informations sur la réception
    numero_bon_livraison = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Date
    date_reception = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Réception Commande'
        verbose_name_plural = 'Réceptions Commandes'
        ordering = ['-date_reception']
    
    def __str__(self):
        return f"Réception {self.commande.numero_commande} - {self.date_reception}"


class LigneReception(models.Model):
    """Détail des produits reçus lors d'une livraison"""
    reception = models.ForeignKey(
        ReceptionCommande, 
        on_delete=models.CASCADE, 
        related_name='lignes'
    )
    ligne_commande = models.ForeignKey(
        LigneCommande, 
        on_delete=models.CASCADE,
        related_name='receptions'
    )
    
    quantite_recue = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Notes (si problème, produit endommagé, etc.)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Ligne de réception'
        verbose_name_plural = 'Lignes de réception'
    
    def __str__(self):
        return f"{self.ligne_commande.produit.nom} - Reçu: {self.quantite_recue}"