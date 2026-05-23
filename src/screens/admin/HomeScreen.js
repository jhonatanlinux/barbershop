import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, S, R, T } from "../../theme";
import {
  Card,
  Button,
  Badge,
  PlanoBadge,
  CatBadge,
  StatusBadge,
  Avatar,
  TabBar,
  Loading,
  Empty,
  TopBar,
  SectionTitle,
  Sep,
} from "../../components";
import { useAuth, useConfig } from "../../context/AuthContext";
import {
  getClientes,
  getResgatesPendentes,
  getResgatesHistorico,
  getMensalistas,
  lancarCorte,
  autorizarResgate,
  recusarResgate,
  criarCliente,
  setConfig as apiSetConfig,
} from "../../api";
import {
  fmtCPF,
  fmtData,
  iniciais,
  maskCPF,
  validarCPF,
  PLANO_INFO,
  planoAtivo,
  podeCorte,
  podeBarba,
  semanaDoPlano,
} from "../../utils";
import { CustomAlert } from "../../components/CustomAlert";
const TABS = [
  "Solicitaes",
  "Agenda",
  "Clientes",
  "Mensalistas",
  "+ Novo",
  "Config",
];
export default function AdminHomeScreen({ navigation }) {
  const { logout } = useAuth();
  const config = useConfig();
  const [tab, setTab] = useState(0);
  const [pendentes, setPendentes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [mensalistas, setMensalistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    try {
      const [pend, hist, cli, mens] = await Promise.all([
        getResgatesPendentes(),
        getResgatesHistorico(),
        getClientes(),
        getMensalistas(),
      ]);
      setPendentes(pend);
      setHistorico(hist);
      setClientes(cli);
      setMensalistas(mens);
    } catch (e) {
      CustomAlert.alert("Erro", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const onRefresh = () => {
    setRefreshing(true);
    load();
  };
  const onAutorizar = (id) => {
    CustomAlert.alert("Autorizar resgate", "Confirmar autorizao?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Autorizar",
        onPress: async () => {
          try {
            await autorizarResgate(id);
            load();
          } catch (e) {
            CustomAlert.alert("Erro", e.message);
          }
        },
      },
    ]);
  };
  const onRecusar = (id) => {
    CustomAlert.alert("Recusar", "Os pontos sero devolvidos ao cliente.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Recusar",
        style: "destructive",
        onPress: async () => {
          try {
            await recusarResgate(id);
            load();
          } catch (e) {
            CustomAlert.alert("Erro", e.message);
          }
        },
      },
    ]);
  };
  const onLancar = async (cpf, tipo = "corte") => {
    try {
      await lancarCorte(cpf, tipo);
      CustomAlert.alert("? Lanado!", "Pontos adicionados.");
      load();
    } catch (e) {
      CustomAlert.alert("Erro", e.message);
    }
  };
  if (loading) return <Loading />;
  const tabLabels = [
    pendentes.length > 0 ? `Solicitaes (${pendentes.length})` : "Solicitaes",
    "Agenda",
    "Clientes",
    "Mensalistas",
    "+ Novo",
    "Config",
  ];
  const hoje = new Date().toISOString().split("T")[0];
  const agendaHoje = historico.filter(
    (s) => s.status === "autorizado" && s.data_agenda === hoje,
  );
  const proximos = historico
    .filter((s) => s.status === "autorizado" && s.data_agenda > hoje)
    .sort((a, b) => a.data_agenda.localeCompare(b.data_agenda))
    .slice(0, 10);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <TopBar
        title="Corte Fino - Admin"
        right={
          <TouchableOpacity onPress={logout}>
            <Text style={{ color: C.muted, fontSize: 13 }}>Sair</Text>
          </TouchableOpacity>
        }
      />
      {/* Stats */}
      <View
        style={{
          flexDirection: "row",
          padding: S.md,
          gap: S.sm,
          backgroundColor: C.surface,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <StatBox
          val={pendentes.length}
          lbl="Pendentes"
          accent={pendentes.length > 0 ? C.amberText : null}
        />
        <StatBox
          val={agendaHoje.length}
          lbl="Hoje"
          accent={agendaHoje.length > 0 ? C.greenText : null}
        />
        <StatBox val={clientes.length} lbl="Clientes" />
        <StatBox
          val={mensalistas.filter((m) => planoAtivo(m)).length}
          lbl="Mensalistas"
          accent={C.purpleText}
        />
      </View>
      {/* Tabs */}
      <View
        style={{
          backgroundColor: C.surface,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row" }}>
            {tabLabels.map((lbl, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setTab(i)}
                style={[ts.tab, tab === i && ts.tabActive]}
              >
                <Text
                  style={[ts.txt, tab === i && ts.txtActive]}
                  numberOfLines={1}
                >
                  {lbl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: S.lg }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.gold}
          />
        }
      >
        {tab === 0 && (
          <SolicitsTab
            pendentes={pendentes}
            historico={historico}
            onAutorizar={onAutorizar}
            onRecusar={onRecusar}
          />
        )}
        {tab === 1 && <AgendaTab hoje={agendaHoje} proximos={proximos} />}
        {tab === 2 && (
          <ClientesTab
            clientes={clientes}
            onLancar={onLancar}
            onVer={(cpf) => navigation.navigate("ClienteDetalhe", { cpf })}
          />
        )}
        {tab === 3 && (
          <MensalistasTab
            mensalistas={mensalistas}
            onLancar={onLancar}
            onVer={(cpf) => navigation.navigate("ClienteDetalhe", { cpf })}
            config={config}
          />
        )}
        {tab === 4 && <CadastrarTab onSuccess={load} />}
        {tab === 5 && <ConfigTab config={config} />}
      </ScrollView>
    </SafeAreaView>
  );
}
// -- StatBox -----------------------------------------------
function StatBox({ val, lbl, accent }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.surface2,
        borderRadius: R.md,
        padding: S.sm,
        alignItems: "center",
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      <Text
        style={{ fontSize: 24, fontWeight: "900", color: accent || C.cream }}
      >
        {val}
      </Text>
      <Text style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{lbl}</Text>
    </View>
  );
}
// -- SolicitsTab -------------------------------------------
function SolicitsTab({ pendentes, historico, onAutorizar, onRecusar }) {
  return (
    <View>
      {pendentes.length === 0 && (
        <Card green style={{ marginBottom: S.md }}>
          <Text style={{ color: C.greenText, fontSize: 13 }}>
            Nenhuma solicitao pendente.
          </Text>
        </Card>
      )}
      {pendentes.map((s) => (
        <Card key={s.id} style={{ marginBottom: S.sm, borderColor: C.amberBg }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: S.sm,
            }}
          >
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: S.sm,
                  flexWrap: "wrap",
                }}
              >
                <Text
                  style={{ fontSize: 15, fontWeight: "700", color: C.cream }}
                >
                  {s.item_nome}
                </Text>
                <CatBadge cat={s.item_cat} />
              </View>
              <Text style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                {s.cliente_nome}
                {fmtCPF(s.cpf)}
                {s.pontos_usados} pts - {fmtData(s.created_at)}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: S.sm }}>
            <Button
              title="Autorizar"
              variant="gold"
              onPress={() => onAutorizar(s.id)}
              style={{ flex: 1 }}
            />
            <Button
              title="Recusar"
              variant="red"
              onPress={() => onRecusar(s.id)}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      ))}
      {historico.length > 0 && (
        <>
          <SectionTitle style={{ marginTop: S.md }}>Histrico</SectionTitle>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {historico.slice(0, 20).map((s, i) => (
              <View
                key={s.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: S.md,
                  paddingHorizontal: S.lg,
                  borderBottomWidth: i < historico.length - 1 ? 1 : 0,
                  borderBottomColor: C.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: S.xs,
                      flexWrap: "wrap",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: C.cream,
                      }}
                    >
                      {s.item_nome}
                    </Text>
                    <StatusBadge status={s.status} />
                  </View>
                  <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {s.cliente_nome}
                    {s.pontos_usados} pts
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </>
      )}
    </View>
  );
}
// -- AgendaTab ---------------------------------------------
function AgendaTab({ hoje, proximos }) {
  return (
    <View>
      <SectionTitle>Hoje</SectionTitle>
      {hoje.length === 0 ? (
        <Card style={{ marginBottom: S.md }}>
          <Text style={{ color: C.muted, fontSize: 13 }}>
            Nenhum agendamento para hoje.
          </Text>
        </Card>
      ) : (
        hoje.map((s) => (
          <Card
            key={s.id}
            style={{
              marginBottom: S.sm,
              flexDirection: "row",
              alignItems: "center",
              gap: S.md,
            }}
          >
            <Avatar nome={s.cliente_nome} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.cream }}>
                {s.cliente_nome}
              </Text>
              <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                {s.item_nome}
              </Text>
            </View>
            <CatBadge cat={s.item_cat} />
          </Card>
        ))
      )}
      {proximos.length > 0 && (
        <>
          <SectionTitle style={{ marginTop: S.md }}>Prximos</SectionTitle>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {proximos.map((s, i) => (
              <View
                key={s.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: S.sm,
                  padding: S.md,
                  paddingHorizontal: S.lg,
                  borderBottomWidth: i < proximos.length - 1 ? 1 : 0,
                  borderBottomColor: C.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: C.gold,
                    minWidth: 52,
                  }}
                >
                  {fmtData(s.data_agenda)}
                </Text>
                <Avatar nome={s.cliente_nome} size={32} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 13, fontWeight: "600", color: C.cream }}
                  >
                    {s.cliente_nome}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.muted }}>
                    {s.item_nome}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </>
      )}
    </View>
  );
}
// -- ClientesTab -------------------------------------------
function ClientesTab({ clientes, onLancar, onVer }) {
  const [busca, setBusca] = useState("");
  const lista = busca
    ? clientes.filter(
        (c) =>
          c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
          c.cpf?.includes(busca.replace(/\D/g, "")),
      )
    : clientes;
  return (
    <View>
      <TextInput
        style={inp_s.busca}
        placeholder="Buscar por nome ou CPF..."
        placeholderTextColor={C.muted}
        value={busca}
        onChangeText={setBusca}
      />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {lista.map((c, i) => (
          <View
            key={c.cpf}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: S.sm,
              padding: S.sm,
              paddingHorizontal: S.md,
              borderBottomWidth: i < lista.length - 1 ? 1 : 0,
              borderBottomColor: C.border,
            }}
          >
            <Avatar nome={c.nome} tipo={c.tipo} size={34} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: C.cream }}
                numberOfLines={1}
              >
                {c.nome}
              </Text>
              <Text style={{ fontSize: 11, color: C.muted }}>
                {fmtCPF(c.cpf)}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: C.gold,
                minWidth: 42,
                textAlign: "right",
              }}
            >
              {c.pontos}
            </Text>
            <Button
              title={c.tipo === "mensalista" ? "+3" : "+10"}
              variant="gold"
              small
              onPress={() => onLancar(c.cpf)}
            />
            <Button title="Ver" small onPress={() => onVer(c.cpf)} />
          </View>
        ))}
      </Card>
    </View>
  );
}
// -- MensalistasTab ----------------------------------------
function MensalistasTab({ mensalistas, onLancar, onVer, config }) {
  if (!mensalistas.length) return <Empty title="Nenhum mensalista" />;
  return (
    <View style={{ gap: S.sm }}>
      <Card gold>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: C.gold,
            marginBottom: S.sm,
          }}
        >
          Planos Mensalistas
        </Text>
        <View style={{ flexDirection: "row", gap: S.sm }}>
          {[
            { tipo: "completo", preco: config.preco_mensalista },
            { tipo: "sem_barba", preco: config.preco_mensalista_sem_barba },
            { tipo: "so_barba", preco: config.preco_mensalista_so_barba },
          ].map((p) => (
            <View
              key={p.tipo}
              style={{
                flex: 1,
                alignItems: "center",
                backgroundColor: C.surface2,
                borderRadius: R.md,
                padding: S.sm,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: PLANO_INFO[p.tipo]?.cor || C.gold,
                }}
              >
                {PLANO_INFO[p.tipo]?.label}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: PLANO_INFO[p.tipo]?.cor || C.gold,
                  marginTop: 3,
                }}
              >
                R$ {p.preco}
              </Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 11, color: C.muted, marginTop: S.sm }}>
          +{config.pontos_mensalista} pts/sesso - {config.dias_plano} dias
        </Text>
      </Card>
      {mensalistas.map((c) => {
        const ativo = planoAtivo(c);
        const sem = c.plano_inicio ? semanaDoPlano(c.plano_inicio) : 0;
        const pc = podeCorte(c);
        const pb = podeBarba(c);
        return (
          <Card key={c.cpf}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: S.sm,
              }}
            >
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: S.xs,
                    flexWrap: "wrap",
                  }}
                >
                  <Text
                    style={{ fontSize: 15, fontWeight: "700", color: C.cream }}
                  >
                    {c.nome}
                  </Text>
                  <PlanoBadge tipo={c.plano_tipo} />
                  <Badge
                    label={ativo ? "Ativo" : "Vencido"}
                    variant={ativo ? "green" : "red"}
                  />
                </View>
                <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {fmtCPF(c.cpf)}
                  {c.pontos} pts
                  {c.plano_vencimento
                    ? `
vence ${fmtData(c.plano_vencimento)}`
                    : ""}
                </Text>
              </View>
            </View>
            {ativo && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    gap: S.xs,
                    marginBottom: S.sm,
                  }}
                >
                  {c.plano_tipo !== "so_barba" && (
                    <MensStatusBox ok={pc} label="Corte" />
                  )}
                  {c.plano_tipo !== "sem_barba" && (
                    <MensStatusBox ok={pb} label="Barba" />
                  )}
                  <MensStatusBox ok={null} label="Semana" val={sem} />
                  <MensStatusBox ok={null} label="Pontos" val={c.pontos} gold />
                </View>
                <View style={{ flexDirection: "row", gap: S.sm }}>
                  {c.plano_tipo !== "so_barba" && (
                    <Button
                      title="Corte"
                      variant="gold"
                      small
                      disabled={!pc}
                      onPress={() => onLancar(c.cpf, "corte")}
                      style={{ flex: 1 }}
                    />
                  )}
                  {c.plano_tipo !== "sem_barba" && (
                    <Button
                      title="Barba"
                      variant="green"
                      small
                      disabled={!pb}
                      onPress={() => onLancar(c.cpf, "barba")}
                      style={{ flex: 1 }}
                    />
                  )}
                  <Button title="Ver" small onPress={() => onVer(c.cpf)} />
                </View>
              </>
            )}
            {!ativo && (
              <Text style={{ color: C.amberText, fontSize: 13 }}>
                Plano vencido - registre o pagamento.
              </Text>
            )}
          </Card>
        );
      })}
    </View>
  );
}
function MensStatusBox({ ok, label, val, gold }) {
  return (
    <View style={[msb.base, ok === true && msb.ok]}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color:
            ok === true
              ? C.greenText
              : ok === false
                ? C.muted
                : gold
                  ? C.gold
                  : C.cream2,
        }}
      >
        {ok === null ? val : ok ? "?" : "?"}
      </Text>
      <Text
        style={{ fontSize: 9, color: C.muted, marginTop: 1, fontWeight: "600" }}
      >
        {label}
      </Text>
    </View>
  );
}
const msb = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: C.surface2,
    borderRadius: R.sm,
    padding: 7,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  ok: { borderColor: "rgba(45,143,82,.4)", backgroundColor: C.greenBg },
});
// -- CadastrarTab ------------------------------------------
function CadastrarTab({ onSuccess }) {
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [tipo, setTipo] = useState("regular");
  const [loading, setLoading] = useState(false);
  const cadastrar = async () => {
    const raw = cpf.replace(/\D/g, "");
    if (raw.length !== 11) {
      CustomAlert.alert("Erro", "CPF invlido");
      return;
    }
    if (!tel) {
      CustomAlert.alert("Erro", "Telefone obrigatrio");
      return;
    }
    setLoading(true);
    try {
      await criarCliente({
        cpf: raw,
        nome: nome || "Sem nome",
        telefone: tel,
        tipo,
      });
      CustomAlert.alert(
        "Cadastrado!",
        `${nome || "Cliente"} adicionado com sucesso.`,
      );
      setCpf("");
      setNome("");
      setTel("");
      setTipo("regular");
      onSuccess();
    } catch (e) {
      CustomAlert.alert("Erro", e.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: C.cream,
          marginBottom: S.lg,
        }}
      >
        Novo Cliente
      </Text>
      <View style={{ flexDirection: "row", gap: S.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={lbl_s.lbl}>CPF *</Text>
          <TextInput
            style={lbl_s.inp}
            value={cpf}
            onChangeText={(v) => setCpf(maskCPF(v))}
            placeholder="000.000.000-00"
            placeholderTextColor={C.muted}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={lbl_s.lbl}>Telefone *</Text>
          <TextInput
            style={lbl_s.inp}
            value={tel}
            onChangeText={setTel}
            placeholder="(66) 99999-0000"
            placeholderTextColor={C.muted}
            keyboardType="phone-pad"
          />
        </View>
      </View>
      <Text style={lbl_s.lbl}>Nome</Text>
      <TextInput
        style={[lbl_s.inp, { marginBottom: S.md }]}
        value={nome}
        onChangeText={setNome}
        placeholder="Opcional"
        placeholderTextColor={C.muted}
      />
      <Text style={lbl_s.lbl}>Tipo</Text>
      <View style={{ flexDirection: "row", gap: S.sm, marginBottom: S.lg }}>
        {["regular", "mensalista"].map((t) => (
          <TouchableOpacity
            key={t}
            style={[lbl_s.pill, tipo === t && lbl_s.pillActive]}
            onPress={() => setTipo(t)}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: tipo === t ? C.gold : C.muted,
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Button
        title="Cadastrar"
        variant="gold"
        onPress={cadastrar}
        loading={loading}
      />
    </Card>
  );
}
// -- ConfigTab ---------------------------------------------
function ConfigTab({ config }) {
  const { setConfig } = useAuth();
  const items = [
    { k: "modulo_mensalista", lbl: "Plano Mensalista", tipo: "boolean" },
    { k: "modulo_catalogo", lbl: "Catlogo de Resgates", tipo: "boolean" },
    { k: "validacao_cpf", lbl: "Validao CPF", tipo: "boolean" },
    { k: "limite_solicitacoes", lbl: "Limite de pendentes", tipo: "integer" },
    { k: "pontos_por_corte", lbl: "Pts por corte (regular)", tipo: "integer" },
    {
      k: "pontos_mensalista",
      lbl: "Pts por sesso (mensalista)",
      tipo: "integer",
    },
    { k: "preco_mensalista", lbl: "Preo Completo (R$)", tipo: "integer" },
    {
      k: "preco_mensalista_sem_barba",
      lbl: "Preo Sem Barba (R$)",
      tipo: "integer",
    },
    {
      k: "preco_mensalista_so_barba",
      lbl: "Preo S Barba (R$)",
      tipo: "integer",
    },
    { k: "dias_plano", lbl: "Durao do plano (dias)", tipo: "integer" },
    { k: "nome_barbearia", lbl: "Nome da barbearia", tipo: "string" },
  ];
  const update = async (k, v) => {
    setConfig((prev) => ({ ...prev, [k]: v }));
    try {
      await apiSetConfig(k, String(v));
    } catch (e) {
      CustomAlert.alert("Erro ao salvar", e.message);
    }
  };
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      {items.map((item, i) => (
        <View
          key={item.k}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: S.md,
            paddingHorizontal: S.lg,
            borderBottomWidth: i < items.length - 1 ? 1 : 0,
            borderBottomColor: C.border,
          }}
        >
          <Text
            style={{ fontSize: 13, fontWeight: "500", color: C.cream, flex: 1 }}
          >
            {item.lbl}
          </Text>
          {item.tipo === "boolean" ? (
            <TouchableOpacity
              style={[tog.base, config[item.k] && tog.on]}
              onPress={() => update(item.k, !config[item.k])}
            >
              <View style={[tog.thumb, config[item.k] && tog.thumbOn]} />
            </TouchableOpacity>
          ) : item.tipo === "integer" ? (
            <TextInput
              style={cfg_inp.inp}
              value={String(config[item.k] ?? "")}
              onChangeText={(v) => update(item.k, Number(v) || 0)}
              keyboardType="numeric"
            />
          ) : (
            <TextInput
              style={[cfg_inp.inp, { width: 120 }]}
              value={String(config[item.k] ?? "")}
              onChangeText={(v) => update(item.k, v)}
            />
          )}
        </View>
      ))}
    </Card>
  );
}
const tog = StyleSheet.create({
  base: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.surface3,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  on: { backgroundColor: C.goldDim },
  thumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.muted },
  thumbOn: { backgroundColor: C.gold, alignSelf: "flex-end" },
});
const lbl_s = StyleSheet.create({
  lbl: {
    fontSize: 11,
    fontWeight: "700",
    color: C.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  inp: {
    backgroundColor: C.surface2,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border2,
    color: C.cream,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: S.sm,
  },
  pill: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border2,
    backgroundColor: C.surface2,
  },
  pillActive: { borderColor: C.gold, backgroundColor: C.goldDim },
});
const inp_s = StyleSheet.create({
  busca: {
    backgroundColor: C.surface2,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border2,
    color: C.cream,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: S.sm,
    fontSize: 14,
  },
});
const cfg_inp = StyleSheet.create({
  inp: {
    width: 80,
    backgroundColor: C.surface2,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.border2,
    color: C.cream,
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: "center",
  },
});
const ts = StyleSheet.create({
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: C.gold },
  txt: { fontSize: 12, fontWeight: "500", color: C.muted },
  txtActive: { color: C.gold, fontWeight: "700" },
});
