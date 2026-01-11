from django.db import models
from django.conf import settings
from boutiques.models import Boutique
from produits.models import Produit
from clients.models import Client

class Vente(models.Model):
    # Référence unique
    numero_vente = models.CharField(max_length=50, unique=True)
    
    # Boutique et vendeur
    boutique = models.ForeignKey(
        Boutique, 
        on_delete=models.CASCADE, 
        related_name='ventes'
    )
    vendeur = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='ventes_effectuees'
    )
    
    # Client (optionnel)
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='achats'
    )
    
    # Montants
    montant_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_remise = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_final = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # TVA (optionnel)
    tva_pourcentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    montant_tva = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Remise
    REMISE_TYPE_CHOICES = [
        ('pourcentage', 'Pourcentage'),
        ('montant', 'Montant Fixe'),
    ]
    remise_type = models.CharField(
        max_length=20, 
        choices=REMISE_TYPE_CHOICES, 
        default='pourcentage'
    )
    remise_valeur = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Paiement
    MODE_PAIEMENT_CHOICES = [
        ('especes', 'Espèces'),
        ('carte', 'Carte Bancaire'),
        ('mobile_money', 'Mobile Money'),
        ('cheque', 'Chèque'),
        ('virement', 'Virement'),
        ('credit', 'Crédit'),
    ]
    mode_paiement = models.CharField(max_length=20, choices=MODE_PAIEMENT_CHOICES)
    
    # Statut
    STATUT_CHOICES = [
        ('en_cours', 'En cours'),
        ('completee', 'Complétée'),
        ('annulee', 'Annulée'),
    ]
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='completee')
    
    # Statut paiement
    STATUT_PAIEMENT_CHOICES = [
        ('paye', 'Payé'),
        ('impaye', 'Impayé'),
        ('partiel', 'Paiement Partiel'),
    ]
    statut_paiement = models.CharField(
        max_length=20, 
        choices=STATUT_PAIEMENT_CHOICES, 
        default='paye'
    )
    montant_paye = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_restant = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Notes
    notes = models.TextField(blank=True, null=True)
    
    # Dates
    date_vente = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Vente'
        verbose_name_plural = 'Ventes'
        ordering = ['-date_vente']
    
    def __str__(self):
        return f"Vente {self.numero_vente} - {self.boutique.nom}"
    
    def calculer_totaux(self):
        """Calcule les totaux de la vente"""
        # Total des lignes
        self.montant_total = sum(
            ligne.sous_total for ligne in self.lignes.all()
        )
        
        # Calcul de la remise
        if self.remise_type == 'pourcentage':
            self.montant_remise = (self.montant_total * self.remise_valeur) / 100
        else:
            self.montant_remise = self.remise_valeur
        
        # Montant après remise
        montant_apres_remise = self.montant_total - self.montant_remise
        
        # Calcul TVA
        self.montant_tva = (montant_apres_remise * self.tva_pourcentage) / 100
        
        # Montant final
        self.montant_final = montant_apres_remise + self.montant_tva
        
        # Montant restant
        self.montant_restant = self.montant_final - self.montant_paye
        
        # Statut paiement
        if self.montant_paye >= self.montant_final:
            self.statut_paiement = 'paye'
            self.montant_restant = 0
        elif self.montant_paye > 0:
            self.statut_paiement = 'partiel'
        else:
            self.statut_paiement = 'impaye'
        
        self.save()
    
    @property
    def benefice_total(self):
        """Calcule le bénéfice total de la vente"""
        return sum(ligne.benefice for ligne in self.lignes.all())
    
    def save(self, *args, **kwargs):
        # Génère un numéro de vente unique si non existant
        if not self.numero_vente:
            import datetime
            date = datetime.datetime.now()
            self.numero_vente = f"V{date.strftime('%Y%m%d%H%M%S')}"
        super().save(*args, **kwargs)


class LigneVente(models.Model):
    """Ligne de vente (produit vendu)"""
    vente = models.ForeignKey(
        Vente, 
        on_delete=models.CASCADE, 
        related_name='lignes'
    )
    produit = models.ForeignKey(
        Produit, 
        on_delete=models.PROTECT,
        related_name='lignes_vente'
    )
    
    # Prix au moment de la vente (peut différer du prix actuel)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    prix_achat_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Quantité
    quantite = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Remise sur ligne
    remise_pourcentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    remise_montant = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Sous-total
    sous_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Ligne de vente'
        verbose_name_plural = 'Lignes de vente'
    
    def __str__(self):
        return f"{self.produit.nom} x {self.quantite}"
    
    @property
    def benefice(self):
        """Calcule le bénéfice sur cette ligne"""
        cout_total = self.prix_achat_unitaire * self.quantite
        return self.sous_total - cout_total
    
    def calculer_sous_total(self):
        """Calcule le sous-total de la ligne"""
        montant = self.prix_unitaire * self.quantite
        
        # Application de la remise
        if self.remise_pourcentage > 0:
            self.remise_montant = (montant * self.remise_pourcentage) / 100
        
        self.sous_total = montant - self.remise_montant
        self.save()
    
    def save(self, *args, **kwargs):
        # Récupère les prix du produit si non définis
        if not self.prix_unitaire:
            self.prix_unitaire = self.produit.prix_vente
        if not self.prix_achat_unitaire:
            self.prix_achat_unitaire = self.produit.prix_achat
        
        # Calcule le sous-total
        montant = float(self.prix_unitaire) * float(self.quantite)
        if self.remise_pourcentage > 0:
            self.remise_montant = (montant * float(self.remise_pourcentage)) / 100
        self.sous_total = montant - float(self.remise_montant)
        
        super().save(*args, **kwargs)


class Paiement(models.Model):
    """Historique des paiements pour une vente"""
    vente = models.ForeignKey(
        Vente, 
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
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering = ['-date_paiement']
    
    def __str__(self):
        return f"Paiement {self.montant} - {self.vente.numero_vente}"