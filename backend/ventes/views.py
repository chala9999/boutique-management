from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta
from .models import Vente, LigneVente, Paiement
from .serializers import (
    VenteSerializer, 
    VenteListSerializer, 
    CreerVenteSerializer,
    LigneVenteSerializer,
    PaiementSerializer
)
from produits.models import Produit
from boutiques.models import Boutique
from clients.models import Client

from core.permissions import IsVendeur, IsComptable, IsAdminOrComptable, CanCreateVente

class VenteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [IsAuthenticated, CanCreateVente]
        elif self.action in ['list', 'retrieve', 'statistiques', 'ventes_par_jour', 'top_produits']:
            self.permission_classes = [IsAuthenticated]
        else:
            self.permission_classes = [IsAuthenticated, IsVendeur]
        return super().get_permissions()
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin voit tout
        if user.role == 'admin':
            return Vente.objects.all()
        
        # Comptable voit toutes les ventes des boutiques (lecture seule)
        if user.role == 'comptable':
            return Vente.objects.filter(
                Q(boutique__proprietaire=user) | Q(boutique__gestionnaires=user)
            ).distinct()
        
        # Vendeur voit ses propres ventes et celles de ses boutiques
        return Vente.objects.filter(
            Q(vendeur=user) | 
            Q(boutique__proprietaire=user) | 
            Q(boutique__gestionnaires=user)
        ).distinct()

class VenteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin voit toutes les ventes
        if user.role == 'admin':
            return Vente.objects.all()
        
        # Les autres voient les ventes de leurs boutiques
        return Vente.objects.filter(
            Q(boutique__proprietaire=user) | Q(boutique__gestionnaires=user)
        ).distinct()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VenteListSerializer
        elif self.action == 'create':
            return CreerVenteSerializer
        return VenteSerializer
    
    def get_queryset_filtered(self):
        """Filtres personnalisés"""
        queryset = self.get_queryset()
        
        # Filtre par boutique
        boutique_id = self.request.query_params.get('boutique', None)
        if boutique_id:
            queryset = queryset.filter(boutique_id=boutique_id)
        
        # Filtre par vendeur
        vendeur_id = self.request.query_params.get('vendeur', None)
        if vendeur_id:
            queryset = queryset.filter(vendeur_id=vendeur_id)
        
        # Filtre par client
        client_id = self.request.query_params.get('client', None)
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        
        # Filtre par statut
        statut = self.request.query_params.get('statut', None)
        if statut:
            queryset = queryset.filter(statut=statut)
        
        # Filtre par statut paiement
        statut_paiement = self.request.query_params.get('statut_paiement', None)
        if statut_paiement:
            queryset = queryset.filter(statut_paiement=statut_paiement)
        
        # Filtre par date
        date_debut = self.request.query_params.get('date_debut', None)
        date_fin = self.request.query_params.get('date_fin', None)
        
        if date_debut:
            queryset = queryset.filter(date_vente__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_vente__lte=date_fin)
        
        # Recherche par numéro
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(numero_vente__icontains=search)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset_filtered()
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Créer une nouvelle vente"""
        serializer = CreerVenteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Vérifie que la boutique existe et que l'utilisateur y a accès
        try:
            boutique = Boutique.objects.get(id=data['boutique'])
            if request.user.role != 'admin':
                if boutique.proprietaire != request.user and request.user not in boutique.gestionnaires.all():
                    return Response(
                        {'error': 'Accès non autorisé à cette boutique'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        except Boutique.DoesNotExist:
            return Response(
                {'error': 'Boutique introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifie le client si fourni
        client = None
        if data.get('client'):
            try:
                client = Client.objects.get(id=data['client'])
            except Client.DoesNotExist:
                return Response(
                    {'error': 'Client introuvable'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Crée la vente
        vente = Vente.objects.create(
            boutique=boutique,
            vendeur=request.user,
            client=client,
            mode_paiement=data['mode_paiement'],
            remise_type=data.get('remise_type', 'pourcentage'),
            remise_valeur=data.get('remise_valeur', 0),
            tva_pourcentage=data.get('tva_pourcentage', 0),
            montant_paye=data.get('montant_paye', 0),
            notes=data.get('notes', ''),
            statut='completee'
        )
        
        # Crée les lignes de vente
        for ligne_data in data['lignes']:
            try:
                produit = Produit.objects.get(id=ligne_data['produit'])
                
                # Vérifie le stock
                quantite = float(ligne_data['quantite'])
                if produit.stock_actuel < quantite:
                    transaction.set_rollback(True)
                    return Response(
                        {'error': f'Stock insuffisant pour {produit.nom}. Stock disponible: {produit.stock_actuel}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Crée la ligne
                ligne = LigneVente.objects.create(
                    vente=vente,
                    produit=produit,
                    prix_unitaire=ligne_data.get('prix_unitaire', produit.prix_vente),
                    prix_achat_unitaire=produit.prix_achat,
                    quantite=quantite,
                    remise_pourcentage=ligne_data.get('remise_pourcentage', 0)
                )
                
                # Met à jour le stock
                produit.stock_actuel -= quantite
                produit.save()
                
            except Produit.DoesNotExist:
                transaction.set_rollback(True)
                return Response(
                    {'error': f'Produit {ligne_data["produit"]} introuvable'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Calcule les totaux
        vente.calculer_totaux()
        
        # Crée un paiement si montant payé > 0
        if vente.montant_paye > 0:
            Paiement.objects.create(
                vente=vente,
                montant=vente.montant_paye,
                mode_paiement=vente.mode_paiement
            )
        
        # Ajoute des points de fidélité si client
        if client:
            # 1 point par tranche de 1000 (à adapter selon tes besoins)
            points = int(float(vente.montant_final) / 1000)
            if points > 0:
                client.points_fidelite += points
                client.save()
        
        serializer = VenteSerializer(vente)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        """Annuler une vente et restaurer le stock"""
        vente = self.get_object()
        
        if vente.statut == 'annulee':
            return Response(
                {'error': 'Cette vente est déjà annulée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Restaure le stock
            for ligne in vente.lignes.all():
                produit = ligne.produit
                produit.stock_actuel += float(ligne.quantite)
                produit.save()
            
            # Retire les points de fidélité si client
            if vente.client:
                points = int(float(vente.montant_final) / 1000)
                if points > 0:
                    vente.client.points_fidelite = max(0, vente.client.points_fidelite - points)
                    vente.client.save()
            
            # Annule la vente
            vente.statut = 'annulee'
            vente.save()
        
        serializer = VenteSerializer(vente)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def ajouter_paiement(self, request, pk=None):
        """Ajouter un paiement à une vente"""
        vente = self.get_object()

        if vente.statut == 'annulee':
            return Response(
                {'error': 'Impossible d\'ajouter un paiement à une vente annulée'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if vente.statut_paiement == 'paye':
            return Response(
                {'error': 'Cette vente est déjà entièrement payée'},
                status=status.HTTP_400_BAD_REQUEST
            )

        montant = request.data.get('montant')
        mode_paiement = request.data.get('mode_paiement', 'especes')
        reference = request.data.get('reference', '')
        notes = request.data.get('notes', '')

        if not montant:
            return Response(
                {'error': 'Le montant est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from decimal import Decimal
        montant = Decimal(str(montant))

        if montant <= 0:
            return Response(
                {'error': 'Le montant doit être positif'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if montant > vente.montant_restant:
            return Response(
                {'error': f'Le montant ({montant}) dépasse le restant dû ({vente.montant_restant})'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Créer le paiement
        paiement = Paiement.objects.create(
            vente=vente,
            montant=montant,
            mode_paiement=mode_paiement,
            reference=reference,
            notes=notes
        )

        # Mettre à jour la vente
        vente.montant_paye += montant
        vente.calculer_totaux()

        return Response(
            PaiementSerializer(paiement).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Statistiques globales des ventes"""
        queryset = self.get_queryset_filtered().filter(statut='completee')
        
        # Période (par défaut: aujourd'hui)
        periode = request.query_params.get('periode', 'aujourd_hui')
        today = timezone.now().date()
        
        if periode == 'aujourd_hui':
            queryset = queryset.filter(date_vente__date=today)
        elif periode == 'semaine':
            start_week = today - timedelta(days=today.weekday())
            queryset = queryset.filter(date_vente__date__gte=start_week)
        elif periode == 'mois':
            queryset = queryset.filter(
                date_vente__year=today.year,
                date_vente__month=today.month
            )
        elif periode == 'annee':
            queryset = queryset.filter(date_vente__year=today.year)
        
        # Calculs
        stats = {
            'nombre_ventes': queryset.count(),
            'chiffre_affaires': queryset.aggregate(
                total=Sum('montant_final')
            )['total'] or 0,
            'benefice_total': sum(v.benefice_total for v in queryset),
            'vente_moyenne': queryset.aggregate(
                moyenne=Avg('montant_final')
            )['moyenne'] or 0,
            'ventes_impayees': self.get_queryset().filter(
                statut_paiement='impaye'
            ).count(),
            'montant_impaye': self.get_queryset().filter(
                statut_paiement__in=['impaye', 'partiel']
            ).aggregate(
                total=Sum('montant_restant')
            )['total'] or 0,
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def top_produits(self, request):
        """Top des produits les plus vendus"""
        queryset = self.get_queryset_filtered().filter(statut='completee')
        
        # Période
        periode = request.query_params.get('periode', 'mois')
        today = timezone.now().date()
        
        if periode == 'semaine':
            start = today - timedelta(days=today.weekday())
            queryset = queryset.filter(date_vente__date__gte=start)
        elif periode == 'mois':
            queryset = queryset.filter(
                date_vente__year=today.year,
                date_vente__month=today.month
            )
        
        # Agrégation
        from django.db.models import Sum, F
        top_produits = LigneVente.objects.filter(
            vente__in=queryset
        ).values(
            'produit__id',
            'produit__nom',
            'produit__reference'
        ).annotate(
            quantite_totale=Sum('quantite'),
            chiffre_affaires=Sum(F('sous_total'))
        ).order_by('-quantite_totale')[:10]
        
        return Response(list(top_produits))
    
    @action(detail=False, methods=['get'])
    def ventes_par_jour(self, request):
        """Ventes groupées par jour (pour graphiques)"""
        queryset = self.get_queryset_filtered().filter(statut='completee')
        
        # Période (30 derniers jours par défaut)
        jours = int(request.query_params.get('jours', 30))
        date_debut = timezone.now().date() - timedelta(days=jours)
        
        queryset = queryset.filter(date_vente__date__gte=date_debut)
        
        # Agrégation par jour
        from django.db.models.functions import TruncDate
        ventes_par_jour = queryset.annotate(
            jour=TruncDate('date_vente')
        ).values('jour').annotate(
            nombre_ventes=Count('id'),
            total=Sum('montant_final')
        ).order_by('jour')
        
        return Response(list(ventes_par_jour))


@action(detail=True, methods=['get'])
def get_vente_details(self, request, pk=None):
    """Récupère toutes les infos d'une vente avec calculs"""
    vente = self.get_object()
    serializer = VenteSerializer(vente)
    return Response(serializer.data)

@action(detail=False, methods=['get'])
def ventes_par_jour(self, request):
    """Ventes groupées par jour (pour graphiques)"""
    queryset = self.get_queryset_filtered().filter(statut='completee')
    
    jours = int(request.query_params.get('jours', 30))
    date_debut = timezone.now().date() - timedelta(days=jours)
    
    queryset = queryset.filter(date_vente__date__gte=date_debut)
    
    from django.db.models.functions import TruncDate
    ventes_par_jour = queryset.annotate(
        jour=TruncDate('date_vente')
    ).values('jour').annotate(
        nombre_ventes=Count('id'),
        total=Sum('montant_final')
    ).order_by('jour')
    
    return Response(list(ventes_par_jour))

@action(detail=False, methods=['get'])
def stats_ventes(self, request):
    """Statistiques avancées des ventes"""
    queryset = self.get_queryset().filter(statut='completee')
    
    # Périodes
    today = timezone.now().date()
    first_day_month = today.replace(day=1)
    
    # Stats du mois
    ventes_mois = queryset.filter(date_vente__date__gte=first_day_month)
    
    # Stats d'aujourd'hui
    ventes_jour = queryset.filter(date_vente__date=today)
    
    # Stats des 30 derniers jours
    date_30j = today - timedelta(days=30)
    ventes_30j = queryset.filter(date_vente__date__gte=date_30j)
    
    # Calculs
    stats = {
        'aujourd_hui': {
            'nombre': ventes_jour.count(),
            'ca': ventes_jour.aggregate(total=Sum('montant_final'))['total'] or 0,
            'benefice': sum(v.benefice_total for v in ventes_jour)
        },
        'mois': {
            'nombre': ventes_mois.count(),
            'ca': ventes_mois.aggregate(total=Sum('montant_final'))['total'] or 0,
        },
        '30_jours': {
            'nombre': ventes_30j.count(),
            'ca': ventes_30j.aggregate(total=Sum('montant_final'))['total'] or 0,
        },
        'impayes': {
            'nombre': self.get_queryset().filter(statut_paiement__in=['impaye', 'partiel']).count(),
            'montant': self.get_queryset().filter(statut_paiement__in=['impaye', 'partiel']).aggregate(total=Sum('montant_restant'))['total'] or 0,
        }
    }
    
    return Response(stats)

@transaction.atomic
def update(self, request, *args, **kwargs):
    """Modifier une vente existante"""
    partial = kwargs.pop('partial', False)
    vente = self.get_object()
    
    # Impossible de modifier une vente annulée
    if vente.statut == 'annulee':
        return Response(
            {'error': 'Impossible de modifier une vente annulée'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    data = request.data
    
    # Modifier les champs simples
    if 'client' in data:
        client = None
        if data['client']:
            try:
                client = Client.objects.get(id=data['client'])
            except Client.DoesNotExist:
                return Response({'error': 'Client introuvable'}, status=status.HTTP_404_NOT_FOUND)
        vente.client = client
    
    if 'mode_paiement' in data:
        vente.mode_paiement = data['mode_paiement']
    if 'remise_type' in data:
        vente.remise_type = data['remise_type']
    if 'remise_valeur' in data:
        vente.remise_valeur = data['remise_valeur']
    if 'montant_paye' in data:
        vente.montant_paye = data['montant_paye']
    if 'notes' in data:
        vente.notes = data['notes']
    
    # Modifier les lignes si fournies
    if 'lignes' in data:
        # 1. Restaurer le stock des anciennes lignes
        for ligne in vente.lignes.all():
            produit = ligne.produit
            produit.stock_actuel += float(ligne.quantite)
            produit.save()
        
        # 2. Supprimer les anciennes lignes
        vente.lignes.all().delete()
        
        # 3. Créer les nouvelles lignes
        for ligne_data in data['lignes']:
            try:
                produit = Produit.objects.get(id=ligne_data['produit'])
                quantite = float(ligne_data['quantite'])
                
                # Vérifier le stock
                if produit.stock_actuel < quantite:
                    transaction.set_rollback(True)
                    return Response(
                        {'error': f'Stock insuffisant pour {produit.nom}. Disponible: {produit.stock_actuel}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                LigneVente.objects.create(
                    vente=vente,
                    produit=produit,
                    prix_unitaire=ligne_data.get('prix_unitaire', produit.prix_vente),
                    prix_achat_unitaire=produit.prix_achat,
                    quantite=quantite,
                    remise_pourcentage=ligne_data.get('remise_pourcentage', 0)
                )
                
                # Déduire le nouveau stock
                produit.stock_actuel -= quantite
                produit.save()
                
            except Produit.DoesNotExist:
                transaction.set_rollback(True)
                return Response(
                    {'error': f'Produit introuvable'},
                    status=status.HTTP_404_NOT_FOUND
                )
    
    vente.save()
    vente.calculer_totaux()
    
    serializer = VenteSerializer(vente)
    return Response(serializer.data)