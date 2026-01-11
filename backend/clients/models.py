from django.db import models
from boutiques.models import Boutique

class Client(models.Model):
    # Informations de base
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    telephone = models.CharField(max_length=20)
    telephone2 = models.CharField(max_length=20, blank=True, null=True)
    
    # Adresse
    adresse = models.TextField(blank=True, null=True)
    ville = models.CharField(max_length=100, blank=True, null=True)
    pays = models.CharField(max_length=100, blank=True, null=True)
    
    # Boutique
    boutique = models.ForeignKey(
        Boutique, 
        on_delete=models.CASCADE, 
        related_name='clients'
    )
    
    # Fidélité
    points_fidelite = models.IntegerField(default=0)
    
    # Notes
    notes = models.TextField(blank=True, null=True)
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'
        ordering = ['nom', 'prenom']
    
    def __str__(self):
        if self.prenom:
            return f"{self.nom} {self.prenom}"
        return self.nom
    
    @property
    def nom_complet(self):
        if self.prenom:
            return f"{self.nom} {self.prenom}"
        return self.nom
    
    @property
    def total_achats(self):
        """Total des achats du client"""
        return sum(
            achat.montant_final 
            for achat in self.achats.filter(statut='completee')
        )
    
    @property
    def nombre_achats(self):
        """Nombre total d'achats"""
        return self.achats.filter(statut='completee').count()