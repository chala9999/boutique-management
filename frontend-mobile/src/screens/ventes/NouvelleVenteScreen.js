import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ventesAPI } from '../../api/ventes';
import { produitsAPI } from '../../api/produits';
import { boutiquesAPI } from '../../api/boutiques';
import { clientsAPI } from '../../api/clients';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';

export default function NouvelleVenteScreen({ navigation }) {
  const queryClient = useQueryClient();
  const [selectedBoutique, setSelectedBoutique] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [searchProduit, setSearchProduit] = useState('');
  const [panier, setPanier] = useState([]);
  const [modePaiement, setModePaiement] = useState('especes');
  const [montantPaye, setMontantPaye] = useState('');
  const [showBoutiqueModal, setShowBoutiqueModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);

  // Récupérer les boutiques
  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  // Récupérer les produits
  const { data: produits } = useQuery({
    queryKey: ['produits', selectedBoutique, searchProduit],
    queryFn: () =>
      produitsAPI.getAll({
        boutique: selectedBoutique,
        search: searchProduit,
        actifs: true,
      }),
    enabled: !!selectedBoutique,
  });

  // Récupérer les clients
  const { data: clients } = useQuery({
    queryKey: ['clients', selectedBoutique],
    queryFn: () => clientsAPI.getAll({ boutique: selectedBoutique }),
    enabled: !!selectedBoutique,
  });

  // Créer la vente
  const createVenteMutation = useMutation({
    mutationFn: (data) => ventesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['ventes']);
      queryClient.invalidateQueries(['produits']);
      Alert.alert('Succès', 'Vente créée avec succès !', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error) => {
      Alert.alert(
        'Erreur',
        error.response?.data?.error || 'Erreur lors de la création de la vente'
      );
    },
  });

  // Ajouter au panier
  const ajouterAuPanier = (produit) => {
    const existe = panier.find((item) => item.produit === produit.id);

    if (existe) {
      setPanier(
        panier.map((item) =>
          item.produit === produit.id
            ? { ...item, quantite: item.quantite + 1 }
            : item
        )
      );
    } else {
      setPanier([
        ...panier,
        {
          produit: produit.id,
          produit_info: produit,
          quantite: 1,
          prix_unitaire: produit.prix_vente,
          remise_pourcentage: 0,
        },
      ]);
    }
  };

  // Modifier quantité
  const modifierQuantite = (produitId, delta) => {
    setPanier(
      panier
        .map((item) => {
          if (item.produit === produitId) {
            const newQuantite = item.quantite + delta;
            return newQuantite > 0 ? { ...item, quantite: newQuantite } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Retirer du panier
  const retirerDuPanier = (produitId) => {
    setPanier(panier.filter((item) => item.produit !== produitId));
  };

  // Calculs
  const montantTotal = panier.reduce(
    (acc, item) => acc + item.quantite * item.prix_unitaire,
    0
  );

  const montantRendu = Math.max(0, parseFloat(montantPaye || 0) - montantTotal);

  // Valider la vente
  const handleValiderVente = () => {
    if (!selectedBoutique) {
      Alert.alert('Erreur', 'Veuillez sélectionner une boutique');
      return;
    }

    if (panier.length === 0) {
      Alert.alert('Erreur', 'Le panier est vide');
      return;
    }

    setShowPaiementModal(true);
  };

  const confirmerVente = () => {
    const venteData = {
      boutique: parseInt(selectedBoutique),
      client: selectedClient ? parseInt(selectedClient) : null,
      mode_paiement: modePaiement,
      remise_type: 'pourcentage',
      remise_valeur: 0,
      tva_pourcentage: 0,
      montant_paye: parseFloat(montantPaye) || 0,
      lignes: panier.map((item) => ({
        produit: item.produit,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire,
        remise_pourcentage: item.remise_pourcentage,
      })),
    };

    setShowPaiementModal(false);
    createVenteMutation.mutate(venteData);
  };

  const getBoutiqueNom = () => {
    const boutique = boutiques?.results?.find(
      (b) => b.id === parseInt(selectedBoutique)
    );
    return boutique?.nom || 'Sélectionner';
  };

  const getClientNom = () => {
    if (!selectedClient) return 'Client anonyme';
    const client = clients?.results?.find((c) => c.id === parseInt(selectedClient));
    return client?.nom_complet || 'Client anonyme';
  };

  return (
    <View style={styles.container}>
      {/* En-tête avec sélections */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowBoutiqueModal(true)}
        >
          <Ionicons name="storefront" size={20} color={COLORS.primary} />
          <Text style={styles.selectButtonText} numberOfLines={1}>
            {getBoutiqueNom()}
          </Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
        </TouchableOpacity>

        {selectedBoutique && (
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowClientModal(true)}
          >
            <Ionicons name="person" size={20} color={COLORS.primary} />
            <Text style={styles.selectButtonText} numberOfLines={1}>
              {getClientNom()}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {/* Recherche produit */}
        {selectedBoutique && (
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={COLORS.gray500}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un produit..."
              value={searchProduit}
              onChangeText={setSearchProduit}
            />
          </View>
        )}

        {/* Liste des produits */}
        {selectedBoutique && (
          <FlatList
            data={produits?.results || []}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.produitCard}
                onPress={() => ajouterAuPanier(item)}
              >
                <View style={styles.produitIcon}>
                  <Ionicons name="cube" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.produitInfo}>
                  <Text style={styles.produitNom}>{item.nom}</Text>
                  <Text style={styles.produitStock}>Stock: {item.stock_actuel}</Text>
                </View>
                <Text style={styles.produitPrix}>
                  {item.prix_vente.toLocaleString()} FCFA
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Ionicons name="cube-outline" size={48} color={COLORS.gray400} />
                <Text style={styles.emptyText}>
                  {searchProduit ? 'Aucun produit trouvé' : 'Recherchez un produit'}
                </Text>
              </View>
            }
          />
        )}

        {!selectedBoutique && (
          <View style={styles.emptyList}>
            <Ionicons name="storefront-outline" size={64} color={COLORS.gray400} />
            <Text style={styles.emptyText}>Sélectionnez une boutique</Text>
          </View>
        )}
      </View>

      {/* Panier flottant */}
      {panier.length > 0 && (
        <View style={styles.panier}>
          <View style={styles.panierHeader}>
            <View style={styles.panierHeaderLeft}>
              <Ionicons name="cart" size={20} color={COLORS.primary} />
              <Text style={styles.panierTitle}>Panier ({panier.length})</Text>
            </View>
            <TouchableOpacity onPress={() => setPanier([])}>
              <Text style={styles.panierClear}>Vider</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.panierList} horizontal={false}>
            {panier.map((item) => (
              <View key={item.produit} style={styles.panierItem}>
                <View style={styles.panierItemInfo}>
                  <Text style={styles.panierItemNom} numberOfLines={1}>
                    {item.produit_info.nom}
                  </Text>
                  <Text style={styles.panierItemPrix}>
                    {item.prix_unitaire.toLocaleString()} FCFA
                  </Text>
                </View>

                <View style={styles.panierItemActions}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => modifierQuantite(item.produit, -1)}
                  >
                    <Ionicons name="remove" size={16} color={COLORS.primary} />
                  </TouchableOpacity>

                  <Text style={styles.panierItemQuantite}>{item.quantite}</Text>

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => modifierQuantite(item.produit, 1)}
                  >
                    <Ionicons name="add" size={16} color={COLORS.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => retirerDuPanier(item.produit)}
                  >
                    <Ionicons name="trash" size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.panierItemTotal}>
                  {(item.quantite * item.prix_unitaire).toLocaleString()} FCFA
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.panierFooter}>
            <View style={styles.panierTotal}>
              <Text style={styles.panierTotalLabel}>Total</Text>
              <Text style={styles.panierTotalValue}>
                {montantTotal.toLocaleString()} FCFA
              </Text>
            </View>
            <TouchableOpacity
              style={styles.validateButton}
              onPress={handleValiderVente}
            >
              <Text style={styles.validateButtonText}>Valider</Text>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal Boutique */}
      <Modal
        visible={showBoutiqueModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBoutiqueModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une boutique</Text>
              <TouchableOpacity onPress={() => setShowBoutiqueModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={boutiques?.results || []}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedBoutique(item.id.toString());
                    setPanier([]);
                    setShowBoutiqueModal(false);
                  }}
                >
                  <Ionicons name="storefront" size={24} color={COLORS.primary} />
                  <Text style={styles.modalItemText}>{item.nom}</Text>
                  {selectedBoutique === item.id.toString() && (
                    <Ionicons name="checkmark" size={24} color={COLORS.success} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Client */}
      <Modal
        visible={showClientModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClientModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un client</Text>
              <TouchableOpacity onPress={() => setShowClientModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setSelectedClient('');
                setShowClientModal(false);
              }}
            >
              <Ionicons name="person" size={24} color={COLORS.gray500} />
              <Text style={styles.modalItemText}>Client anonyme</Text>
              {!selectedClient && (
                <Ionicons name="checkmark" size={24} color={COLORS.success} />
              )}
            </TouchableOpacity>
            <FlatList
              data={clients?.results || []}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedClient(item.id.toString());
                    setShowClientModal(false);
                  }}
                >
                  <Ionicons name="person" size={24} color={COLORS.primary} />
                  <Text style={styles.modalItemText}>{item.nom_complet}</Text>
                  {selectedClient === item.id.toString() && (
                    <Ionicons name="checkmark" size={24} color={COLORS.success} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Paiement */}
      <Modal
        visible={showPaiementModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaiementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paiement</Text>
              <TouchableOpacity onPress={() => setShowPaiementModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.paiementContent}>
              <View style={styles.paiementTotal}>
                <Text style={styles.paiementTotalLabel}>Total à payer</Text>
                <Text style={styles.paiementTotalValue}>
                  {montantTotal.toLocaleString()} FCFA
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mode de paiement</Text>
                <View style={styles.paymentModes}>
                  {[
                    { value: 'especes', label: 'Espèces', icon: 'cash' },
                    { value: 'mobile_money', label: 'Mobile Money', icon: 'phone-portrait' },
                    { value: 'carte', label: 'Carte', icon: 'card' },
                  ].map((mode) => (
                    <TouchableOpacity
                      key={mode.value}
                      style={[
                        styles.paymentMode,
                        modePaiement === mode.value && styles.paymentModeActive,
                      ]}
                      onPress={() => setModePaiement(mode.value)}
                    >
                      <Ionicons
                        name={mode.icon}
                        size={24}
                        color={
                          modePaiement === mode.value ? COLORS.primary : COLORS.gray500
                        }
                      />
                      <Text
                        style={[
                          styles.paymentModeText,
                          modePaiement === mode.value && styles.paymentModeTextActive,
                        ]}
                      >
                        {mode.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Montant reçu</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  value={montantPaye}
                  onChangeText={setMontantPaye}
                />
                <TouchableOpacity
                  style={styles.exactButton}
                  onPress={() => setMontantPaye(montantTotal.toString())}
                >
                  <Text style={styles.exactButtonText}>Montant exact</Text>
                </TouchableOpacity>
              </View>

              {parseFloat(montantPaye) > 0 && (
                <View style={styles.monnaie}>
                  <Text style={styles.monnaieLabel}>Monnaie à rendre</Text>
                  <Text style={styles.monnaieValue}>
                    {montantRendu.toLocaleString()} FCFA
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  createVenteMutation.isPending && styles.confirmButtonDisabled,
                ]}
                onPress={confirmerVente}
                disabled={createVenteMutation.isPending}
              >
                <Text style={styles.confirmButtonText}>
                  {createVenteMutation.isPending
                    ? 'Traitement...'
                    : 'Confirmer la vente'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  selectButtonText: {
    flex: 1,
    fontSize: SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    margin: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: SIZES.md,
    color: COLORS.text,
  },
  produitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  produitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  produitInfo: {
    flex: 1,
  },
  produitNom: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  produitStock: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  produitPrix: {
    fontSize: SIZES.base,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.base,
  },
  panier: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: '60%',
  },
  panierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  panierHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  panierTitle: {
    fontSize: SIZES.base,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  panierClear: {
    fontSize: SIZES.sm,
    color: COLORS.error,
    fontWeight: '600',
  },
  panierList: {
    maxHeight: 200,
  },
  panierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  panierItemInfo: {
    flex: 1,
  },
  panierItemNom: {
    fontSize: SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  panierItemPrix: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
  },
  panierItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panierItemQuantite: {
    fontSize: SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    minWidth: 24,
    textAlign: 'center',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  panierItemTotal: {
    fontSize: SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
    minWidth: 80,
    textAlign: 'right',
  },
  panierFooter: {
    padding: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  panierTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  panierTotalLabel: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  panierTotalValue: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  validateButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  validateButtonText: {
    color: '#fff',
    fontSize: SIZES.base,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  modalItemText: {
    flex: 1,
    fontSize: SIZES.base,
    color: COLORS.text,
  },
  paiementContent: {
    padding: SPACING.lg,
  },
  paiementTotal: {
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  paiementTotalLabel: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  paiementTotalValue: {
    fontSize: SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  paymentModes: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  paymentMode: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.gray50,
  },
  paymentModeActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  paymentModeText: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  paymentModeTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: SIZES.lg,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  exactButton: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-end',
  },
  exactButtonText: {
    fontSize: SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  monnaie: {
    backgroundColor: COLORS.success + '10',
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  monnaieLabel: {
fontSize: SIZES.md,
color: COLORS.textSecondary,
marginBottom: SPACING.xs,
},
monnaieValue: {
fontSize: SIZES.xxl,
fontWeight: 'bold',
color: COLORS.success,
},
confirmButton: {
backgroundColor: COLORS.primary,
padding: SPACING.base,
borderRadius: RADIUS.md,
alignItems: 'center',
},
confirmButtonDisabled: {
opacity: 0.6,
},
confirmButtonText: {
color: '#fff',
fontSize: SIZES.base,
fontWeight: 'bold',
},
});