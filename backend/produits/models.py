from django.db import models
from boutiques.models import Boutique

class Categorie(models.Model):
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'
        ordering = ['nom']
    
    def __str__(self):
        return self.nom


class Produit(models.Model):
    # Informations de base
    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    code_barre = models.CharField(max_length=50, unique=True, blank=True, null=True)
    reference = models.CharField(max_length=50, unique=True)
    
    # Catégorie
    categorie = models.ForeignKey(
        Categorie, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='produits'
    )
    
    # Boutique
    boutique = models.ForeignKey(
        Boutique, 
        on_delete=models.CASCADE, 
        related_name='produits'
    )
    
    # Prix
    prix_achat = models.DecimalField(max_digits=10, decimal_places=2)
    prix_vente = models.DecimalField(max_digits=10, decimal_places=2)
    prix_promo = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    # Stock
    stock_actuel = models.IntegerField(default=0)
    stock_minimum = models.IntegerField(default=5)  # Alerte stock faible
    stock_maximum = models.IntegerField(default=100)
    
    # Unité de mesure
    UNITE_CHOICES = [
        ('unite', 'Unité'),
        ('kg', 'Kilogramme'),
        ('g', 'Gramme'),
        ('l', 'Litre'),
        ('ml', 'Millilitre'),
        ('m', 'Mètre'),
        ('cm', 'Centimètre'),
        ('paquet', 'Paquet'),
        ('carton', 'Carton'),
    ]
    unite = models.CharField(max_length=20, choices=UNITE_CHOICES, default='unite')
    
    # Images
    image_principale = models.ImageField(upload_to='produits/', blank=True, null=True)
    
    # Statut
    is_active = models.BooleanField(default=True)
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def save(self, *args, **kwargs):
        if not self.code_barre:
            # Générer un code barre unique
            import uuid
            self.code_barre = str(uuid.uuid4())[:8]
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = 'Produit'
        verbose_name_plural = 'Produits'
        ordering = ['-created_at']
        unique_together = ['reference', 'boutique']
    
    def __str__(self):
        return f"{self.nom} - {self.boutique.nom}"
    
    @property
    def marge_benefice(self):
        """Calcule la marge bénéficiaire"""
        return self.prix_vente - self.prix_achat
    
    @property
    def pourcentage_marge(self):
        """Calcule le pourcentage de marge"""
        if self.prix_achat > 0:
            return ((self.prix_vente - self.prix_achat) / self.prix_achat) * 100
        return 0
    
    @property
    def stock_faible(self):
        """Vérifie si le stock est faible"""
        return self.stock_actuel <= self.stock_minimum


class ImageProduit(models.Model):
    """Images supplémentaires pour un produit"""
    produit = models.ForeignKey(
        Produit, 
        on_delete=models.CASCADE, 
        related_name='images'
    )
    image = models.ImageField(upload_to='produits/')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Image Produit'
        verbose_name_plural = 'Images Produits'
    
    def __str__(self):
        return f"Image de {self.produit.nom}"