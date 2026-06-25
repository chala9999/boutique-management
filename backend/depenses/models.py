from django.db import models
from django.conf import settings
from boutiques.models import Boutique

class Depense(models.Model):
    CATEGORIE_CHOICES = [
        ('loyer', 'Loyer'),
        ('electricite', 'Électricité'),
        ('eau', 'Eau'),
        ('internet', 'Internet / Téléphone'),
        ('fournitures', 'Fournitures de bureau'),
        ('transport', 'Transport'),
        ('salaire', 'Salaire / Prime'),
        ('maintenance', 'Maintenance / Réparation'),
        ('publicite', 'Publicité / Marketing'),
        ('personnel', 'Dépense personnelle avancée'),
        ('autre', 'Autre'),
    ]

    TYPE_CHOICES = [
        ('boutique', 'Dépense boutique'),
        ('personnelle', 'Dépense personnelle avancée'),
    ]

    boutique = models.ForeignKey(
        Boutique,
        on_delete=models.CASCADE,
        related_name='depenses'
    )
    effectuee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='depenses_effectuees'
    )

    # Informations
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    categorie = models.CharField(max_length=50, choices=CATEGORIE_CHOICES, default='autre')
    type_depense = models.CharField(max_length=20, choices=TYPE_CHOICES, default='boutique')

    # Pièce justificative
    justificatif = models.FileField(upload_to='depenses/', blank=True, null=True)

    # Statut remboursement (pour dépenses personnelles)
    STATUT_REMBOURSEMENT_CHOICES = [
        ('na', 'Non applicable'),
        ('en_attente', 'En attente de remboursement'),
        ('rembourse', 'Remboursé'),
    ]
    statut_remboursement = models.CharField(
        max_length=20,
        choices=STATUT_REMBOURSEMENT_CHOICES,
        default='na'
    )

    # Date de la dépense
    date_depense = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Dépense'
        verbose_name_plural = 'Dépenses'
        ordering = ['-date_depense']

    def __str__(self):
        return f"{self.titre} - {self.montant} FCFA"