import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, TextInput, Alert, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme';
import { Card, Badge, StatusBadge, SectionTitle, Button, EmptyState, LoadingScreen } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { clientesAPI, resgatesAPI, mensalistasAPI, cortesAPI } from '../../api';
import { fmtCPF, fmtData, fmtDataCurta, iniciais, PLANO_INFO, planoAtivo, podeCorte, podeBarba, semanaDoPlano } from '../../utils';

const TABS = ['Solicitações', 'Clientes', 'Mensalistas', '+ Novo'];

export default function AdminHomeScreen({ navigation }) {
  const { logout } = useAuth();
  const [tab, setTab]           = useState(0);
  const [solicits, setSolicits] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [mensalistas, setMensalistas] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sRes, cRes, mRes] = await Promise.all([
        resgatesAPI.listarPendentes(),
        clientesAPI.listar(),
        mensalistasAPI.listar(),
      ]);
      setSolicits(sRes.data);
      setClientes(cRes.data);
      setMensalistas(mRes.data);
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const autorizar = async (id) => {
    try {
      await resgatesAPI.autorizar(id);
      load();
      Alert.alert('✓ Autorizado', 'Resgate autorizado com sucesso!');
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  const recusar = async (id) => {
    Alert.alert('Recusar resgate', 'Os pontos serão devolvidos ao cliente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Recusar', style: 'destructive', onPress: async () => {
        try { await resgatesAPI.recusar(id); load(); }
        catch (e) { Alert.alert('Erro', e.message); }
      }},
    ]);
  };

  const lancarCorte = async (cpf) => {
    try {
      await cortesAPI.lancar(cpf);
      load();
      Alert.alert('✓ Corte lançado!', '+10 pts adicionados.');
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  if (loading) return <LoadingScreen />;

  const pend = solicits.filter(s => s.status === 'pendente');
  const mens = mensalistas.filter(m => planoAtivo(m));

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* TopBar */}
      <View style={s.topbar}>
        <View>
          <Text style={s.brand}>✂ Admin</Text>
          <Text style={s.brandSub}>Painel de gestão</Text>
        </View>
        <TouchableOpacity onPress={logout}><Text style={s.sair}>Sair</Text></TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <StatCard value={pend.length} label="Pendentes" accent={pend.length > 0 ? colors.amberText : null} />
        <StatCard value={clientes.length} label="Clientes" />
        <StatCard value={mens.length} label="Mensalistas" accent={colors.purpleText} />
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={[s.tab, tab === i && s.tabActive]} onPress={() => setTab(i)}>
            <Text style={[s.tabTxt, tab === i && s.tabTxtActive]}>
              {t}{i === 0 && pend.length > 0 ? ` (${pend.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
      >
        {tab === 0 && <SolicitsTab solicits={solicits} onAutorizar={autorizar} onRecusar={recusar} />}
        {tab === 1 && <ClientesTab clientes={clientes} onLancar={lancarCorte} onVer={(cpf) => navigation.navigate('ClienteDetalhe', { cpf })} />}
        {tab === 2 && <MensalistasTab mensalistas={mensalistas} onReload={load} />}
        {tab === 3 && <CadastrarTab onSuccess={load} />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── StatCard ──────────────────────────────────────────────
function StatCard({ value, label, accent }) {
  return (
    <View style={stat_s.card}>
      <Text style={[stat_s.val, accent && { color: accent }]}>{value}</Text>
      <Text style={stat_s.lbl}>{label}</Text>
    </View>
  );
}
const stat_s = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12, marginHorizontal: 4, alignItems: 'center' },
  val:  { fontSize: 28, fontWeight: '900', color: colors.cream, lineHeight: 32 },
  lbl:  { fontSize: 11, color: colors.muted, marginTop: 2 },
});

// ── SolicitsTab ───────────────────────────────────────────
function SolicitsTab({ solicits, onAutorizar, onRecusar }) {
  const pend = solicits.filter(s => s.status === 'pendente');
  const hist = solicits.filter(s => s.status !== 'pendente');

  if (!pend.length && !hist.length)
    return <EmptyState title="Nenhuma solicitação" sub="Tudo em dia!" />;

  return (
    <View>
      {pend.length > 0 && (
        <>
          <SectionTitle>Aguardando autorização</SectionTitle>
          {pend.map(s => (
            <Card key={s.id} style={{ marginBottom: 10, borderColor: colors.amberBg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.cream }}>{s.item_nome}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 3 }}>
                    {s.cliente_nome || s.nome} · {s.pontos_usados} pts · {fmtData(s.created_at || s.data_solic)}
                  </Text>
                </View>
                <Badge label={s.item_cat} variant="gold" />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title="✓ Autorizar" variant="gold" onPress={() => onAutorizar(s.id)} style={{ flex: 1 }} />
                <Button title="✕ Recusar" variant="red" onPress={() => onRecusar(s.id)} style={{ flex: 1 }} />
              </View>
            </Card>
          ))}
        </>
      )}

      {hist.length > 0 && (
        <>
          <SectionTitle style={{ marginTop: 8 }}>Histórico</SectionTitle>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {hist.slice(0, 20).map(s => (
              <View key={s.id} style={sol_s.item}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.cream }}>{s.item_nome}</Text>
                    <StatusBadge status={s.status} />
                  </View>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                    {s.cliente_nome || s.nome} · {s.pontos_usados} pts
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
const sol_s = StyleSheet.create({
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
});

// ── ClientesTab ───────────────────────────────────────────
function ClientesTab({ clientes, onLancar, onVer }) {
  const [busca, setBusca] = useState('');
  const lista = busca
    ? clientes.filter(c => c.nome?.toLowerCase().includes(busca.toLowerCase()) || c.cpf?.includes(busca.replace(/\D/g,'')))
    : clientes;

  return (
    <View>
      <TextInput
        style={cli_s.busca}
        placeholder="Buscar por nome ou CPF..."
        placeholderTextColor={colors.muted}
        value={busca}
        onChangeText={setBusca}
      />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {lista.map(c => (
          <View key={c.cpf} style={cli_s.item}>
            <View style={[cli_s.av, { backgroundColor: c.tipo === 'mensalista' ? colors.purpleBg : colors.goldDim }]}>
              <Text style={[cli_s.avTxt, { color: c.tipo === 'mensalista' ? colors.purpleText : colors.gold }]}>
                {iniciais(c.nome)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={cli_s.nome}>{c.nome}</Text>
              <Text style={cli_s.cpf}>{fmtCPF(c.cpf)}</Text>
            </View>
            <Text style={cli_s.pts}>{c.pontos}</Text>
            <Button title={c.tipo === 'mensalista' ? '+3' : '+10'} variant="gold" onPress={() => onLancar(c.cpf)} style={{ paddingHorizontal: 10, paddingVertical: 6, marginLeft: 6 }} />
            <Button title="Ver" onPress={() => onVer(c.cpf)} style={{ paddingHorizontal: 10, paddingVertical: 6, marginLeft: 6 }} />
          </View>
        ))}
      </Card>
    </View>
  );
}
const cli_s = StyleSheet.create({
  busca: { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border2, color: colors.cream, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, fontSize: 14 },
  item:  { flexDirection: 'row', alignItems: 'center', padding: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  av:    { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avTxt: { fontSize: 12, fontWeight: '700' },
  nome:  { fontSize: 13, fontWeight: '600', color: colors.cream },
  cpf:   { fontSize: 11, color: colors.muted },
  pts:   { fontSize: 16, fontWeight: '900', color: colors.gold, minWidth: 36, textAlign: 'right', marginRight: 6 },
});

// ── MensalistasTab ────────────────────────────────────────
function MensalistasTab({ mensalistas }) {
  if (!mensalistas.length) return <EmptyState title="Nenhum mensalista" sub="Cadastre clientes como mensalistas" />;
  return (
    <View>
      {mensalistas.map(c => {
        const ativo = planoAtivo(c);
        const pi = PLANO_INFO[c.plano_tipo || 'completo'];
        const sem = semanaDoPlano(c.plano_inicio);
        return (
          <Card key={c.cpf} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.cream }}>{c.nome}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>{fmtCPF(c.cpf)} · {c.pontos} pts</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Badge label={pi.label} variant="gold" />
                <Badge label={ativo ? 'Ativo' : 'Vencido'} variant={ativo ? 'green' : 'red'} />
              </View>
            </View>
            {ativo && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {c.plano_tipo !== 'so_barba' && (
                  <View style={[mens_s.item, podeCorte(c) && mens_s.ok]}>
                    <Text style={{ color: podeCorte(c) ? colors.greenText : colors.muted, fontWeight: '700' }}>{podeCorte(c) ? '✓' : '✗'}</Text>
                    <Text style={mens_s.lbl}>Corte</Text>
                  </View>
                )}
                {c.plano_tipo !== 'sem_barba' && (
                  <View style={[mens_s.item, podeBarba(c) && mens_s.ok]}>
                    <Text style={{ color: podeBarba(c) ? colors.greenText : colors.muted, fontWeight: '700' }}>{podeBarba(c) ? '✓' : '✗'}</Text>
                    <Text style={mens_s.lbl}>Barba</Text>
                  </View>
                )}
                <View style={mens_s.item}>
                  <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 13 }}>{sem}</Text>
                  <Text style={mens_s.lbl}>Semana</Text>
                </View>
              </View>
            )}
            {ativo && (
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 6 }}>
                Vence {fmtData(c.plano_vencimento)}
              </Text>
            )}
          </Card>
        );
      })}
    </View>
  );
}
const mens_s = StyleSheet.create({
  item: { flex: 1, backgroundColor: colors.surface2, borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  ok:   { borderColor: 'rgba(45,143,82,.4)', backgroundColor: colors.greenBg },
  lbl:  { fontSize: 10, color: colors.muted, marginTop: 2, fontWeight: '600' },
});

// ── CadastrarTab ──────────────────────────────────────────
function CadastrarTab({ onSuccess }) {
  const [cpf, setCpf]   = useState('');
  const [nome, setNome] = useState('');
  const [tel, setTel]   = useState('');
  const [tipo, setTipo] = useState('regular');
  const [loading, setLoading] = useState(false);
  const { maskCPF: _, validarCPF: __ } = require('../../utils');
  const { maskCPF } = require('../../utils');

  const cadastrar = async () => {
    const raw = cpf.replace(/\D/g,'');
    if (raw.length !== 11) { Alert.alert('Erro', 'CPF inválido'); return; }
    if (!tel) { Alert.alert('Erro', 'Telefone obrigatório'); return; }
    setLoading(true);
    try {
      await clientesAPI.cadastrar({ cpf: raw, nome: nome || 'Sem nome', telefone: tel, tipo });
      Alert.alert('✓ Cadastrado!', `${nome || 'Cliente'} adicionado com sucesso.`);
      setCpf(''); setNome(''); setTel(''); setTipo('regular');
      onSuccess();
    } catch (e) { Alert.alert('Erro', e.message); }
    finally { setLoading(false); }
  };

  return (
    <Card>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.cream, marginBottom: 16 }}>Novo Cliente</Text>
      <Text style={form_s.lbl}>CPF *</Text>
      <TextInput style={form_s.inp} value={cpf} onChangeText={v => setCpf(maskCPF(v))} placeholder="000.000.000-00" placeholderTextColor={colors.muted} keyboardType="numeric" />
      <Text style={form_s.lbl}>Nome</Text>
      <TextInput style={form_s.inp} value={nome} onChangeText={setNome} placeholder="Opcional" placeholderTextColor={colors.muted} />
      <Text style={form_s.lbl}>Telefone *</Text>
      <TextInput style={form_s.inp} value={tel} onChangeText={setTel} placeholder="(66) 99999-0000" placeholderTextColor={colors.muted} keyboardType="phone-pad" />
      <Text style={form_s.lbl}>Tipo</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {['regular','mensalista'].map(t => (
          <TouchableOpacity key={t} style={[form_s.pill, tipo === t && form_s.pillActive]} onPress={() => setTipo(t)}>
            <Text style={[form_s.pillTxt, tipo === t && { color: colors.gold }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Button title="Cadastrar" variant="gold" onPress={cadastrar} loading={loading} />
    </Card>
  );
}
const form_s = StyleSheet.create({
  lbl:  { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 1, marginBottom: 5 },
  inp:  { backgroundColor: colors.surface2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border2, color: colors.cream, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12, fontSize: 14 },
  pill: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.surface2 },
  pillActive: { borderColor: colors.gold, backgroundColor: colors.goldDim },
  pillTxt: { fontSize: 13, fontWeight: '600', color: colors.muted },
});

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  topbar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  brand:   { fontSize: 17, fontWeight: '700', color: colors.gold, letterSpacing: 0.5 },
  brandSub:{ fontSize: 11, color: colors.muted, marginTop: 1 },
  sair:    { fontSize: 13, color: colors.muted },
  statsRow:{ flexDirection: 'row', padding: spacing.md, paddingHorizontal: spacing.lg - 4, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabs:    { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab:     { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:{ borderBottomColor: colors.gold },
  tabTxt:  { fontSize: 12, fontWeight: '500', color: colors.muted },
  tabTxtActive: { color: colors.gold, fontWeight: '700' },
});
