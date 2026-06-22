from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from .serializers import UserSerializer, LoginSerializer

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action in ['register', 'login']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Seuls les admins peuvent voir tous les utilisateurs"""
        user = self.request.user
        if user.role == 'admin':
            return User.objects.all()
        # Les autres voient seulement leur propre profil
        return User.objects.filter(id=user.id)
    
    def create(self, request, *args, **kwargs):
        """Créer un utilisateur (réservé aux admins)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Seuls les administrateurs peuvent créer des utilisateurs'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """Modifier un utilisateur"""
        user = self.get_object()
        
        # Seul un admin ou l'utilisateur lui-même peut se modifier
        if request.user.role != 'admin' and request.user.id != user.id:
            return Response(
                {'error': 'Vous ne pouvez pas modifier cet utilisateur'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Un non-admin ne peut pas changer son propre rôle
        if request.user.role != 'admin' and 'role' in request.data:
            return Response(
                {'error': 'Vous ne pouvez pas modifier votre propre rôle'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Supprimer un utilisateur (réservé aux admins)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Seuls les administrateurs peuvent supprimer des utilisateurs'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        
        # Empêcher de se supprimer soi-même
        if user.id == request.user.id:
            return Response(
                {'error': 'Vous ne pouvez pas vous supprimer vous-même'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """Inscription d'un nouvel utilisateur"""
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Connexion utilisateur"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            user = authenticate(username=username, password=password)
            
            if user:
                # Vérifier que l'utilisateur est actif
                if not user.is_active:
                    return Response(
                        {'error': 'Ce compte est désactivé'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                refresh = RefreshToken.for_user(user)
                return Response({
                    'user': UserSerializer(user).data,
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                })
            return Response(
                {'error': 'Identifiants incorrects'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Récupérer les infos de l'utilisateur connecté"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activer/Désactiver un utilisateur (admin seulement)"""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Seuls les administrateurs peuvent activer/désactiver des utilisateurs'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        
        # Empêcher de se désactiver soi-même
        if user.id == request.user.id:
            return Response(
                {'error': 'Vous ne pouvez pas vous désactiver vous-même'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_active = not user.is_active
        user.save()
        
        return Response({
            'message': f'Utilisateur {"activé" if user.is_active else "désactivé"} avec succès',
            'user': UserSerializer(user).data
        })
    
    @action(detail=True, methods=['post'])
    def change_password(self, request, pk=None):
        """Changer le mot de passe d'un utilisateur"""
        user = self.get_object()
        
        # Seul un admin ou l'utilisateur lui-même peut changer le mot de passe
        if request.user.role != 'admin' and request.user.id != user.id:
            return Response(
                {'error': 'Vous ne pouvez pas modifier le mot de passe de cet utilisateur'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response(
                {'error': 'Le nouveau mot de passe est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 6:
            return Response(
                {'error': 'Le mot de passe doit contenir au moins 6 caractères'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Mot de passe modifié avec succès'})

    @action(detail=False, methods=['get'])
    def permissions(self, request):
        """Récupère les permissions de l'utilisateur connecté"""
        user = request.user
        
        permissions = {
            'isAdmin': user.role == 'admin',
            'isVendeur': user.role == 'vendeur',
            'isComptable': user.role == 'comptable',
            'can': {
                'manageUsers': user.role == 'admin',
                'viewUsers': user.role == 'admin',
                'createUser': user.role == 'admin',
                'editUser': user.role == 'admin',
                'deleteUser': user.role == 'admin',
                'manageBoutiques': user.role == 'admin',
                'viewBoutiques': user.role in ['admin', 'vendeur'],
                'createBoutique': user.role == 'admin',
                'editBoutique': user.role == 'admin',
                'deleteBoutique': user.role == 'admin',
                'manageProduits': user.role in ['admin', 'vendeur'],
                'viewProduits': user.role in ['admin', 'vendeur'],
                'createProduit': user.role in ['admin', 'vendeur'],
                'editProduit': user.role in ['admin', 'vendeur'],
                'deleteProduit': user.role in ['admin', 'vendeur'],
                'manageCategories': user.role in ['admin', 'vendeur'],
                'viewCategories': user.role in ['admin', 'vendeur'],
                'createVente': user.role in ['admin', 'vendeur'],
                'viewVentes': user.role in ['admin', 'vendeur', 'comptable'],
                'viewAllVentes': user.role in ['admin', 'comptable'],
                'cancelVente': user.role in ['admin', 'vendeur'],
                'manageClients': user.role in ['admin', 'vendeur'],
                'viewClients': user.role in ['admin', 'vendeur'],
                'manageFournisseurs': user.role in ['admin', 'vendeur'],
                'viewFournisseurs': user.role in ['admin', 'vendeur'],
                'manageCommandes': user.role in ['admin', 'vendeur'],
                'viewCommandes': user.role in ['admin', 'vendeur'],
                'viewReports': user.role in ['admin', 'comptable'],
                'exportReports': user.role in ['admin', 'comptable'],
                'viewVendeurPerformance': user.role == 'admin',
                'viewDashboard': True,
                'viewStatsFinancieres': user.role in ['admin', 'comptable'],
                'viewAlertesStock': user.role in ['admin', 'vendeur'],
            }
        }
        
        return Response(permissions)