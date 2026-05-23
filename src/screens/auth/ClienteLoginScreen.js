import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, S, R } from "../../theme";
import { Button, Input } from "../../components";
import { useAuth } from "../../context/AuthContext";
import { maskCPF, validarCPF } from "../../utils";
const logoSource = require("../../../assets/logo.png");
export default function ClienteLoginScreen({ navigation }) {
  const { loginCliente } = useAuth();
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    const raw = cpf.replace(/\D/g, "");
    setError("");
    if (raw.length !== 11) {
      setError("Digite um CPF com 11 dígitos.");
      return;
    }
    if (!validarCPF(raw)) {
      setError("CPF inválido. Verifique os números.");
      return;
    }
    setLoading(true);
    try {
      await loginCliente(raw);
    } catch (e) {
      setError(e.message || "CPF não cadastrado. Fale com a barbearia.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={s.logoArea}>
            <Image source={logoSource} style={s.logoImg} resizeMode="contain" />
          </View>
          {/* Tagline entre logo e card */}
          <Text style={s.tagline}>PREMIAMOS CADA CORTE</Text>
          {/* Card de login */}
          <View style={s.card}>
            {error ? (
              <View style={s.errBox}>
                <Text style={s.errTxt}>{error}</Text>
              </View>
            ) : null}
            <Input
              label="Seu CPF"
              value={cpf}
              onChangeText={(v) => {
                setCpf(maskCPF(v));
                setError("");
              }}
              placeholder="000.000.000-00"
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <Button
              title="Entrar"
              variant="gold"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: 4 }}
            />
            <View style={s.divider}>
              <View style={s.divLine} />
              <Text style={s.divTxt}>?</Text>
              <View style={s.divLine} />
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("AdminLogin")}>
              <Text style={s.adminLink}>
                Admin? <Text style={{ color: C.gold }}>Acessar painel</Text>
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
  logoArea: { alignItems: "center", marginBottom: S.sm },
  logoImg: { width: "100%", height: 130 },
  tagline: {
    textAlign: "center",
    fontSize: 11,
    color: C.gold,
    letterSpacing: 3,
    opacity: 0.75,
    marginBottom: S.xl,
    marginTop: S.sm,
  },
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
  divider: { flexDirection: "row", alignItems: "center", marginVertical: S.lg },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divTxt: { color: C.gold, marginHorizontal: S.md, opacity: 0.5 },
  adminLink: { textAlign: "center", fontSize: 13, color: C.muted },
});
