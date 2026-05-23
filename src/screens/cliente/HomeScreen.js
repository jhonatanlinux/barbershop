import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, S, R } from "../../theme";
import {
  Card,
  Badge,
  PlanoBadge,
  CatBadge,
  StatusBadge,
  Button,
  TabBar,
  Loading,
  Empty,
  TopBar,
} from "../../components";
import { useAuth } from "../../context/AuthContext";
import { getCliente, getCatalogo, solicitarResgate } from "../../api";
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
const TABS = ["Catálogo", "Solicitações", "Histórico"];
const CAT_ORDER = ["corte", "barba", "bebida", "produto"];
const CAT_LABEL = {
  corte: "Cortes",
  barba: "Barba",
  bebida: "Bebidas",
  produto: "Produtos",
};
export default function ClienteHomeScreen() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState(0);
  const [cliente, setCliente] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    try {
      const [c, cat] = await Promise.all([getCliente(user.cpf), getCatalogo()]);
      setCliente(c);
      setCatalogo(cat);
    } catch (e) {
      CustomAlert.alert("Erro", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.cpf]);
  useEffect(() => {
    load();
  }, [load]);
  const onSolicitar = async (itemId, itemNome) => {
    CustomAlert.alert("Confirmar", `Solicitar "${itemNome}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Solicitar",
        onPress: async () => {
          try {
            await solicitarResgate(itemId);
            CustomAlert.alert("Solicitado!", "Aguarde a barbearia autorizar.");
            load();
          } catch (e) {
            CustomAlert.alert("Erro", e.message);
          }
        },
      },
    ]);
  };
  if (loading) return <Loading />;
  if (!cliente) return null;
  const ativo = planoAtivo(cliente);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <TopBar
        title={`Corte Fino`}
        sub={`${cliente.nome}
${fmtCPF(cliente.cpf)}`}
        right={
          <TouchableOpacity onPress={logout}>
            <Text style={{ color: C.muted, fontSize: 13 }}>Sair</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={C.gold}
          />
        }
        contentContainerStyle={{ padding: S.lg }}
      >
        {/* Card de pontos */}
        <Card gold style={{ marginBottom: S.md }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: C.gold,
                  letterSpacing: 1.5,
                }}
              >
                SEUS PONTOS
              </Text>
              <Text
                style={{
                  fontSize: 52,
                  fontWeight: "900",
                  color: C.gold,
                  lineHeight: 60,
                }}
              >
                {cliente.pontos}
              </Text>
              <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                Use seus pontos para solicitar prêmios no catálogo.
              </Text>
            </View>
            {cliente.tipo === "mensalista" && (
              <PlanoBadge tipo={cliente.plano_tipo} />
            )}
          </View>
        </Card>
        {/* Card plano mensalista */}
        {cliente.tipo === "mensalista" && cliente.plano_inicio && (
          <Card
            style={{
              marginBottom: S.md,
              borderColor:
                (PLANO_INFO[cliente.plano_tipo]?.cor || C.gold) + "40",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: S.sm,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: PLANO_INFO[cliente.plano_tipo]?.cor || C.gold,
                }}
              >
                Plano {PLANO_INFO[cliente.plano_tipo]?.label}
              </Text>
              <Badge
                label={ativo ? "Ativo" : "Vencido"}
                variant={ativo ? "green" : "red"}
              />
            </View>
            {ativo ? (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    gap: S.sm,
                    marginBottom: S.sm,
                  }}
                >
                  {cliente.plano_tipo !== "so_barba" && (
                    <PlanoStatusItem ok={podeCorte(cliente)} label="Corte" />
                  )}
                  {cliente.plano_tipo !== "sem_barba" && (
                    <PlanoStatusItem ok={podeBarba(cliente)} label="Barba" />
                  )}
                  <PlanoStatusItem
                    ok={null}
                    label={`Sem. ${semanaDoPlano(cliente.plano_inicio)}`}
                  />
                </View>
                <Text style={{ fontSize: 11, color: C.muted }}>
                  Vence {fmtData(cliente.plano_vencimento)}
                </Text>
              </>
            ) : (
              <Text style={{ color: C.amberText, fontSize: 13 }}>
                Plano vencido - procure a barbearia para renovar.
              </Text>
            )}
          </Card>
        )}
        {/* Tabs */}
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
        {tab === 0 && (
          <CatalogoTab
            catalogo={catalogo}
            pontos={cliente.pontos}
            onSolicitar={onSolicitar}
          />
        )}
        {tab === 1 && <SolicitsTab solicits={cliente.resgates || []} />}
        {tab === 2 && <HistoricoTab historico={cliente.historico || []} />}
      </ScrollView>
    </SafeAreaView>
  );
}
// -- PlanoStatusItem ---------------------------------------
function PlanoStatusItem({ ok, label }) {
  return (
    <View style={[psi.base, ok === true && psi.ok]}>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: ok === true ? C.greenText : ok === false ? C.muted : C.gold,
        }}
      >
        {ok === null ? label.split(" ")[1] : ok ? "OK" : "--"}
      </Text>
      <Text
        style={{
          fontSize: 10,
          color: C.muted,
          marginTop: 2,
          fontWeight: "600",
        }}
      >
        {ok === null ? label.split(" ")[0] : label}
      </Text>
    </View>
  );
}
const psi = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: C.surface2,
    borderRadius: R.md,
    padding: S.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  ok: { borderColor: "rgba(45,143,82,.4)", backgroundColor: C.greenBg },
});
// -- CatalogoTab -------------------------------------------
function CatalogoTab({ catalogo, pontos, onSolicitar }) {
  return (
    <View style={{ paddingTop: S.md }}>
      <Card style={{ marginBottom: S.md }} amber>
        <Text style={{ color: C.amberText, fontSize: 12 }}>
          Ao solicitar, seus pontos ficam reservados até a barbearia autorizar.
        </Text>
      </Card>
      {CAT_ORDER.map((cat) => {
        const items = catalogo.filter((i) => i.categoria === cat && i.ativo);
        if (!items.length) return null;
        return (
          <View key={cat}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: C.muted,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBottom: S.sm,
                marginTop: S.sm,
              }}
            >
              {CAT_LABEL[cat]}
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: S.sm,
                marginBottom: S.md,
              }}
            >
              {items.map((item) => {
                const ok = pontos >= item.custo_pontos;
                return (
                  <View
                    key={item.id}
                    style={[ct.card, !ok && { opacity: 0.55 }]}
                  >
                    <View style={ct.thumb}>
                      <Text style={ct.thumbPts}>{item.custo_pontos} pts</Text>
                    </View>
                    <View style={{ padding: S.sm, flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: C.cream,
                          marginBottom: 2,
                        }}
                      >
                        {item.nome}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: C.muted,
                          lineHeight: 15,
                          marginBottom: S.sm,
                        }}
                        numberOfLines={2}
                      >
                        {item.descricao}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: ok ? C.gold : C.muted,
                          }}
                        >
                          {ok
                            ? `${item.custo_pontos} pts`
                            : `Faltam ${item.custo_pontos - pontos}`}
                        </Text>
                        <Button
                          title="Solicitar"
                          variant={ok ? "gold" : "default"}
                          disabled={!ok}
                          small
                          onPress={() => onSolicitar(item.id, item.nome)}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}
const ct = StyleSheet.create({
  card: {
    width: "48.5%",
    backgroundColor: C.surface,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  thumb: {
    height: 80,
    backgroundColor: C.surface2,
    justifyContent: "flex-end",
    padding: S.sm,
  },
  thumbPts: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(0,0,0,.6)",
    color: C.gold,
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: C.goldBorder,
  },
});
// -- SolicitsTab -------------------------------------------
function SolicitsTab({ solicits }) {
  if (!solicits.length)
    return (
      <Empty
        title="Nenhuma solicitação"
        sub="Solicite itens do catálogo com seus pontos"
      />
    );
  return (
    <View style={{ paddingTop: S.md, gap: S.sm }}>
      {solicits.map((s) => (
        <Card key={s.id}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ flex: 1, marginRight: S.sm }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.cream }}>
                {s.item_nome || s.nome}
              </Text>
              <Text style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                {s.pontos_usados || s.pts} pts -{" "}
                {fmtData(s.created_at || s.data_solic)}
              </Text>
            </View>
            <StatusBadge status={s.status} />
          </View>
          {s.status === "autorizado" && s.data_agenda && (
            <View
              style={{
                marginTop: S.sm,
                backgroundColor: C.greenBg,
                borderRadius: R.sm,
                padding: S.sm,
              }}
            >
              <Text
                style={{ color: C.greenText, fontSize: 13, fontWeight: "600" }}
              >
                Agendado: {fmtData(s.data_agenda)}
              </Text>
            </View>
          )}
        </Card>
      ))}
    </View>
  );
}
// -- HistoricoTab ------------------------------------------
function HistoricoTab({ historico }) {
  if (!historico.length)
    return (
      <Empty title="Sem histórico" sub="Seu histórico de pontos aparecerá aqui" />
    );
  return (
    <Card style={{ padding: 0, overflow: "hidden", marginTop: S.md }}>
      {historico.slice(0, 50).map((h, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: S.md,
            paddingHorizontal: S.lg,
            borderBottomWidth: i < historico.length - 1 ? 1 : 0,
            borderBottomColor: C.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "500", color: C.cream }}>
              {h.descricao || h.desc}
            </Text>
            <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              {fmtData(h.created_at || h.data)}
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
  );
}
