import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SIZES, SPACING, RADIUS } from '../../constants/theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuthStore();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'admin',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!formData.username || !formData.password || !formData.first_name) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData) {
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('\n');
        Alert.alert('Erreur d\'inscription', errorMessages);
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Créer un compte</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formContainer}>
          {/* Prénom */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Prénom *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.gray500}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Votre prénom"
                value={formData.first_name}
                onChangeText={(text) =>
                  setFormData({ ...formData, first_name: text })
                }
              />
            </View>
          </View>

          {/* Nom */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.gray500}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Votre nom"
                value={formData.last_name}
                onChangeText={(text) =>
                  setFormData({ ...formData, last_name: text })
                }
              />
            </View>
          </View>

          {/* Username */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom d'utilisateur *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="at-outline"
                size={20}
                color={COLORS.gray500}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ex: jean.dupont"
                value={formData.username}
                onChangeText={(text) =>
                  setFormData({ ...formData, username: text })
                }
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.gray500}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="email@exemple.com"
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.gray500}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Minimum 6 caractères"
                value={formData.password}
                onChangeText={(text) =>
                  setFormData({ ...formData, password: text })
                }
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={COLORS.gray500}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bouton d'inscription */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </Text>
          </TouchableOpacity>

          {/* Lien connexion */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.xxl,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  title: {
    fontSize: SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  formContainer: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: SPACING.base,
  },
  label: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: SIZES.base,
    color: COLORS.text,
  },
  eyeIcon: {
    padding: SPACING.xs,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    alignItems: 'center',
    marginTop: SPACING.base,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: SIZES.base,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  loginText: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
});