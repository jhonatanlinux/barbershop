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
  atualizarCliente,
  removerCliente,
  getAdmins,
  salvarAdmin,
  desativarAdmin,
  registrarPagamento,
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
  "Solicitações",
  "Agenda",
  "Clientes",
  "Mensalistas",
  "+ Novo",
  "Config",
];
export default function AdminHomeScreen({ navigation }) {
  const { logout, user } = useAuth();
  const config = useConfig();
  const [tab, setTab] = useState(0);
  const [pendentes, setPendentes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [mensalistas, setMensalistas] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    try {
      const requests = [
        getResgatesPendentes(),
        getResgatesHistorico(),
        getClientes(),
        getMensalistas(),
        getAdmins(),
      ];
      const [pend, hist, cli, mens, adm = []] = await Promise.all(requests);
      setPendentes(pend);
      setHistorico(hist);
      setClientes(cli);
      setMensalistas(mens);
      setAdmins(adm);
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
    CustomAlert.alert("Autorizar resgate", "Confirmar autorização?", [
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
    CustomAlert.alert("Recusar", "Os pontos serão devolvidos ao cliente.", [
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
      CustomAlert.alert("Lançado!", "Pontos adicionados.");
      load();
    } catch (e) {
      CustomAlert.alert("Erro", e.message);
    }
  };
  const onToggleMensalista = (cliente) => {
    const ativar = cliente.tipo !== "mensalista";
    const titulo = ativar ? "Ativar mensalista" : "Remover mensalista";
    const mensagem = ativar
      ? `Marcar ${cliente.nome} como mensalista a partir de hoje?`
      : `Desmarcar ${cliente.nome} como mensalista?`;
    CustomAlert.alert(titulo, mensagem, [
      { text: "Cancelar", style: "cancel" },
      {
        text: ativar ? "Ativar" : "Desmarcar",
        style: ativar ? "default" : "destructive",
        onPress: async () => {
          try {
            if (ativar) {
              const hoje = new Date().toISOString().split("T")[0];
              await registrarPagamento(cliente.cpf, {
                data_pagamento: hoje,
                plano_tipo: cliente.plano_tipo || "completo",
                semanas_barba: cliente.semanas_barba || "impar",
              });
            } else {
              await atualizarCliente(cliente.cpf, { tipo: "regular" });
            }
            load();
          } catch (e) {
            CustomAlert.alert("Erro", e.message);
          }
        },
      },
    ]);
  };
  const onRemoverCliente = (cliente) => {
    CustomAlert.alert(
      "Remover cliente",
      `Remover ${cliente.nome}? Esta ação apaga o cliente e seus registros vinculados.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await removerCliente(cliente.cpf);
              load();
            } catch (e) {
              CustomAlert.alert("Erro", e.message);
            }
          },
        },
      ],
    );
  };
  if (loading) return <Loading />;
  const tabLabels = [
    pendentes.length > 0 ? `Solicitações (${pendentes.length})` : "Solicitações",
    "Agenda",
    "Clientes",
    "Mensalistas",
    "+ Novo",
    "Config",
    "Acessos",
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
            onToggleMensalista={onToggleMensalista}
            onRemover={onRemoverCliente}
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
        {tab === 6 && (
          <AdminsTab admins={admins} currentCpf={user?.cpf} onSuccess={load} />
        )}
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
            Nenhuma solicitação pendente.
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
          <SectionTitle style={{ marginTop: S.md }}>Histórico</SectionTitle>
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
                    {s.admin_nome
                      ? `
${s.status === "autorizado" ? "Autorizado" : "Recusado"} por ${s.admin_nome}`
                      : ""}
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
          <SectionTitle style={{ marginTop: S.md }}>Próximos</SectionTitle>
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
const normalizeSearch = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function ClientesTab({
  clientes,
  onLancar,
  onVer,
  onToggleMensalista,
  onRemover,
}) {
  const [busca, setBusca] = useState("");
  const termo = normalizeSearch(busca);
  const numeros = busca.replace(/\D/g, "");
  const lista = termo || numeros
    ? clientes.filter(
        (c) => {
          const nome = normalizeSearch(c.nome);
          const cpf = String(c.cpf || "").replace(/\D/g, "");
          const telefone = String(c.telefone || "").replace(/\D/g, "");
          return (
            nome.includes(termo) ||
            (numeros.length > 0 && cpf.includes(numeros)) ||
            (numeros.length > 0 && telefone.includes(numeros))
          );
        },
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
      {busca.trim() && (
        <Text style={clienteRow.resultInfo}>
          {lista.length} resultado(s) encontrado(s)
        </Text>
      )}
      {busca.trim() && lista.length === 0 && (
        <Empty title="Nenhum cliente encontrado" />
      )}
      {lista.length > 0 && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {lista.map((c, i) => (
            <View
              key={c.cpf}
              style={[clienteRow.item, i < lista.length - 1 && clienteRow.sep]}
            >
            <View style={clienteRow.top}>
              <Avatar nome={c.nome} tipo={c.tipo} size={38} />
              <View style={clienteRow.info}>
                <Text style={clienteRow.nome} numberOfLines={1}>
                  {c.nome || "Cliente sem nome"}
                </Text>
                <Text style={clienteRow.cpf}>{fmtCPF(c.cpf)}</Text>
              </View>
              <Text style={clienteRow.pontos}>{c.pontos}</Text>
            </View>
            <View style={clienteRow.actions}>
            <Button
              title={c.tipo === "mensalista" ? "+3" : "+10"}
              variant="gold"
              small
              onPress={() => onLancar(c.cpf)}
              style={clienteRow.actionBtn}
            />
            <TouchableOpacity
              onPress={() => onToggleMensalista(c)}
              style={[cliCheck.base, c.tipo === "mensalista" && cliCheck.on]}
            >
              <Text
                style={[
                  cliCheck.text,
                  c.tipo === "mensalista" && cliCheck.textOn,
                ]}
              >
                {c.tipo === "mensalista" ? "Mensalista" : "Regular"}
              </Text>
            </TouchableOpacity>
            <Button
              title="Ver"
              small
              onPress={() => onVer(c.cpf)}
              style={clienteRow.actionBtn}
            />
            <Button
              title="Remover"
              variant="red"
              small
              onPress={() => onRemover(c)}
              style={clienteRow.removeBtn}
            />
            </View>
          </View>
          ))}
        </Card>
      )}
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
          +{config.pontos_mensalista} pts/sessão - {config.dias_plano} dias
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
        {ok === null ? val : ok ? "OK" : "--"}
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
  const [tornarAdmin, setTornarAdmin] = useState(false);
  const [senhaAdmin, setSenhaAdmin] = useState("");
  const [loading, setLoading] = useState(false);
  const cadastrar = async () => {
    const raw = cpf.replace(/\D/g, "");
    if (raw.length !== 11) {
      CustomAlert.alert("Erro", "CPF inválido");
      return;
    }
    if (!tel) {
      CustomAlert.alert("Erro", "Telefone obrigatório");
      return;
    }
    if (tornarAdmin && !senhaAdmin.trim()) {
      CustomAlert.alert("Erro", "Informe a senha do acesso admin");
      return;
    }
    setLoading(true);
    try {
      await criarCliente({
        cpf: raw,
        nome: nome || "Sem nome",
        telefone: tel,
        tipo,
        tornar_admin: tornarAdmin,
        admin_senha: tornarAdmin ? senhaAdmin.trim() : null,
      });
      CustomAlert.alert(
        "Cadastrado!",
        tornarAdmin
          ? `${nome || "Cliente"} adicionado com acesso admin.`
          : `${nome || "Cliente"} adicionado com sucesso.`,
      );
      setCpf("");
      setNome("");
      setTel("");
      setTipo("regular");
      setTornarAdmin(false);
      setSenhaAdmin("");
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
      <TouchableOpacity
        style={adminCheck.row}
        onPress={() => setTornarAdmin((value) => !value)}
        activeOpacity={0.8}
      >
        <View style={[adminCheck.box, tornarAdmin && adminCheck.boxOn]}>
          {tornarAdmin && <Text style={adminCheck.check}>✓</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={adminCheck.title}>Liberar acesso admin</Text>
          <Text style={adminCheck.sub}>
            Este CPF tambem podera entrar no painel administrativo.
          </Text>
        </View>
      </TouchableOpacity>
      {tornarAdmin && (
        <>
          <Text style={lbl_s.lbl}>Senha do admin *</Text>
          <TextInput
            style={[lbl_s.inp, { marginBottom: S.lg }]}
            value={senhaAdmin}
            onChangeText={setSenhaAdmin}
            placeholder="Senha de acesso ao painel"
            placeholderTextColor={C.muted}
            secureTextEntry
          />
        </>
      )}
      <Button
        title="Cadastrar"
        variant="gold"
        onPress={cadastrar}
        loading={loading}
      />
    </Card>
  );
}
// -- AdminsTab ---------------------------------------------
function AdminsTab({ admins, currentCpf, onSuccess }) {
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const lista = admins || [];

  const salvar = async () => {
    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      CustomAlert.alert("CPF invalido", "Informe um CPF com 11 digitos.");
      return;
    }
    if (!senha.trim()) {
      CustomAlert.alert("Senha obrigatoria", "Informe uma senha para este acesso.");
      return;
    }
    setLoading(true);
    try {
      await salvarAdmin({ cpf: cleanCpf, senha: senha.trim(), role: "admin" });
      setCpf("");
      setSenha("");
      CustomAlert.alert("Acesso salvo", "O CPF ja pode entrar no painel admin.");
      onSuccess();
    } catch (e) {
      CustomAlert.alert("Erro", e.message);
    } finally {
      setLoading(false);
    }
  };

  const remover = (admin) => {
    CustomAlert.alert(
      "Remover acesso",
      `Remover acesso admin de ${admin.nome || fmtCPF(admin.cpf)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await desativarAdmin(admin.cpf);
              onSuccess();
            } catch (e) {
              CustomAlert.alert("Erro", e.message);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ gap: S.md }}>
      <Card gold>
        <Text style={[T.h3, { marginBottom: S.xs }]}>Acessos admin</Text>
        <Text style={{ color: C.cream2, fontSize: 12, lineHeight: 18 }}>
          Cadastre primeiro o barbeiro como cliente. Depois informe o CPF aqui
          para liberar o acesso ao painel administrativo.
        </Text>
      </Card>

      <Card>
        <Text style={lbl_s.lbl}>CPF do barbeiro</Text>
        <TextInput
          style={lbl_s.inp}
          value={cpf}
          onChangeText={(v) => setCpf(maskCPF(v))}
          placeholder="000.000.000-00"
          placeholderTextColor={C.muted}
          keyboardType="numeric"
          maxLength={14}
        />
        <Text style={lbl_s.lbl}>Senha do acesso</Text>
        <TextInput
          style={lbl_s.inp}
          value={senha}
          onChangeText={setSenha}
          placeholder="Senha do painel"
          placeholderTextColor={C.muted}
          secureTextEntry
        />
        <Button
          title="Salvar acesso"
          variant="gold"
          onPress={salvar}
          loading={loading}
        />
      </Card>

      <SectionTitle>Admins cadastrados</SectionTitle>
      {!lista.length && <Empty title="Nenhum admin cadastrado" />}
      {lista.map((admin) => {
        const isCurrentUser = admin.cpf === currentCpf;
        return (
          <Card key={admin.cpf}>
            <View style={adminRow.top}>
              <Avatar nome={admin.nome || admin.cpf} tipo="admin" size={38} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={adminRow.nome} numberOfLines={1}>
                  {admin.nome || "Cliente sem nome"}
                </Text>
                <Text style={adminRow.cpf}>{fmtCPF(admin.cpf)}</Text>
              </View>
              <Badge label="Admin" variant="gold" />
            </View>
            <View style={adminRow.actions}>
              <Badge
                label={
                  isCurrentUser ? "Seu acesso" : admin.ativo ? "Ativo" : "Inativo"
                }
                variant={admin.ativo ? "green" : "red"}
              />
              {admin.ativo && !isCurrentUser && (
                <Button
                  title="Desativar"
                  variant="red"
                  small
                  onPress={() => remover(admin)}
                />
              )}
            </View>
          </Card>
        );
      })}
    </View>
  );
}
// -- ConfigTab ---------------------------------------------
function ConfigTab({ config }) {
  const { setConfig } = useAuth();
  const items = [
    { k: "modulo_mensalista", lbl: "Plano Mensalista", tipo: "boolean" },
    { k: "modulo_catalogo", lbl: "Catálogo de Resgates", tipo: "boolean" },
    { k: "validacao_cpf", lbl: "Validação CPF", tipo: "boolean" },
    { k: "limite_solicitacoes", lbl: "Limite de pendentes", tipo: "integer" },
    { k: "pontos_por_corte", lbl: "Pts por corte (regular)", tipo: "integer" },
    {
      k: "pontos_mensalista",
      lbl: "Pts por sessão (mensalista)",
      tipo: "integer",
    },
    { k: "preco_mensalista", lbl: "Preço Completo (R$)", tipo: "integer" },
    {
      k: "preco_mensalista_sem_barba",
      lbl: "Preço Sem Barba (R$)",
      tipo: "integer",
    },
    {
      k: "preco_mensalista_so_barba",
      lbl: "Preço Só Barba (R$)",
      tipo: "integer",
    },
    { k: "dias_plano", lbl: "Duração do plano (dias)", tipo: "integer" },
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
const clienteRow = StyleSheet.create({
  item: {
    padding: S.md,
    gap: S.sm,
  },
  sep: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nome: {
    fontSize: 14,
    fontWeight: "700",
    color: C.cream,
  },
  cpf: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  pontos: {
    minWidth: 56,
    textAlign: "right",
    fontSize: 22,
    fontWeight: "900",
    color: C.gold,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: S.sm,
    paddingLeft: 46,
  },
  actionBtn: {
    minWidth: 68,
  },
  removeBtn: {
    minWidth: 92,
  },
  resultInfo: {
    color: C.muted,
    fontSize: 11,
    marginBottom: S.sm,
    marginLeft: 2,
  },
});
const cliCheck = StyleSheet.create({
  base: {
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.border2,
    backgroundColor: C.surface2,
  },
  on: { borderColor: C.purpleText, backgroundColor: C.purpleBg },
  text: { color: C.muted, fontSize: 11, fontWeight: "700" },
  textOn: { color: C.purpleText },
});
const adminCheck = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
    borderWidth: 1,
    borderColor: C.border2,
    backgroundColor: C.surface2,
    borderRadius: R.md,
    padding: S.md,
    marginBottom: S.md,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.border2,
    alignItems: "center",
    justifyContent: "center",
  },
  boxOn: {
    backgroundColor: C.gold,
    borderColor: C.gold,
  },
  check: {
    color: "#1a0800",
    fontWeight: "900",
    fontSize: 15,
  },
  title: {
    color: C.cream,
    fontSize: 13,
    fontWeight: "700",
  },
  sub: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },
});
const adminRow = StyleSheet.create({
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.sm,
  },
  nome: {
    fontSize: 14,
    fontWeight: "700",
    color: C.cream,
  },
  cpf: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: S.md,
    gap: S.sm,
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
