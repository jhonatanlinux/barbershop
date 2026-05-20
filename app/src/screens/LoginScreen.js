import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors, spacing, radius } from '../theme';
import { Button } from '../components';
import { useAuth } from '../context/AuthContext';
import { maskCPF, validarCPF } from '../utils';

// ── Ícone tesoura SVG ──────────────────────────────────────
function ScissorIcon() {
  return (
    <Svg width={64} height={64} viewBox="0 0 52 52" fill="none">
      <Circle cx="27" cy="27" r="2.8" fill={colors.gold} />
      <Line x1="27" y1="27" x2="8" y2="8" stroke={colors.gold} strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="27" y1="27" x2="46" y2="8" stroke={colors.gold} strokeWidth="2.4" strokeLinecap="round" />
      <Path d="M27 27 L19 47" stroke={colors.gold} strokeWidth="2.4" strokeLinecap="round" />
      <Circle cx="14.5" cy="47.5" r="5.5" stroke={colors.gold} strokeWidth="2" fill="none" />
      <Path d="M27 27 L35 47" stroke={colors.gold} strokeWidth="2.4" strokeLinecap="round" />
      <Circle cx="39.5" cy="47.5" r="5.5" stroke={colors.gold} strokeWidth="2" fill="none" />
    </Svg>
  );
}

export default function LoginScreen({ navigation }) {
  const { loginCliente } = useAuth();
  const [cpf, setCpf]       = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const raw = cpf.replace(/\D/g, '');
    setError('');

    if (raw.length !== 11) {
      setError('Digite um CPF completo com 11 dígitos.'); return;
    }
    if (!validarCPF(raw)) {
      setError('CPF inválido. Verifique os números.'); return;
    }

    setLoading(true);
    try {
      await loginCliente(raw);
      // navegação controlada pelo navigator root
    } catch (e) {
      setError(e.message || 'CPF não cadastrado. Fale com a barbearia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={s.logoWrap}>
          <ScissorIcon />
          <Text style={s.brand}>Barbearia</Text>
          <Text style={s.tagline}>SISTEMA DE PONTOS</Text>
        </View>

        {/* Card de login */}
        <View style={s.card}>
          <Text style={s.lbl}>SEU CPF</Text>
          <TextInput
            style={[s.inp, error && s.inpError]}
            value={cpf}
            onChangeText={(v) => { setCpf(maskCPF(v)); setError(''); }}
            placeholder="000.000.000-00"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          <Button
            title="Entrar"
            variant="gold"
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: 4 }}
          />

          {/* Divisor */}
          <View style={s.divider}>
            <View style={s.divLine} />
            <Text style={s.divText}>✂</Text>
            <View style={s.divLine} />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('AdminLogin')}>
            <Text style={s.adminLink}>
              Admin? <Text style={{ color: colors.gold }}>Acessar painel →</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>PREMIAMOS CADA CORTE</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xl },
  brand:  { fontSize: 32, fontWeight: '900', color: colors.cream, marginTop: 12, letterSpacing: 0.5 },
  tagline:{ fontSize: 11, color: colors.muted, letterSpacing: 2, marginTop: 4 },
  card:   {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, padding: spacing.xl,
  },
  lbl:    { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 1.5, marginBottom: 6 },
  inp:    {
    backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border2, color: colors.cream, fontSize: 16,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12,
  },
  inpError: { borderColor: colors.red },
  errorText: { color: colors.redText, fontSize: 13, marginBottom: 10 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: colors.border },
  divText: { color: colors.gold, marginHorizontal: 10, opacity: 0.6 },
  adminLink: { textAlign: 'center', fontSize: 13, color: colors.muted },
  footer: { textAlign: 'center', fontSize: 10, color: colors.muted, letterSpacing: 2, marginTop: 24 },
});
