from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, F
from .models import Categorie, Produit, ImageProduit
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
    
    @action(detail=True, methods=['get'])
    def produits(self, request, pk=None):
        """Récupère tous les produits d'une catégorie"""
        categorie = self.get_object()
        produits = categorie.produits.all()
        serializer = ProduitListSerializer(produits, many=True)
        return Response(serializer.data)


class ProduitViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin voit tous les produits
        if user.role == 'admin':
            return Produit.objects.all()
        
        # Les autres voient les produits de leurs boutiques
        return Produit.objects.filter(
            Q(boutique__proprietaire=user) | Q(boutique__gestionnaires=user)
        ).distinct()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProduitListSerializer
        return ProduitSerializer
    
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