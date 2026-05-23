import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input } from "../../components";
import { useAuth } from "../../context/AuthContext";
import { C, R, S } from "../../theme";
import { maskCPF } from "../../utils";

export default function AdminLoginScreen({ navigation }) {
  const { loginAdmin } = useAuth();
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const rawCpf = cpf.replace(/\D/g, "");
    setError("");

    if (rawCpf.length !== 11 || !senha) {
      setError("Informe CPF e senha.");
      return;
    }

    setLoading(true);
    try {
      await loginAdmin(rawCpf, senha);
    } catch (e) {
      setError(e.message || "Credenciais invalidas.");
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
            <Text style={s.logoSymbol}>#</Text>
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
              label="CPF autorizado"
              value={cpf}
              onChangeText={(value) => {
                setCpf(maskCPF(value));
                setError("");
              }}
              placeholder="000.000.000-00"
              keyboardType="numeric"
              returnKeyType="next"
            />

            <Input
              label="Senha"
              value={senha}
              onChangeText={(value) => {
                setSenha(value);
                setError("");
              }}
              placeholder="Sua senha"
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
              style={s.backLink}
            >
              <Text style={s.backText}>Voltar para area do cliente</Text>
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
  logoSymbol: { fontSize: 36, marginBottom: S.sm, color: C.gold },
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
  backLink: { marginTop: S.lg, alignItems: "center" },
  backText: { fontSize: 13, color: C.muted },
});
