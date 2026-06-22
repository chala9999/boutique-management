from django.db import models
from boutiques.models import Boutique

class NiveauFidelite(models.Model):
    """Niveaux de fidélité (Bronze, Argent, Or, Platine)"""
    nom = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    points_minimum = models.IntegerField(default=0)
    remise_pourcentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    couleur = models.CharField(max_length=20, default='#9CA3AF')
    icon = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Niveau de fidélité'
        verbose_name_plural = 'Niveaux de fidélité'
        ordering = ['points_minimum']
    
    def __str__(self):
        return f"{self.nom} ({self.points_minimum} pts)"


class Recompense(models.Model):
    """Récompenses échangeables avec des points"""
    nom = models.CharField(max_length=100)
    description = models.TextField()
    points_requis = models.IntegerField()
    image = models.ImageField(upload_to='recompenses/', blank=True, null=True)
    stock = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    boutique = models.ForeignKey(Boutique, on_delete=models.CASCADE, related_name='recompenses', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Récompense'
        verbose_name_plural = 'Récompenses'
        ordering = ['points_requis']
    
    def __str__(self):
        return f"{self.nom} - {self.points_requis} pts"


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
    points_expires = models.IntegerField(default=0)
    date_dernier_achat = models.DateTimeField(blank=True, null=True)
    
    # Niveau de fidélité (champ calculé automatiquement, pas besoin de le stocker)
    # niveau_fidelite = models.ForeignKey(...)  ← SUPPRIME, utilise @property niveau
    
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
    
    @property
    def niveau(self):
        """Retourne le niveau de fidélité basé sur les points"""
        niveaux = NiveauFidelite.objects.filter(is_active=True).order_by('-points_minimum')
        for niveau in niveaux:
            if self.points_fidelite >= niveau.points_minimum:
                return niveau
        return None
    
    @property
    def prochain_niveau(self):
        """Retourne le prochain niveau à atteindre"""
        niveaux = NiveauFidelite.objects.filter(
            is_active=True, 
            points_minimum__gt=self.points_fidelite
        ).order_by('points_minimum')
        return niveaux.first() if niveaux.exists() else None
    
    @property
    def points_restants_prochain_niveau(self):
        """Points restants pour atteindre le prochain niveau"""
        if self.prochain_niveau:
            return self.prochain_niveau.points_minimum - self.points_fidelite
        return 0


class EchangeRecompense(models.Model):
    """Historique des échanges de récompenses"""
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='echanges')
    recompense = models.ForeignKey(Recompense, on_delete=models.CASCADE)
    points_utilises = models.IntegerField()
    date_echange = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, default='valide')
    
    class Meta:
        verbose_name = 'Échange de récompense'
        verbose_name_plural = 'Échanges de récompenses'
        ordering = ['-date_echange']
    
    def __str__(self):
        return f"{self.client.nom_complet} - {self.recompense.nom}"