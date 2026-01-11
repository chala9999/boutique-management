from django.db import models
from django.conf import settings

class Boutique(models.Model):
    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    adresse = models.CharField(max_length=255)
    telephone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    
    # Type de boutique
    TYPE_CHOICES = [
        ('physique', 'Boutique Physique'),
        ('en_ligne', 'Boutique en Ligne'),
        ('hybride', 'Hybride'),
    ]
    type_boutique = models.CharField(max_length=20, choices=TYPE_CHOICES, default='physique')
    
    # Propriétaire
    proprietaire = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='boutiques'
    )
    
    # Gestionnaires (employés qui peuvent gérer cette boutique)
    gestionnaires = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='boutiques_gerees',
        blank=True
    )
    
    # Statut
    is_active = models.BooleanField(default=True)
    
    # Image
    logo = models.ImageField(upload_to='boutiques/', blank=True, null=True)
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Boutique'
        verbose_name_plural = 'Boutiques'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.nom