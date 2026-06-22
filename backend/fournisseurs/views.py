from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q, Sum, Count
from django.utils import timezone
from .models import (
    Fournisseur, 
    Commande, 
    LigneCommande, 
    PaiementCommande,
    ReceptionCommande,
    LigneReception
)
from .serializers import (
    FournisseurSerializer,
    FournisseurListSerializer,
    CommandeSerializer,
    CommandeListSerializer,
    CreerCommandeSerializer,
    PaiementCommandeSerializer,
    RecevoirCommandeSerializer,
    ReceptionCommandeSerializer
)
from boutiques.models import Boutique
from produits.models import Produit

class FournisseurViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin voit tous les fournisseurs
        if user.role == 'admin':
            return Fournisseur.objects.all()
        
        # Les autres voient les fournisseurs de leurs boutiques
        return Fournisseur.objects.filter(
            Q(boutique__proprietaire=user) | Q(boutique__gestionnaires=user)
        ).distinct()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FournisseurListSerializer
        return FournisseurSerializer
    
    def get_queryset_filtered(self):
        """Filtres personnalisés"""
        queryset = self.get_queryset()
        
        # Filtre par boutique
        boutique_id = self.request.query_params.get('boutique', None)
        if boutique_id:
            queryset = queryset.filter(boutique_id=boutique_id)
        
        # Filtre actifs seulement
        actifs = self.request.query_params.get('actifs', None)
        if actifs == 'true':
            queryset = queryset.filter(is_active=True)
        
        # Recherche
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) |
                Q(entreprise__icontains=search) |
                Q(telephone__icontains=search) |
                Q(email__icontains=search)
            )
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset_filtered()
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def commandes(self, request, pk=None):
        """Liste des commandes d'un fournisseur"""
        fournisseur = self.get_object()
        commandes = fournisseur.commandes.all().order_by('-date_commande')
        
        serializer = CommandeListSerializer(commandes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def statistiques(self, request, pk=None):
        """Statistiques d'un fournisseur"""
        fournisseur = self.get_object()
        
        commandes = fournisseur.commandes.all()
        
        stats = {
            'nombre_commandes': fournisseur.nombre_commandes,
            'total_commandes': fournisseur.total_commandes,
            'commandes_en_cours': commandes.filter(
                statut__in=['en_attente', 'confirmee', 'en_cours']
            ).count(),
            'commandes_livrees': commandes.filter(statut='livree').count(),
            'montant_impaye': commandes.filter(
                statut_paiement__in=['impaye', 'partiel']
            ).aggregate(
                total=Sum('montant_restant')
            )['total'] or 0,
        }
        
        return Response(stats)


class CommandeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Commande.objects.all()
        return Commande.objects.filter(
            Q(boutique__proprietaire=user) | Q(boutique__gestionnaires=user)
        ).distinct()

    def get_serializer_class(self):
        if self.action == 'list':
            return CommandeListSerializer
        elif self.action == 'create':
            return CreerCommandeSerializer
        return CommandeSerializer

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """Modifier une commande existante"""
        commande = self.get_object()

        if commande.statut in ['livree', 'annulee']:
            return Response(
                {'error': 'Impossible de modifier une commande livrée ou annulée'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data

        if 'fournisseur' in data:
            try:
                fournisseur = Fournisseur.objects.get(id=data['fournisseur'])
                commande.fournisseur = fournisseur
            except Fournisseur.DoesNotExist:
                return Response({'error': 'Fournisseur introuvable'}, status=status.HTTP_404_NOT_FOUND)

        if 'date_livraison_prevue' in data:
            commande.date_livraison_prevue = data['date_livraison_prevue'] or None
        if 'notes' in data:
            commande.notes = data['notes']

        if 'lignes' in data:
            if commande.receptions.exists():
                return Response(
                    {'error': 'Impossible de modifier les lignes : des réceptions ont déjà été enregistrées'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            commande.lignes.all().delete()
            for ligne_data in data['lignes']:
                try:
                    produit = Produit.objects.get(id=ligne_data['produit'])
                    LigneCommande.objects.create(
                        commande=commande,
                        produit=produit,
                        prix_unitaire=Decimal(str(ligne_data['prix_unitaire'])),
                        quantite_commandee=Decimal(str(ligne_data['quantite']))
                    )
                except Produit.DoesNotExist:
                    transaction.set_rollback(True)
                    return Response({'error': 'Produit introuvable'}, status=status.HTTP_404_NOT_FOUND)
            commande.save()
            commande.calculer_totaux()
        else:
            commande.save()

        serializer = CommandeSerializer(commande)
        return Response(serializer.data)

    def get_queryset_filtered(self):
        """Filtres personnalisés"""
        queryset = self.get_queryset()
        
        # Filtre par boutique
        boutique_id = self.request.query_params.get('boutique', None)
        if boutique_id:
            queryset = queryset.filter(boutique_id=boutique_id)
        
        # Filtre par fournisseur
        fournisseur_id = self.request.query_params.get('fournisseur', None)
        if fournisseur_id:
            queryset = queryset.filter(fournisseur_id=fournisseur_id)
        
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
            queryset = queryset.filter(date_commande__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_commande__lte=date_fin)
        
        # Recherche par numéro
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(numero_commande__icontains=search)
        
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
        """Créer une nouvelle commande"""
        serializer = CreerCommandeSerializer(data=request.data)
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
        
        # Vérifie le fournisseur
        try:
            fournisseur = Fournisseur.objects.get(id=data['fournisseur'])
        except Fournisseur.DoesNotExist:
            return Response(
                {'error': 'Fournisseur introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Crée la commande
        commande = Commande.objects.create(
            fournisseur=fournisseur,
            boutique=boutique,
            created_by=request.user,
            date_livraison_prevue=data.get('date_livraison_prevue'),
            notes=data.get('notes', ''),
            statut='en_attente'
        )
        
        # Crée les lignes de commande
        for ligne_data in data['lignes']:
            try:
                produit = Produit.objects.get(id=ligne_data['produit'])
                
                LigneCommande.objects.create(
                    commande=commande,
                    produit=produit,
                    prix_unitaire=ligne_data['prix_unitaire'],
                    quantite_commandee=ligne_data['quantite']
                )
                
            except Produit.DoesNotExist:
                transaction.set_rollback(True)
                return Response(
                    {'error': f'Produit {ligne_data["produit"]} introuvable'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Calcule les totaux
        commande.calculer_totaux()
        
        serializer = CommandeSerializer(commande)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        """Changer le statut d'une commande"""
        commande = self.get_object()
        nouveau_statut = request.data.get('statut')
        
        if nouveau_statut not in dict(Commande.STATUT_CHOICES):
            return Response(
                {'error': 'Statut invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        commande.statut = nouveau_statut
        
        # Si livraison complète, met la date de livraison réelle
        if nouveau_statut == 'livree' and not commande.date_livraison_reelle:
            commande.date_livraison_reelle = timezone.now().date()
        
        commande.save()
        
        serializer = CommandeSerializer(commande)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        """Annuler une commande"""
        commande = self.get_object()
        
        if commande.statut == 'annulee':
            return Response(
                {'error': 'Cette commande est déjà annulée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if commande.statut == 'livree':
            return Response(
                {'error': 'Impossible d\'annuler une commande déjà livrée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        commande.statut = 'annulee'
        commande.save()
        
        serializer = CommandeSerializer(commande)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def ajouter_paiement(self, request, pk=None):
        """Ajouter un paiement à une commande"""
        commande = self.get_object()
        
        if commande.statut == 'annulee':
            return Response(
                {'error': 'Impossible d\'ajouter un paiement à une commande annulée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PaiementCommandeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        montant = serializer.validated_data['montant']
        
        if commande.montant_restant < montant:
            return Response(
                {'error': f'Le montant dépasse le restant dû ({commande.montant_restant})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crée le paiement
        validated_data = serializer.validated_data
        validated_data.pop('commande', None)  # retire commande si présent
        paiement = PaiementCommande.objects.create(
            commande=commande,
            **validated_data
        )
        
        # Met à jour la commande
        commande.montant_paye += montant
        commande.calculer_totaux()
        
        return Response(
            PaiementCommandeSerializer(paiement).data, 
            status=status.HTTP_201_CREATED
        )
    
    @transaction.atomic
    @action(detail=True, methods=['post'])
    def recevoir(self, request, pk=None):
        """Recevoir une livraison (complète ou partielle)"""
        commande = self.get_object()
        
        if commande.statut == 'annulee':
            return Response(
                {'error': 'Impossible de recevoir une commande annulée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = RecevoirCommandeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Crée la réception
        reception = ReceptionCommande.objects.create(
            commande=commande,
            received_by=request.user,
            numero_bon_livraison=data.get('numero_bon_livraison', ''),
            notes=data.get('notes', '')
        )
        
        # Traite les lignes reçues
        for ligne_data in data['lignes']:
            try:
                ligne_commande = LigneCommande.objects.get(
                    id=ligne_data['ligne_commande'],
                    commande=commande
                )
                
                from decimal import Decimal

                quantite_recue = Decimal(str(ligne_data['quantite_recue']))

                if ligne_commande.quantite_recue + quantite_recue > ligne_commande.quantite_commandee:
                    transaction.set_rollback(True)
                    return Response(...)

                LigneReception.objects.create(
                    reception=reception,
                    ligne_commande=ligne_commande,
                    quantite_recue=quantite_recue,
                    notes=ligne_data.get('notes', '')
                )

                ligne_commande.quantite_recue += quantite_recue
                ligne_commande.save()

                produit = ligne_commande.produit
                produit.stock_actuel += int(quantite_recue)
                produit.save()
                
            except LigneCommande.DoesNotExist:
                transaction.set_rollback(True)
                return Response(
                    {'error': 'Ligne de commande introuvable'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        toutes_recues = all(
            ligne.quantite_recue >= ligne.quantite_commandee 
            for ligne in commande.lignes.all()
        )
        
        if toutes_recues:
            commande.statut = 'livree'
            commande.date_livraison_reelle = timezone.now().date()
        else:
            commande.statut = 'en_cours'
        
        commande.save()
        
        return Response(
            ReceptionCommandeSerializer(reception).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """Statistiques globales des commandes"""
        queryset = self.get_queryset_filtered()
        
        stats = {
            'nombre_commandes': queryset.count(),
            'commandes_en_attente': queryset.filter(statut='en_attente').count(),
            'commandes_en_cours': queryset.filter(statut='en_cours').count(),
            'commandes_livrees': queryset.filter(statut='livree').count(),
            'montant_total': queryset.aggregate(
                total=Sum('montant_total')
            )['total'] or 0,
            'montant_impaye': queryset.filter(
                statut_paiement__in=['impaye', 'partiel']
            ).aggregate(
                total=Sum('montant_restant')
            )['total'] or 0,
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def commandes_en_retard(self, request):
        """Commandes dont la date de livraison prévue est dépassée"""
        today = timezone.now().date()
        
        commandes = self.get_queryset().filter(
            date_livraison_prevue__lt=today,
            statut__in=['en_attente', 'confirmee', 'en_cours']
        )
        
        serializer = CommandeListSerializer(commandes, many=True)
        return Response(serializer.data)