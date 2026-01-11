from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count
from .models import Client
from .serializers import ClientSerializer, ClientListSerializer

class ClientViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin voit tous les clients
        if user.role == 'admin':
            return Client.objects.all()
        
        # Les autres voient les clients de leurs boutiques
        return Client.objects.filter(
            Q(boutique__proprietaire=user) | Q(boutique__gestionnaires=user)
        ).distinct()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ClientListSerializer
        return ClientSerializer
    
    def get_queryset_filtered(self):
        """Filtres personnalisés"""
        queryset = self.get_queryset()
        
        # Filtre par boutique
        boutique_id = self.request.query_params.get('boutique', None)
        if boutique_id:
            queryset = queryset.filter(boutique_id=boutique_id)
        
        # Recherche
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) |
                Q(prenom__icontains=search) |
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
    def historique_achats(self, request, pk=None):
        """Historique des achats d'un client"""
        client = self.get_object()
        achats = client.achats.filter(statut='completee').order_by('-date_vente')
        
        from ventes.serializers import VenteListSerializer
        serializer = VenteListSerializer(achats, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def statistiques(self, request, pk=None):
        """Statistiques d'un client"""
        client = self.get_object()
        
        achats_completes = client.achats.filter(statut='completee')
        
        stats = {
            'total_achats': client.total_achats,
            'nombre_achats': client.nombre_achats,
            'points_fidelite': client.points_fidelite,
            'montant_moyen': achats_completes.aggregate(
                moyenne=Sum('montant_final')
            )['moyenne'] / client.nombre_achats if client.nombre_achats > 0 else 0,
            'dernier_achat': achats_completes.first().date_vente if achats_completes.exists() else None,
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def ajouter_points(self, request, pk=None):
        """Ajouter des points de fidélité"""
        client = self.get_object()
        points = request.data.get('points', 0)
        
        try:
            points = int(points)
            if points <= 0:
                return Response(
                    {'error': 'Les points doivent être positifs'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            client.points_fidelite += points
            client.save()
            
            serializer = self.get_serializer(client)
            return Response(serializer.data)
        
        except ValueError:
            return Response(
                {'error': 'Points invalides'},
                status=status.HTTP_400_BAD_REQUEST
            )