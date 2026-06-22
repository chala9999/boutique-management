from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, F
from .models import Categorie, Produit, ImageProduit
from core.permissions import IsVendeur, IsOwnerOrGestionnaire, IsAdmin

from .serializers import (
    CategorieSerializer, 
    ProduitSerializer, 
    ProduitListSerializer,
    ImageProduitSerializer
)


class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Seul l'admin peut créer/modifier/supprimer des catégories
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        # Tout le monde peut voir les catégories
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['get'])
    def produits(self, request, pk=None):
        """Récupère tous les produits d'une catégorie"""
        categorie = self.get_object()
        produits = categorie.produits.all()
        serializer = ProduitListSerializer(produits, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='upload-image')
    def upload_image(self, request, pk=None):
        """Uploader l'image de la catégorie"""
        categorie = self.get_object()
        
        if 'image' not in request.FILES:
            return Response(
                {'error': 'Aucune image fournie'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image = request.FILES['image']
        
        # Vérifier le type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image.content_type not in allowed_types:
            return Response(
                {'error': 'Format non supporté. Utilisez JPG, PNG, GIF ou WEBP'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier la taille (max 5MB)
        if image.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Le fichier ne doit pas dépasser 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        categorie.image = image
        categorie.save()
        
        return Response({
            'message': 'Image uploadée avec succès',
            'image_url': categorie.image.url if categorie.image else None
        })


class ProduitViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsVendeur]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin voit tous les produits
        if user.role == 'admin':
            return Produit.objects.all()
        
        # Les autres voient les produits de leurs boutiques
        return Produit.objects.filter(
            Q(boutique__proprietaire=user) | Q(boutique__gestionnaires=user)
        ).distinct()
    
    def get_permissions(self):
        if self.action in ['destroy', 'create']:
            self.permission_classes = [IsAuthenticated, IsAdmin]
        elif self.action in ['upload_image_principale', 'ajouter_image']:
            self.permission_classes = [IsAuthenticated, IsVendeur]
        else:
            self.permission_classes = [IsAuthenticated, IsVendeur]
        return super().get_permissions()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProduitListSerializer
        return ProduitSerializer
    
    def perform_create(self, serializer):
        # Vérifier que l'utilisateur a accès à la boutique
        boutique_id = self.request.data.get('boutique')
        if boutique_id:
            from boutiques.models import Boutique
            try:
                boutique = Boutique.objects.get(id=boutique_id)
                if self.request.user.role != 'admin' and boutique.proprietaire != self.request.user and self.request.user not in boutique.gestionnaires.all():
                    raise PermissionError("Vous n'avez pas accès à cette boutique")
            except Boutique.DoesNotExist:
                pass
        serializer.save()
    
    def get_queryset_filtered(self):
        """Filtres personnalisés"""
        queryset = self.get_queryset()
        
        # Filtre par boutique
        boutique_id = self.request.query_params.get('boutique', None)
        if boutique_id:
            queryset = queryset.filter(boutique_id=boutique_id)
        
        # Filtre par catégorie
        categorie_id = self.request.query_params.get('categorie', None)
        if categorie_id:
            queryset = queryset.filter(categorie_id=categorie_id)
        
        # Filtre stock faible
        stock_faible = self.request.query_params.get('stock_faible', None)
        if stock_faible == 'true':
            queryset = queryset.filter(stock_actuel__lte=F('stock_minimum'))
        
        # Filtre actifs seulement
        actifs = self.request.query_params.get('actifs', None)
        if actifs == 'true':
            queryset = queryset.filter(is_active=True)
        elif actifs == 'false':
            queryset = queryset.filter(is_active=False)
        
        
        # Recherche
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) |
                Q(reference__icontains=search) |
                Q(code_barre__icontains=search)
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
    
    @action(detail=True, methods=['post', 'patch'], url_path='upload-image')
    def upload_image_principale(self, request, pk=None):
        """Uploader l'image principale du produit"""
        produit = self.get_object()
        
        if 'image' not in request.FILES:
            return Response(
                {'error': 'Aucune image fournie'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image = request.FILES['image']
        
        # Vérifier le type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image.content_type not in allowed_types:
            return Response(
                {'error': 'Format non supporté. Utilisez JPG, PNG, GIF ou WEBP'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier la taille (max 5MB)
        if image.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Le fichier ne doit pas dépasser 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        produit.image_principale = image
        produit.save()
        
        return Response({
            'message': 'Image uploadée avec succès',
            'image_url': produit.image_principale.url if produit.image_principale else None
        })
    
    # REMPLACE les 3 fonctions mal indentées par ceci ✅
    
    @action(detail=True, methods=['post'])
    def activer(self, request, pk=None):
        produit = self.get_object()
        produit.is_active = True
        produit.save()
        return Response({'message': 'Produit activé', 'is_active': True})
    
    @action(detail=True, methods=['post'])
    def desactiver(self, request, pk=None):
        produit = self.get_object()
        produit.is_active = False
        produit.save()
        return Response({'message': 'Produit désactivé', 'is_active': False})

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        produit = self.get_object()
        produit.is_active = not produit.is_active
        produit.save()
        return Response({
            'message': f'Produit {"activé" if produit.is_active else "désactivé"}',
            'is_active': produit.is_active
        })

    
    @action(detail=True, methods=['post'])
    def ajouter_stock(self, request, pk=None):
        """Ajouter du stock à un produit"""
        produit = self.get_object()
        quantite = request.data.get('quantite', 0)
        
        try:
            quantite = int(quantite)
            if quantite <= 0:
                return Response(
                    {'error': 'La quantité doit être positive'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            produit.stock_actuel += quantite
            produit.save()
            
            serializer = self.get_serializer(produit)
            return Response(serializer.data)
        
        except ValueError:
            return Response(
                {'error': 'Quantité invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def retirer_stock(self, request, pk=None):
        """Retirer du stock d'un produit"""
        produit = self.get_object()
        quantite = request.data.get('quantite', 0)
        
        try:
            quantite = int(quantite)
            if quantite <= 0:
                return Response(
                    {'error': 'La quantité doit être positive'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if produit.stock_actuel < quantite:
                return Response(
                    {'error': 'Stock insuffisant'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            produit.stock_actuel -= quantite
            produit.save()
            
            serializer = self.get_serializer(produit)
            return Response(serializer.data)
        
        except ValueError:
            return Response(
                {'error': 'Quantité invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def stock_faible(self, request):
        """Liste des produits avec stock faible"""
        produits = self.get_queryset().filter(
            stock_actuel__lte=F('stock_minimum'),
            is_active=True
        )
        serializer = ProduitListSerializer(produits, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def ajouter_image(self, request, pk=None):
        """Ajouter une image supplémentaire au produit"""
        produit = self.get_object()
        image = request.FILES.get('image')
        
        if not image:
            return Response(
                {'error': 'Image requise'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_produit = ImageProduit.objects.create(
            produit=produit,
            image=image
        )
        
        serializer = ImageProduitSerializer(image_produit)
        return Response(serializer.data, status=status.HTTP_201_CREATED)