from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """Accès uniquement aux administrateurs"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'
    
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsVendeur(permissions.BasePermission):
    """Accès aux vendeurs (peuvent voir/manipuler leurs boutiques)"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'vendeur']


class IsComptable(permissions.BasePermission):
    """Accès aux comptables (lecture seule sur ventes/stats)"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'comptable']


class IsAdminOrComptable(permissions.BasePermission):
    """Admin ou Comptable (lecture seule)"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'comptable']


class IsOwnerOrGestionnaire(permissions.BasePermission):
    """Vérifie si l'utilisateur est propriétaire ou gestionnaire de la boutique"""
    def has_object_permission(self, request, view, obj):
        # Admin a tous les droits
        if request.user.role == 'admin':
            return True
        
        # Vérifier si l'objet a une boutique associée
        if hasattr(obj, 'boutique'):
            boutique = obj.boutique
        elif hasattr(obj, 'boutique_id'):
            from boutiques.models import Boutique
            boutique = Boutique.objects.get(id=obj.boutique_id)
        else:
            return False
        
        # Vérifier si l'utilisateur est propriétaire ou gestionnaire
        return (boutique.proprietaire == request.user or 
                request.user in boutique.gestionnaires.all())


class CanCreateVente(permissions.BasePermission):
    """Seuls les admins et vendeurs peuvent créer des ventes"""
    def has_permission(self, request, view):
        if request.method == 'POST':
            return request.user.role in ['admin', 'vendeur']
        return True


class CanModifyUser(permissions.BasePermission):
    """Seuls les admins peuvent modifier/supprimer des utilisateurs"""
    def has_permission(self, request, view):
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return request.user.role == 'admin'
        return request.user.is_authenticated