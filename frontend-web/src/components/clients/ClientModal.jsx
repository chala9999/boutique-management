import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { clientsAPI } from '../../api/clients';
import { boutiquesAPI } from '../../api/boutiques';
import { X } from 'lucide-react';

const ClientModal = ({ client, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    telephone2: '',
    adresse: '',
    ville: '',
    pays: 'Niger',
    boutique: '',
    notes: '',
  });

  // Récupérer les boutiques
  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  /*useEffect(() => {
    if (client) {
      setFormData({
        nom: client.nom || '',
        prenom: client.prenom || '',
        email: client.email || '',
        telephone: client.telephone || '',
        telephone2: client.telephone2 || '',
        adresse: client.adresse || '',
        ville: client.ville || '',
        pays: client.pays || 'Niger',
        boutique: client.boutique || '',
        notes: client.notes || '',
      });
    }
  // }, [client]);*/

  useEffect(() => {
  if (client) {
    setFormData({
      nom: client.nom || '',
      prenom: client.prenom || '',
      email: client.email || '',
      telephone: client.telephone || '',
      telephone2: client.telephone2 || '',
      adresse: client.adresse || '',
      ville: client.ville || '',
      pays: client.pays || 'Niger',
      boutique: client.boutique || '',
      notes: client.notes || '',
    });
  } else {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      telephone2: '',
      adresse: '',
      ville: '',
      pays: 'Niger',
      boutique: '',
      notes: '',
    });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const mutation = useMutation({
    mutationFn: (data) =>
      client ? clientsAPI.update(client.id, data) : clientsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      alert(
        client ? 'Client modifié avec succès' : 'Client créé avec succès'
      );
      onClose();
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Une erreur est survenue');
    },
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {client ? 'Modifier le client' : 'Nouveau client'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nom *</label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Prénom</label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Boutique *</label>
            <select
              name="boutique"
              value={formData.boutique}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Sélectionnez une boutique</option>
              {boutiques?.results?.map((boutique) => (
                <option key={boutique.id} value={boutique.id}>
                  {boutique.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Téléphone *</label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Téléphone 2</label>
              <input
                type="tel"
                name="telephone2"
                value={formData.telephone2}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="label">Adresse</label>
            <textarea
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              className="input"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ville</label>
              <input
                type="text"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">Pays</label>
              <input
                type="text"
                name="pays"
                value={formData.pays}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input"
              rows="3"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 btn-primary"
            >
              {mutation.isPending
                ? 'Enregistrement...'
                : client
                ? 'Modifier'
                : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;