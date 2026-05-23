import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, S, R } from "../../theme";
import { Button, Input } from "../../components";
import { useAuth } from "../../context/AuthContext";
export default function AdminLoginScreen({ navigation }) {
  const { loginAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    setError("");
    if (!email || !senha) {
      setError("Preencha usuário e senha.");
      return;
    }
    setLoading(true);
    try {
      await loginAdmin(email, senha);
    } catch (e) {
      setError(e.message || "Credenciais inválidas.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.logoArea}>
            <Text style={s.logoSymbol}>🔐</Text>
            <Text style={s.brand}>PAINEL ADMIN</Text>
            <Text style={s.sub}>CORTE FINO</Text>
          </View>
          <View style={s.card}>
            {error ? (
              <View style={s.errBox}>
                <Text style={s.errTxt}>{error}</Text>
              </View>
            ) : null}
            <Input
              label="Usuário"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError("");
              }}
              placeholder="admin"
              autoCapitalize="none"
              returnKeyType="next"
            />
            <Input
              label="Senha"
              value={senha}
              onChangeText={(v) => {
                setSenha(v);
                setError("");
              }}
              placeholder="••••••••"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <Button
              title="Entrar no painel"
              variant="gold"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: 4 }}
            />
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginTop: S.lg, alignItems: "center" }}
            >
              <Text style={{ fontSize: 13, color: C.muted }}>
                ← Área do cliente
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: "center", padding: S.xl },
  logoArea: { alignItems: "center", marginBottom: S.xl },
  logoSymbol: { fontSize: 36, marginBottom: S.sm },
  brand: { fontSize: 24, fontWeight: "900", color: C.cream, letterSpacing: 2 },
  sub: { fontSize: 11, color: C.muted, letterSpacing: 2.5, marginTop: 4 },
  card: {
    backgroundColor: C.surface,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.xl,
  },
  errBox: {
    backgroundColor: C.redBg,
    borderWidth: 1,
    borderColor: "rgba(196,64,64,.35)",
    borderRadius: R.md,
    padding: S.md,
    marginBottom: S.md,
  },
  errTxt: { color: C.redText, fontSize: 13 },
});
