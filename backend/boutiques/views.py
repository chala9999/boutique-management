from django.db import models 
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Count, Sum, Q
from .models import Boutique
from .serializers import BoutiqueSerializer, BoutiqueListSerializer
from core.permissions import IsAdmin, IsVendeur, IsOwnerOrGestionnaire


class BoutiqueViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsVendeur]
    
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
    
    def get_permissions(self):
        if self.action in ['destroy', 'create']:
            # Seul l'admin peut créer/supprimer des boutiques
            self.permission_classes = [IsAuthenticated, IsAdmin]
        elif self.action in ['ajouter_gestionnaire', 'retirer_gestionnaire']:
            # Seul le propriétaire peut gérer les gestionnaires
            self.permission_classes = [IsAuthenticated]
        else:
            self.permission_classes = [IsAuthenticated, IsVendeur]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(proprietaire=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Désactiver une boutique au lieu de la supprimer (soft delete)"""
        boutique = self.get_object()
        
        # Vérifier si l'utilisateur est admin
        if request.user.role != 'admin':
            return Response(
                {'error': 'Seul un administrateur peut désactiver une boutique'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Désactiver la boutique
        boutique.is_active = False
        boutique.save()
        
        # Désactiver aussi tous les produits associés
        nombre_produits = boutique.produits.filter(is_active=True).update(is_active=False)
        
        return Response({
            'message': 'Boutique désactivée avec succès',
            'boutique': boutique.nom,
            'produits_desactives': nombre_produits
        })
    
    @action(detail=True, methods=['post'])
    def reactiver(self, request, pk=None):
        """Réactiver une boutique désactivée"""
        boutique = self.get_object()
        
        if request.user.role != 'admin':
            return Response(
                {'error': 'Seul un administrateur peut réactiver une boutique'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        boutique.is_active = True
        boutique.save()
        
        return Response({
            'message': 'Boutique réactivée avec succès',
            'boutique': boutique.nom
        })
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activer ou désactiver une boutique"""
        boutique = self.get_object()
        
        # Seul un admin peut activer/désactiver
        if request.user.role != 'admin':
            return Response(
                {'error': 'Seul un administrateur peut activer/désactiver une boutique'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        boutique.is_active = not boutique.is_active
        boutique.save()
        
        return Response({
            'message': f'Boutique {"activée" if boutique.is_active else "désactivée"} avec succès',
            'is_active': boutique.is_active
        })
    
    @action(detail=True, methods=['post', 'patch'], url_path='upload-logo')
    def upload_logo(self, request, pk=None):
        """Uploader ou modifier le logo de la boutique"""
        boutique = self.get_object()
        
        if 'logo' not in request.FILES:
            return Response(
                {'error': 'Aucun fichier fourni'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logo = request.FILES['logo']
        
        # Vérifier le type de fichier
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if logo.content_type not in allowed_types:
            return Response(
                {'error': 'Format non supporté. Utilisez JPG, PNG, GIF ou WEBP'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier la taille (max 5MB)
        if logo.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Le fichier ne doit pas dépasser 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        boutique.logo = logo
        boutique.save()
        
        return Response({
            'message': 'Logo uploadé avec succès',
            'logo_url': boutique.logo.url if boutique.logo else None
        })
    
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
        
        # Admin ou propriétaire peut ajouter des gestionnaires
        if request.user.role != 'admin' and boutique.proprietaire != request.user:
            return Response(
                {'error': 'Seul le propriétaire ou un admin peut ajouter des gestionnaires'},
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
            
            # Vérifier que l'utilisateur est vendeur ou comptable
            if user.role not in ['vendeur', 'comptable']:
                return Response(
                    {'error': 'Seuls les vendeurs et comptables peuvent être gestionnaires'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            boutique.gestionnaires.add(user)
            return Response({'message': f'{user.username} ajouté comme gestionnaire'})
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def retirer_gestionnaire(self, request, pk=None):
        """Retirer un gestionnaire de la boutique"""
        boutique = self.get_object()
        
        # Admin ou propriétaire peut retirer des gestionnaires
        if request.user.role != 'admin' and boutique.proprietaire != request.user:
            return Response(
                {'error': 'Seul le propriétaire ou un admin peut retirer des gestionnaires'},
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
            return Response({'message': f'{user.username} retiré des gestionnaires'})
        except User.DoesNotExist:
            return Response(
                {'error': 'Utilisateur introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def mes_boutiques(self, request):
        """Récupère les boutiques de l'utilisateur connecté"""
        boutiques = Boutique.objects.filter(proprietaire=request.user, is_active=True)
        serializer = BoutiqueListSerializer(boutiques, many=True)
        return Response(serializer.data)