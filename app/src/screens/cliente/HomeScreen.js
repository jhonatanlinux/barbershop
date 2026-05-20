import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, FlatList, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../theme';
import { Card, Badge, StatusBadge, SectionTitle, Button, ProgressBar, EmptyState, LoadingScreen } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { clientesAPI, catalogoAPI, resgatesAPI } from '../../api';
import { fmtCPF, fmtData, iniciais, PLANO_INFO, planoAtivo, podeCorte, podeBarba, semanaDoPlano } from '../../utils';

const TABS = ['Catálogo', 'Solicitações', 'Histórico'];

export default function ClienteHomeScreen() {
  const { user, logout } = useAuth();
  const [cliente, setCliente]   = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [solicits, setSolicits] = useState([]);
  const [tab, setTab]           = useState(0);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cRes, catRes] = await Promise.all([
        clientesAPI.buscar(user.cpf),
        catalogoAPI.listar(),
      ]);
      setCliente(cRes.data);
      setCatalogo(catRes.data);
      setSolicits(cRes.data.historico_resgates || []);
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.cpf]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const solicitar = async (itemId) => {
    try {
      await resgatesAPI.solicitar(itemId);
      Alert.alert('Solicitado!', 'Aguarde a barbearia autorizar.');
      load();
    } catch (e) {
      Alert.alert('Erro', e.message);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!cliente) return null;

  const ativo = planoAtivo(cliente);
  const prog  = cliente.pontos % 100;
  const pi    = PLANO_INFO[cliente.plano_tipo || 'completo'];

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* TopBar */}
      <View style={s.topbar}>
        <View style={s.avatarWrap}>
          <View style={s.av}><Text style={s.avTxt}>{iniciais(cliente.nome)}</Text></View>
          <View>
            <Text style={s.nome}>{cliente.nome}</Text>
            <Text style={s.cpf}>{fmtCPF(cliente.cpf)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout}><Text style={s.sair}>Sair</Text></TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        contentContainerStyle={{ padding: spacing.lg }}
      >
        {/* Card de pontos */}
        <Card gold style={s.ptsCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={s.ptsLbl}>SEUS PONTOS</Text>
              <Text style={s.ptsNum}>{cliente.pontos}</Text>
              <Text style={s.ptsHint}>Faltam {100 - prog} pts para o próximo corte grátis</Text>
            </View>
            {cliente.tipo === 'mensalista' && (
              <Badge label={pi.label} variant="gold" />
            )}
          </View>
          <ProgressBar value={prog} max={100} />
          <Text style={s.ptsFloor}>{Math.floor(cliente.pontos / 100)} corte(s) grátis conquistado(s)</Text>
        </Card>

        {/* Card plano mensalista */}
        {cliente.tipo === 'mensalista' && cliente.plano_inicio && (
          <Card style={[s.planoCard, { borderColor: pi.cor + '40' }]}>
            <View style={s.planoHeader}>
              <Text style={[s.planoTitulo, { color: pi.cor }]}>Plano {pi.label}</Text>
              <Badge label={ativo ? 'Ativo' : 'Vencido'} variant={ativo ? 'green' : 'red'} />
            </View>
            {ativo ? (
              <>
                <View style={s.planoGrid}>
                  {cliente.plano_tipo !== 'so_barba' && (
                    <PlanoItem ok={podeCorte(cliente)} label="Corte" />
                  )}
                  {cliente.plano_tipo !== 'sem_barba' && (
                    <PlanoItem ok={podeBarba(cliente)} label="Barba" />
                  )}
                  <PlanoItem ok={null} label={`Sem. ${semanaDoPlano(cliente.plano_inicio)}`} />
                </View>
                <Text style={s.planoSub}>Vence {fmtData(cliente.plano_vencimento)}</Text>
              </>
            ) : (
              <Text style={{ color: colors.amberText, fontSize: 13 }}>
                Plano vencido — procure a barbearia para renovar.
              </Text>
            )}
          </Card>
        )}

        {/* Tabs */}
        <View style={s.tabs}>
          {TABS.map((t, i) => (
            <TouchableOpacity key={t} style={[s.tab, tab === i && s.tabActive]} onPress={() => setTab(i)}>
              <Text style={[s.tabTxt, tab === i && s.tabTxtActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab: Catálogo */}
        {tab === 0 && (
          <CatalogoTab
            catalogo={catalogo}
            pontos={cliente.pontos}
            onSolicitar={solicitar}
          />
        )}

        {/* Tab: Solicitações */}
        {tab === 1 && <SolicitsTab solicits={solicits} />}

        {/* Tab: Histórico */}
        {tab === 2 && <HistoricoTab historico={cliente.historico || []} />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── PlanoItem ─────────────────────────────────────────────
function PlanoItem({ ok, label }) {
  return (
    <View style={[pi_s.wrap, ok === true && pi_s.ok, ok === false && pi_s.no]}>
      <Text style={[pi_s.icon, { color: ok === true ? colors.greenText : ok === false ? colors.redText : colors.gold }]}>
        {ok === null ? label.split(' ')[1] || label : ok ? '✓' : '✗'}
      </Text>
      <Text style={pi_s.lbl}>{ok === null ? label.split(' ')[0] : label}</Text>
    </View>
  );
}
const pi_s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.surface2, borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginHorizontal: 3 },
  ok:   { borderColor: 'rgba(45,143,82,.4)', backgroundColor: colors.greenBg },
  no:   { borderColor: colors.border },
  icon: { fontSize: 16, fontWeight: '700' },
  lbl:  { fontSize: 10, color: colors.muted, marginTop: 2, fontWeight: '600' },
});

// ── CatalogoTab ───────────────────────────────────────────
const CAT_ORDER = ['corte','barba','bebida','produto'];
const CAT_LABEL = { corte:'Cortes', barba:'Barba', bebida:'Bebidas', produto:'Produtos' };

function CatalogoTab({ catalogo, pontos, onSolicitar }) {
  return (
    <View>
      {CAT_ORDER.map(cat => {
        const items = catalogo.filter(i => i.categoria === cat);
        if (!items.length) return null;
        return (
          <View key={cat}>
            <SectionTitle>{CAT_LABEL[cat]}</SectionTitle>
            <View style={cat_s.grid}>
              {items.map(item => {
                const ok = pontos >= item.custo_pontos;
                return (
                  <Card key={item.id} style={[cat_s.card, !ok && { opacity: 0.5 }]}>
                    <View style={cat_s.thumb}>
                      <Text style={cat_s.thumbLbl}>{item.custo_pontos} pts</Text>
                    </View>
                    <Text style={cat_s.name}>{item.nome}</Text>
                    <Text style={cat_s.desc} numberOfLines={2}>{item.descricao}</Text>
                    <View style={cat_s.footer}>
                      <Text style={[cat_s.pts, !ok && { color: colors.muted }]}>
                        {ok ? `${item.custo_pontos} pts` : `Faltam ${item.custo_pontos - pontos}`}
                      </Text>
                      <Button
                        title="Solicitar"
                        variant={ok ? 'gold' : 'default'}
                        disabled={!ok}
                        onPress={() => onSolicitar(item.id)}
                        style={{ paddingVertical: 6, paddingHorizontal: 12 }}
                      />
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}
const cat_s = StyleSheet.create({
  grid:    { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 16 },
  card:    { width: '47%', margin: '1.5%', padding: 0, overflow: 'hidden' },
  thumb:   { height: 80, backgroundColor: colors.surface2, justifyContent: 'flex-end', padding: 8 },
  thumbLbl:{ fontSize: 11, fontWeight: '700', color: colors.gold, alignSelf: 'flex-end', backgroundColor: 'rgba(0,0,0,.5)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  name:    { fontSize: 13, fontWeight: '700', color: colors.cream, padding: 10, paddingBottom: 4 },
  desc:    { fontSize: 11, color: colors.muted, paddingHorizontal: 10, lineHeight: 15 },
  footer:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, paddingTop: 8 },
  pts:     { fontSize: 13, fontWeight: '700', color: colors.gold },
});

// ── SolicitsTab ───────────────────────────────────────────
function SolicitsTab({ solicits }) {
  if (!solicits.length) return <EmptyState title="Nenhuma solicitação" sub="Solicite itens do catálogo com seus pontos" />;
  return (
    <View>
      {solicits.map(s => (
        <Card key={s.id} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.cream }}>{s.item_nome}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 3 }}>
                {s.pontos_usados} pts · {fmtData(s.created_at)}
              </Text>
            </View>
            <StatusBadge status={s.status} />
          </View>
          {s.status === 'autorizado' && s.data_agenda && (
            <View style={{ marginTop: 8, backgroundColor: colors.greenBg, borderRadius: 8, padding: 8 }}>
              <Text style={{ color: colors.greenText, fontSize: 13, fontWeight: '600' }}>
                Agendado: {fmtData(s.data_agenda)}
              </Text>
            </View>
          )}
        </Card>
      ))}
    </View>
  );
}

// ── HistoricoTab ──────────────────────────────────────────
function HistoricoTab({ historico }) {
  if (!historico.length) return <EmptyState title="Nenhuma movimentação" sub="Seu histórico de pontos aparecerá aqui" />;
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      {historico.map((h, i) => (
        <View key={i} style={hist_s.item}>
          <View style={{ flex: 1 }}>
            <Text style={hist_s.desc}>{h.descricao || h.desc}</Text>
            <Text style={hist_s.date}>{fmtData(h.created_at || h.data)}</Text>
          </View>
          <Text style={[hist_s.pts, { color: h.tipo === 'ganho' ? colors.greenText : colors.redText }]}>
            {h.tipo === 'ganho' ? '+' : ''}{h.pontos}
          </Text>
        </View>
      ))}
    </Card>
  );
}
const hist_s = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  desc: { fontSize: 13, fontWeight: '500', color: colors.cream },
  date: { fontSize: 11, color: colors.muted, marginTop: 2 },
  pts:  { fontSize: 15, fontWeight: '700' },
});

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  topbar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatarWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  av:      { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.goldDim, borderWidth: 1.5, borderColor: colors.goldBorder, alignItems: 'center', justifyContent: 'center' },
  avTxt:   { color: colors.gold, fontSize: 13, fontWeight: '700' },
  nome:    { fontSize: 14, fontWeight: '600', color: colors.cream },
  cpf:     { fontSize: 11, color: colors.muted },
  sair:    { fontSize: 13, color: colors.muted },
  ptsCard: { marginBottom: 12 },
  ptsLbl:  { fontSize: 11, fontWeight: '700', color: colors.gold, letterSpacing: 1.5 },
  ptsNum:  { fontSize: 48, fontWeight: '900', color: colors.gold, lineHeight: 56 },
  ptsHint: { fontSize: 12, color: colors.muted, marginTop: 2 },
  ptsFloor:{ fontSize: 11, color: colors.muted, marginTop: 4 },
  planoCard: { marginBottom: 12, backgroundColor: colors.surface2, borderWidth: 1 },
  planoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planoTitulo: { fontSize: 15, fontWeight: '700' },
  planoGrid: { flexDirection: 'row', marginBottom: 8 },
  planoSub: { fontSize: 11, color: colors.muted },
  tabs:    { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 },
  tab:     { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:{ borderBottomColor: colors.gold },
  tabTxt:  { fontSize: 13, fontWeight: '500', color: colors.muted },
  tabTxtActive: { color: colors.gold, fontWeight: '700' },
});
