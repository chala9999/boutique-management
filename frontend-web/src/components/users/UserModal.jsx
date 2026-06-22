import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { usersAPI } from '../../api/users';
import { boutiquesAPI } from '../../api/boutiques';
import { X, Shield, Store, Users } from 'lucide-react';

const UserModal = ({ user, onClose, readOnly = false }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'vendeur',
    telephone: '',
    boutiques: [],
  });
  const [error, setError] = useState('');

  // ✅ Récupérer les boutiques
  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  // ✅ Correction du useEffect
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role || 'vendeur',
        telephone: user.telephone || '',
        boutiques: user.boutiques?.map(b => b.id) || [],
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'vendeur',
        telephone: '',
        boutiques: [],
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (data) =>
      user ? usersAPI.update(user.id, data) : usersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      onClose();
    },
    onError: (error) => {
      console.error('Erreur complète:', error.response?.data);
      const errorData = error.response?.data;
      if (errorData) {
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          })
          .join('\n');
        setError(errorMessages || 'Une erreur est survenue');
      } else {
        setError('Une erreur est survenue');
      }
    },
  });

  const handleChange = (e) => {
    if (readOnly) return;
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
  };

  // ✅ Gestion des boutiques (multiple select)
  const handleBoutiquesChange = (e) => {
    if (readOnly) return;
    const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setFormData({
      ...formData,
      boutiques: selected,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;
    
    setError('');

    if (!user && !formData.password) {
      setError('Le mot de passe est requis pour un nouvel utilisateur');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!formData.first_name.trim()) {
      setError('Le prénom est requis');
      return;
    }

    if (!formData.last_name.trim()) {
      setError('Le nom est requis');
      return;
    }

    if (!formData.username.trim()) {
      setError('Le nom d\'utilisateur est requis');
      return;
    }

    const dataToSend = { ...formData };

    if (user && !formData.password) {
      delete dataToSend.password;
    }

    if (user) {
      delete dataToSend.username;
    }

    console.log('Données envoyées:', dataToSend);
    mutation.mutate(dataToSend);
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <Shield className="w-4 h-4 text-red-500" />;
      case 'vendeur': return <Store className="w-4 h-4 text-blue-500" />;
      case 'comptable': return <Users className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  const getRoleDescription = (role) => {
    switch(role) {
      case 'admin':
        return 'Accès complet à toutes les fonctionnalités. Peut gérer les utilisateurs et toutes les boutiques.';
      case 'vendeur':
        return 'Peut créer des ventes et gérer les produits de ses boutiques.';
      case 'comptable':
        return 'Accès en lecture aux ventes, statistiques et rapports.';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {readOnly 
              ? 'Détails de l\'utilisateur' 
              : (user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur')
            }
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && !readOnly && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prénom *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="input"
                placeholder="Ex: Jean"
                required={!readOnly}
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="label">Nom *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="input"
                placeholder="Ex: Dupont"
                required={!readOnly}
                disabled={readOnly}
              />
            </div>
          </div>

          <div>
            <label className="label">Nom d'utilisateur *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input"
              placeholder="Ex: jean.dupont"
              required={!readOnly}
              disabled={readOnly || !!user}
            />
            {user && (
              <p className="text-xs text-gray-500 mt-1">
                Le nom d'utilisateur ne peut pas être modifié
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="Ex: jean@boutique.com"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className="input"
                placeholder="Ex: 90000000"
                disabled={readOnly}
              />
            </div>
          </div>

          <div>
            <label className="label">Rôle *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input"
              required={!readOnly}
              disabled={readOnly}
            >
              <option value="vendeur">Vendeur</option>
              <option value="comptable">Comptable</option>
              <option value="admin">Administrateur</option>
            </select>
            
            <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-start space-x-2">
              {getRoleIcon(formData.role)}
              <p className="text-xs text-gray-600 flex-1">
                {getRoleDescription(formData.role)}
              </p>
            </div>
          </div>

          {/* ✅ Sélection des boutiques */}
          {(formData.role === 'vendeur' || formData.role === 'comptable') && (
            <div>
              <label className="label">Boutiques</label>
              {readOnly ? (
                // Mode lecture — affiche seulement les boutiques de l'utilisateur
                <div className="space-y-2">
                  {user?.boutiques_detail?.length > 0 ? (
                    user.boutiques_detail.map((b) => (
                      <div key={b.id} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                        {b.nom}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">Aucune boutique assignée</p>
                  )}
                </div>
              ) : (
                // Mode édition — select multiple
                <>
                  <select
                    name="boutiques"
                    value={formData.boutiques}
                    onChange={handleBoutiquesChange}
                    className="input"
                    multiple
                    size={4}
                  >
                    {boutiques?.results?.map((b) => (
                      <option key={b.id} value={b.id}>{b.nom}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Maintenez Ctrl (ou Cmd) pour sélectionner plusieurs boutiques
                  </p>
                </>
              )}
            </div>
          )}

          {!readOnly && (
            <div>
              <label className="label">
                Mot de passe {user ? '(laisser vide pour ne pas changer)' : '*'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder={user ? 'Nouveau mot de passe' : 'Minimum 6 caractères'}
                required={!user}
              />
              <p className="text-xs text-gray-500 mt-1">
                {user
                  ? 'Laissez vide si vous ne souhaitez pas changer le mot de passe'
                  : 'Le mot de passe doit contenir au moins 6 caractères'}
              </p>
            </div>
          )}

          {readOnly && user && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Date de création :</span>{' '}
                {new Date(user.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Dernière modification :</span>{' '}
                {new Date(user.updated_at).toLocaleDateString()}
              </p>
            </div>
          )}

          {!readOnly && (
            <div className="flex items-center space-x-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 btn-secondary" disabled={mutation.isPending}>
                Annuler
              </button>
              <button type="submit" disabled={mutation.isPending} className="flex-1 btn-primary">
                {mutation.isPending ? 'Enregistrement...' : (user ? 'Modifier' : 'Créer')}
              </button>
            </div>
          )}

          {readOnly && (
            <div className="flex justify-end pt-4">
              <button type="button" onClick={onClose} className="btn-primary">
                Fermer
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UserModal;