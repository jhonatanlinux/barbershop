import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { C, S, R, T } from "../../theme";
import {
  Card,
  Badge,
  PlanoBadge,
  StatusBadge,
  Button,
  Avatar,
  Loading,
  SectionTitle,
  Empty,
} from "../../components";
import { getCliente, lancarCorte } from "../../api";
import {
  fmtCPF,
  fmtData,
  iniciais,
  PLANO_INFO,
  planoAtivo,
  podeCorte,
  podeBarba,
  semanaDoPlano,
} from "../../utils";
import { CustomAlert } from "../../components/CustomAlert";
export default function ClienteDetalheScreen({ route }) {
  const { cpf } = route.params;
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      const c = await getCliente(cpf);
      setCliente(c);
    } catch (e) {
      CustomAlert.alert("Erro", e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const onLancar = async (tipo) => {
    try {
      await lancarCorte(cpf, tipo);
      CustomAlert.alert("Lancado!", "Pontos adicionados.");
      load();
    } catch (e) {
      CustomAlert.alert("Erro", e.message);
    }
  };
  if (loading) return <Loading />;
  if (!cliente) return null;
  const ativo = planoAtivo(cliente);
  const isMens = cliente.tipo === "mensalista";
  const pi = PLANO_INFO[cliente.plano_tipo || "completo"];
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: S.lg }}
    >
      <Card style={{ marginBottom: S.md }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: S.md,
            marginBottom: S.lg,
          }}
        >
          <Avatar nome={cliente.nome} tipo={cliente.tipo} size={48} />
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: S.sm,
                flexWrap: "wrap",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: C.cream }}>
                {cliente.nome}
              </Text>
              {isMens && <PlanoBadge tipo={cliente.plano_tipo} />}
            </View>
            <Text style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
              {fmtCPF(cliente.cpf)}
              {cliente.telefone}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: S.sm, marginBottom: S.md }}>
          <View style={ds.box}>
            <Text style={[ds.val, { color: C.gold }]}>{cliente.pontos}</Text>
            <Text style={ds.lbl}>Pontos</Text>
          </View>
          {isMens && cliente.plano_inicio ? (
            <View style={ds.box}>
              <Text style={ds.val}>
                Sem. {semanaDoPlano(cliente.plano_inicio)}
              </Text>
              <Text style={ds.lbl}>Semana do Plano</Text>
            </View>
          ) : (
            <View style={ds.box}>
              <Text style={ds.val}>
                {
                  (cliente.historico || []).filter((h) => h.tipo === "ganho")
                    .length
                }
              </Text>
              <Text style={ds.lbl}>Servios</Text>
            </View>
          )}
        </View>
        {isMens && ativo && (
          <View
            style={{
              backgroundColor: C.amberBg,
              borderRadius: R.md,
              padding: S.sm,
              marginBottom: S.md,
            }}
          >
            <Text style={{ color: C.amberText, fontSize: 12 }}>
              Corte:{" "}
              {podeCorte(cliente) ? "? Disponvel" : "? J realizado esta semana"}
              {"\n"}
              Barba:{" "}
              {podeBarba(cliente)
                ? "? Disponvel"
                : "? No disponvel esta semana"}
            </Text>
          </View>
        )}
        <View style={{ flexDirection: "row", gap: S.sm }}>
          {isMens ? (
            <>
              {cliente.plano_tipo !== "so_barba" && (
                <Button
                  title="Corte +3"
                  variant="gold"
                  disabled={!podeCorte(cliente)}
                  onPress={() => onLancar("corte")}
                  style={{ flex: 1 }}
                />
              )}
              {cliente.plano_tipo !== "sem_barba" && (
                <Button
                  title="Barba +3"
                  variant="green"
                  disabled={!podeBarba(cliente)}
                  onPress={() => onLancar("barba")}
                  style={{ flex: 1 }}
                />
              )}
            </>
          ) : (
            <Button
              title="? Lanar +10 pts"
              variant="gold"
              onPress={() => onLancar("corte")}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </Card>
      <SectionTitle>Histrico de Pontos</SectionTitle>
      {(cliente.historico || []).length === 0 ? (
        <Empty title="Sem histrico" />
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {(cliente.historico || []).slice(0, 30).map((h, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: S.md,
                paddingHorizontal: S.lg,
                borderBottomWidth: i < cliente.historico.length - 1 ? 1 : 0,
                borderBottomColor: C.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 13, fontWeight: "500", color: C.cream }}
                >
                  {h.descricao}
                </Text>
                <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {fmtData(h.created_at)}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: h.tipo === "ganho" ? C.greenText : C.redText,
                }}
              >
                {h.tipo === "ganho" ? "+" : ""}
                {h.pontos}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
const ds = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: C.surface2,
    borderRadius: R.md,
    padding: S.md,
    alignItems: "center",
  },
  val: { fontSize: 22, fontWeight: "900", color: C.cream },
  lbl: { fontSize: 11, color: C.muted, marginTop: 2 },
});
