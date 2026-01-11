from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Q
from .models import Boutique
from .serializers import BoutiqueSerializer, BoutiqueListSerializer

class BoutiqueViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin voit tout
        if user.role == 'admin':
            return Boutique.objects.all()
        
        # Les autres voient leurs boutiques + celles qu'ils gèrent
        return Boutique.objects.filter(
            Q(proprietaire=user) | Q(gestionnaires=user)
        ).distinct()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BoutiqueListSerializer
        return BoutiqueSerializer
    
    def perform_create(self, serializer):
        serializer.save(proprietaire=self.request.user)
    
    @action(detail=True, methods=['get'])
    def statistiques(self, request, pk=None):
        """Statistiques d'une boutique"""
        boutique = self.get_object()
        
        stats = {
            'nombre_produits': boutique.produits.count(),
            'produits_actifs': boutique.produits.filter(is_active=True).count(),
            'produits_stock_faible': boutique.produits.filter(
                stock_actuel__lte=models.F('stock_minimum')
            ).count(),
            'valeur_stock_total': sum(
                p.prix_achat * p.stock_actuel 
                for p in boutique.produits.all()
            ),
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def ajouter_gestionnaire(self, request, pk=None):
        """Ajouter un gestionnaire à la boutique"""
        boutique = self.get_object()
        
        # Seul le propriétaire peut ajouter des gestionnaires
        if boutique.proprietaire != request.user:
            return Response(
                {'error': 'Seul le propriétaire peut ajouter des gestionnaires'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)
            boutique.gestionnaires.add(user)
            return Response({'message': 'Gestionnaire ajouté avec succès'})
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def retirer_gestionnaire(self, request, pk=None):
        """Retirer un gestionnaire de la boutique"""
        boutique = self.get_object()
        
        # Seul le propriétaire peut retirer des gestionnaires
        if boutique.proprietaire != request.user:
            return Response(
                {'error': 'Seul le propriétaire peut retirer des gestionnaires'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)
            boutique.gestionnaires.remove(user)
            return Response({'message': 'Gestionnaire retiré avec succès'})
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def mes_boutiques(self, request):
        """Récupère les boutiques de l'utilisateur connecté"""
        boutiques = Boutique.objects.filter(proprietaire=request.user)
        serializer = BoutiqueListSerializer(boutiques, many=True)
        return Response(serializer.data)