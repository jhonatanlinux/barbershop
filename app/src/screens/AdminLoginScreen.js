// ── Admin Login ────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Button } from '../components';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginScreen({ navigation }) {
  const { loginAdmin } = useAuth();
  const [email, setEmail]   = useState('');
  const [senha, setSenha]   = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !senha) { setError('Preencha usuário e senha.'); return; }
    setLoading(true);
    try {
      await loginAdmin(email, senha);
    } catch (e) {
      setError(e.message || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.icon}>🔐</Text>
        <Text style={s.title}>Painel Admin</Text>
        <Text style={s.sub}>Barbershop</Text>

        <View style={s.card}>
          {error ? <Text style={s.err}>{error}</Text> : null}
          <Text style={s.lbl}>USUÁRIO</Text>
          <TextInput style={s.inp} value={email} onChangeText={v => { setEmail(v); setError(''); }}
            placeholder="admin" placeholderTextColor={colors.muted} autoCapitalize="none" />
          <Text style={s.lbl}>SENHA</Text>
          <TextInput style={s.inp} value={senha} onChangeText={v => { setSenha(v); setError(''); }}
            placeholder="••••••••" placeholderTextColor={colors.muted} secureTextEntry returnKeyType="done" onSubmitEditing={handleLogin} />
          <Button title="Entrar no painel" variant="gold" onPress={handleLogin} loading={loading} style={{ marginTop: 4 }} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 14, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: colors.muted }}>← Área do cliente</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  icon:   { textAlign: 'center', fontSize: 40, marginBottom: 10 },
  title:  { textAlign: 'center', fontSize: 28, fontWeight: '900', color: colors.cream, marginBottom: 4 },
  sub:    { textAlign: 'center', fontSize: 12, color: colors.muted, letterSpacing: 1, marginBottom: 24 },
  card:   { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: spacing.xl },
  lbl:    { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 1.5, marginBottom: 5 },
  inp:    { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border2, color: colors.cream, fontSize: 15, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
  err:    { color: colors.redText, fontSize: 13, marginBottom: 12, backgroundColor: colors.redBg, padding: 10, borderRadius: 8 },
});
