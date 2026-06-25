from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum
from .models import Depense
from .serializers import DepenseSerializer, DepenseListSerializer
from boutiques.models import Boutique

class DepenseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Depense.objects.all()
        return Depense.objects.filter(
            Q(boutique__proprietaire=user) | Q(boutique__gestionnaires=user)
        ).distinct()

    def get_serializer_class(self):
        if self.action == 'list':
            return DepenseListSerializer
        return DepenseSerializer

    def get_queryset_filtered(self):
        queryset = self.get_queryset()

        boutique_id = self.request.query_params.get('boutique')
        if boutique_id:
            queryset = queryset.filter(boutique_id=boutique_id)

        categorie = self.request.query_params.get('categorie')
        if categorie:
            queryset = queryset.filter(categorie=categorie)

        type_depense = self.request.query_params.get('type_depense')
        if type_depense:
            queryset = queryset.filter(type_depense=type_depense)

        statut_remboursement = self.request.query_params.get('statut_remboursement')
        if statut_remboursement:
            queryset = queryset.filter(statut_remboursement=statut_remboursement)

        date_debut = self.request.query_params.get('date_debut')
        date_fin = self.request.query_params.get('date_fin')
        if date_debut:
            queryset = queryset.filter(date_depense__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_depense__lte=date_fin)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(titre__icontains=search) | Q(description__icontains=search)
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

    def perform_create(self, serializer):
        serializer.save(effectuee_par=self.request.user)

    def destroy(self, request, *args, **kwargs):
        depense = self.get_object()
        if request.user.role != 'admin' and depense.effectuee_par != request.user:
            return Response(
                {'error': 'Vous ne pouvez supprimer que vos propres dépenses'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def marquer_rembourse(self, request, pk=None):
        depense = self.get_object()
        if request.user.role != 'admin':
            return Response(
                {'error': 'Seul un admin peut marquer une dépense comme remboursée'},
                status=status.HTTP_403_FORBIDDEN
            )
        depense.statut_remboursement = 'rembourse'
        depense.save()
        return Response({'message': 'Dépense marquée comme remboursée'})

    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        queryset = self.get_queryset_filtered()
        stats = {
            'total_depenses': queryset.aggregate(total=Sum('montant'))['total'] or 0,
            'nombre_depenses': queryset.count(),
            'depenses_boutique': queryset.filter(type_depense='boutique').aggregate(total=Sum('montant'))['total'] or 0,
            'depenses_personnelles': queryset.filter(type_depense='personnelle').aggregate(total=Sum('montant'))['total'] or 0,
            'en_attente_remboursement': queryset.filter(statut_remboursement='en_attente').aggregate(total=Sum('montant'))['total'] or 0,
        }
        return Response(stats)