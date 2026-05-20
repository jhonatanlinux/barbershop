import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Card, Badge, StatusBadge, Button, SectionTitle, EmptyState, LoadingScreen } from '../../components';
import { clientesAPI, cortesAPI } from '../../api';
import { fmtCPF, fmtData, iniciais, planoAtivo, podeCorte, podeBarba, semanaDoPlano, PLANO_INFO } from '../../utils';

export default function ClienteDetalheScreen({ route }) {
  const { cpf } = route.params;
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await clientesAPI.buscar(cpf);
      setCliente(data);
    } catch (e) { Alert.alert('Erro', e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const lancar = async (tipo) => {
    try {
      await cortesAPI.lancar(cpf, tipo);
      Alert.alert('✓ Lançado!', `+pts adicionados ao ${cliente.nome}`);
      load();
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  if (loading) return <LoadingScreen />;
  if (!cliente) return null;

  const ativo = planoAtivo(cliente);
  const isMens = cliente.tipo === 'mensalista';
  const pi = PLANO_INFO[cliente.plano_tipo || 'completo'];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg }}>
      {/* Header */}
      <Card style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <View style={[s.av, { backgroundColor: isMens ? colors.purpleBg : colors.goldDim }]}>
            <Text style={{ color: isMens ? colors.purpleText : colors.gold, fontSize: 16, fontWeight: '700' }}>
              {iniciais(cliente.nome)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.cream }}>{cliente.nome}</Text>
              {isMens && <Badge label={pi.label} variant="gold" />}
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 3 }}>
              {fmtCPF(cliente.cpf)} · {cliente.telefone}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={[s.statVal, { color: colors.gold }]}>{cliente.pontos}</Text>
            <Text style={s.statLbl}>Pontos</Text>
          </View>
          {isMens && cliente.plano_inicio ? (
            <View style={s.statBox}>
              <Text style={s.statVal}>Sem. {semanaDoPlano(cliente.plano_inicio)}</Text>
              <Text style={s.statLbl}>Semana do plano</Text>
            </View>
          ) : (
            <View style={s.statBox}>
              <Text style={s.statVal}>{cliente.historico?.filter(h => h.tipo === 'ganho').length || 0}</Text>
              <Text style={s.statLbl}>Serviços</Text>
            </View>
          )}
        </View>

        {isMens && ativo && (
          <View style={s.planoInfo}>
            <Text style={{ color: colors.amberText, fontSize: 13 }}>
              Corte: {podeCorte(cliente) ? '✓ Disponível' : '✗ Já realizado esta semana'}
            </Text>
            <Text style={{ color: colors.amberText, fontSize: 13, marginTop: 2 }}>
              Barba: {podeBarba(cliente) ? '✓ Disponível' : '✗ Não disponível'}
            </Text>
          </View>
        )}

        {/* Botões de lançamento */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          {isMens ? (
            <>
              {cliente.plano_tipo !== 'so_barba' && (
                <Button title="✂ Corte +3" variant="gold" disabled={!podeCorte(cliente)} onPress={() => lancar('corte')} style={{ flex: 1 }} />
              )}
              {cliente.plano_tipo !== 'sem_barba' && (
                <Button title="Barba +3" variant="green" disabled={!podeBarba(cliente)} onPress={() => lancar('barba')} style={{ flex: 1 }} />
              )}
            </>
          ) : (
            <Button title="✂ Lançar +10 pts" variant="gold" onPress={() => lancar('corte')} style={{ flex: 1 }} />
          )}
        </View>
      </Card>

      {/* Histórico de pontos */}
      <SectionTitle>Histórico de pontos</SectionTitle>
      {cliente.historico?.length ? (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {cliente.historico.slice(0, 30).map((h, i) => (
            <View key={i} style={s.histItem}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.cream }}>{h.descricao || h.desc}</Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{fmtData(h.created_at || h.data)}</Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: h.tipo === 'ganho' ? colors.greenText : colors.redText }}>
                {h.tipo === 'ganho' ? '+' : ''}{h.pontos}
              </Text>
            </View>
          ))}
        </Card>
      ) : (
        <EmptyState title="Sem histórico" sub="Nenhuma movimentação registrada" />
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  av:       { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statBox:  { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.md, padding: 12, alignItems: 'center' },
  statVal:  { fontSize: 22, fontWeight: '900', color: colors.cream },
  statLbl:  { fontSize: 11, color: colors.muted, marginTop: 2 },
  planoInfo:{ backgroundColor: colors.amberBg, borderRadius: 8, padding: 10, marginBottom: 12 },
  histItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
});
