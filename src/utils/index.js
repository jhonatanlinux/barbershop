export const fmtCPF = (v = "") =>
  v.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

export const maskCPF = (v = "") =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export const fmtTel = (v = "") =>
  v.replace(/\D/g, "").replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");

export const fmtData = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + (iso.includes("T") ? "" : "T12:00:00"));
  return d.toLocaleDateString("pt-BR");
};

export const fmtDataCurta = (iso) => {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
};

export const today = () => new Date().toISOString().split("T")[0];

export const iniciais = (nome = "") =>
  nome
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "??";

export const validarCPF = (cpf) => {
  const cleanCpf = cpf.replace(/\D/g, "");
  if (cleanCpf.length !== 11 || /^(\d)\1+$/.test(cleanCpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(cleanCpf[i]) * (10 - i);
  let digit = (sum * 10) % 11;
  if (digit >= 10) digit = 0;
  if (digit !== Number(cleanCpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(cleanCpf[i]) * (11 - i);
  digit = (sum * 10) % 11;
  if (digit >= 10) digit = 0;
  return digit === Number(cleanCpf[10]);
};

export const PLANO_INFO = {
  completo: { label: "Completo", sub: "Corte + Barba", cor: "#c49030" },
  sem_barba: { label: "Sem Barba", sub: "So Corte", cor: "#7ab0ff" },
  so_barba: { label: "So Barba", sub: "Careca", cor: "#e0a060" },
};

export const parseArr = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try {
    return JSON.parse(v);
  } catch {
    return [];
  }
};

export const semanaDoPlano = (dataInicio) => {
  if (!dataInicio) return 0;
  const ini = new Date(dataInicio);
  ini.setHours(0, 0, 0, 0);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.floor((hoje - ini) / (1000 * 60 * 60 * 24 * 7)) + 1;
};

export const planoAtivo = (cliente) => {
  if (cliente?.tipo !== "mensalista" || !cliente?.plano_vencimento)
    return false;
  return new Date() <= new Date(`${cliente.plano_vencimento}T23:59:59`);
};

export const podeCorte = (cliente) => {
  if (!planoAtivo(cliente) || cliente?.plano_tipo === "so_barba") return false;
  const semana = semanaDoPlano(cliente.plano_inicio);
  return !parseArr(cliente.cortes_semanas).includes(semana);
};

export const podeBarba = (cliente) => {
  if (!planoAtivo(cliente) || cliente?.plano_tipo === "sem_barba") return false;
  const semana = semanaDoPlano(cliente.plano_inicio);
  const usadas = parseArr(cliente.barbas_semanas);
  if (cliente?.plano_tipo === "so_barba") return !usadas.includes(semana);
  const padrao = cliente?.semanas_barba || "impar";
  return (
    (padrao === "impar" ? semana % 2 === 1 : semana % 2 === 0) &&
    !usadas.includes(semana)
  );
};
