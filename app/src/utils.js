// ── Formatadores ─────────────────────────────────────────
export const fmtCPF = (cpf = '') =>
  cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

export const fmtTel = (tel = '') =>
  tel.replace(/\D/g, '')
     .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');

export const fmtData = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR');
};

export const fmtDataCurta = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
};

export const iniciais = (nome = '') =>
  nome.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

export const today = () => new Date().toISOString().split('T')[0];

export const maskCPF = (value = '') =>
  value.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

// ── Validadores ────────────────────────────────────────────
export const validarCPF = (cpf) => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(cpf[i]) * (10 - i);
  let r = (s * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(cpf[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(cpf[i]) * (11 - i);
  r = (s * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(cpf[10]);
};

// ── Planos mensalistas ─────────────────────────────────────
export const PLANO_INFO = {
  completo:  { label: 'Completo',  sub: 'Corte + Barba', cor: '#c49a3a' },
  sem_barba: { label: 'Sem Barba', sub: 'Só Corte',      cor: '#7ab0ff' },
  so_barba:  { label: 'Só Barba',  sub: 'Careca',        cor: '#e0a060' },
};

export const semanaDoPlano = (dataInicio) => {
  if (!dataInicio) return 0;
  const ini = new Date(dataInicio);
  const hoje = new Date();
  ini.setHours(0, 0, 0, 0);
  hoje.setHours(0, 0, 0, 0);
  return Math.floor((hoje - ini) / (1000 * 60 * 60 * 24 * 7)) + 1;
};

export const planoAtivo = (cliente) => {
  if (cliente.tipo !== 'mensalista' || !cliente.plano_vencimento) return false;
  return new Date() <= new Date(cliente.plano_vencimento);
};

const parseArr = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v); } catch { return []; }
};

export const podeCorte = (c) => {
  if (!planoAtivo(c) || c.plano_tipo === 'so_barba') return false;
  const sem = semanaDoPlano(c.plano_inicio);
  return !parseArr(c.cortes_semanas).includes(sem);
};

export const podeBarba = (c) => {
  if (!planoAtivo(c) || c.plano_tipo === 'sem_barba') return false;
  const sem = semanaDoPlano(c.plano_inicio);
  const usadas = parseArr(c.barbas_semanas);
  if (c.plano_tipo === 'so_barba') return !usadas.includes(sem);
  const padrao = c.semanas_barba || 'impar';
  return (padrao === 'impar' ? sem % 2 === 1 : sem % 2 === 0) && !usadas.includes(sem);
};
