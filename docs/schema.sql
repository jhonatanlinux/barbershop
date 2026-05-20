-- ═══════════════════════════════════════════════════════════
-- BARBERSHOP — Schema PostgreSQL / Supabase
-- Execute no Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── Extensões ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Limpar se recriar ─────────────────────────────────────
DROP TABLE IF EXISTS config_sistema     CASCADE;
DROP TABLE IF EXISTS pontos_historico   CASCADE;
DROP TABLE IF EXISTS resgates           CASCADE;
DROP TABLE IF EXISTS cortes             CASCADE;
DROP TABLE IF EXISTS catalogo_itens     CASCADE;
DROP TABLE IF EXISTS clientes           CASCADE;
DROP TABLE IF EXISTS admins             CASCADE;

-- ═══════════════════════════════════════════════════════════
-- ADMINS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE admins (
  id           SERIAL PRIMARY KEY,
  email        VARCHAR(255) UNIQUE NOT NULL,
  senha_hash   VARCHAR(255) NOT NULL,
  nome         VARCHAR(255) NOT NULL DEFAULT 'Administrador',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- CLIENTES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE clientes (
  cpf              VARCHAR(11) PRIMARY KEY,
  nome             VARCHAR(255) NOT NULL DEFAULT 'Sem nome',
  telefone         VARCHAR(20)  NOT NULL,
  pontos           INTEGER      NOT NULL DEFAULT 0,
  tipo             VARCHAR(20)  NOT NULL DEFAULT 'regular'
                   CHECK (tipo IN ('regular', 'mensalista')),

  -- Plano mensalista
  plano_tipo       VARCHAR(20)  DEFAULT 'completo'
                   CHECK (plano_tipo IN ('completo', 'sem_barba', 'so_barba')),
  plano_inicio     DATE,
  plano_vencimento DATE,
  semanas_barba    VARCHAR(10)  DEFAULT 'impar'
                   CHECK (semanas_barba IN ('impar', 'par')),
  cortes_semanas   TEXT         DEFAULT '[]',   -- JSON array de semanas usadas
  barbas_semanas   TEXT         DEFAULT '[]',   -- JSON array de semanas usadas

  -- Info extra
  data_nascimento  DATE,
  anotacoes        TEXT,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- CATÁLOGO DE RESGATES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE catalogo_itens (
  id           SERIAL PRIMARY KEY,
  nome         VARCHAR(255) NOT NULL,
  descricao    TEXT,
  custo_pontos INTEGER      NOT NULL CHECK (custo_pontos > 0),
  categoria    VARCHAR(20)  NOT NULL
               CHECK (categoria IN ('corte', 'barba', 'bebida', 'produto')),
  ativo        BOOLEAN      NOT NULL DEFAULT TRUE,
  imagem_url   TEXT,
  ordem        INTEGER      DEFAULT 0,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- CORTES / SESSÕES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE cortes (
  id                 SERIAL PRIMARY KEY,
  cpf                VARCHAR(11) NOT NULL REFERENCES clientes(cpf) ON DELETE CASCADE,
  admin_id           INTEGER     REFERENCES admins(id),
  tipo_servico       VARCHAR(20) NOT NULL DEFAULT 'corte'
                     CHECK (tipo_servico IN ('corte', 'barba')),
  pontos_adicionados INTEGER     NOT NULL,
  semana_plano       INTEGER,          -- Semana do plano mensalista
  observacao         TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- RESGATES (SOLICITAÇÕES)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE resgates (
  id           SERIAL PRIMARY KEY,
  cpf          VARCHAR(11) NOT NULL REFERENCES clientes(cpf) ON DELETE CASCADE,
  item_id      INTEGER     NOT NULL REFERENCES catalogo_itens(id),
  pontos_usados INTEGER    NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'pendente'
               CHECK (status IN ('pendente', 'autorizado', 'recusado', 'expirado')),
  data_agenda  DATE,
  admin_id     INTEGER     REFERENCES admins(id),
  motivo_recusa TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- HISTÓRICO DE PONTOS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE pontos_historico (
  id         SERIAL PRIMARY KEY,
  cpf        VARCHAR(11) NOT NULL REFERENCES clientes(cpf) ON DELETE CASCADE,
  tipo       VARCHAR(20) NOT NULL
             CHECK (tipo IN ('ganho', 'resgate', 'estorno', 'expiracao', 'bonus')),
  pontos     INTEGER     NOT NULL,  -- positivo = ganho, negativo = gasto
  descricao  TEXT,
  ref_id     INTEGER,               -- ID do corte ou resgate relacionado
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- CONFIG DO SISTEMA (FEATURE FLAGS)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE config_sistema (
  chave      VARCHAR(100) PRIMARY KEY,
  valor      TEXT         NOT NULL,
  tipo       VARCHAR(20)  DEFAULT 'boolean'
             CHECK (tipo IN ('boolean', 'integer', 'string')),
  descricao  TEXT,
  updated_at TIMESTAMPTZ  DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- ÍNDICES
-- ═══════════════════════════════════════════════════════════
CREATE INDEX idx_cortes_cpf        ON cortes(cpf);
CREATE INDEX idx_cortes_created    ON cortes(created_at DESC);
CREATE INDEX idx_resgates_cpf      ON resgates(cpf);
CREATE INDEX idx_resgates_status   ON resgates(status);
CREATE INDEX idx_resgates_agenda   ON resgates(data_agenda) WHERE data_agenda IS NOT NULL;
CREATE INDEX idx_hist_cpf          ON pontos_historico(cpf);
CREATE INDEX idx_hist_created      ON pontos_historico(created_at DESC);
CREATE INDEX idx_clientes_tipo     ON clientes(tipo);
CREATE INDEX idx_clientes_venc     ON clientes(plano_vencimento) WHERE plano_vencimento IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS — updated_at automático
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clientes_updated
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_resgates_updated
  BEFORE UPDATE ON resgates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ═══════════════════════════════════════════════════════════
-- VIEW — painel admin (solicits com nome do item e cliente)
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW v_resgates_completo AS
SELECT
  r.id,
  r.cpf,
  c.nome          AS cliente_nome,
  c.telefone      AS cliente_tel,
  r.item_id,
  ci.nome         AS item_nome,
  ci.categoria    AS item_cat,
  r.pontos_usados,
  r.status,
  r.data_agenda,
  r.motivo_recusa,
  r.created_at    AS data_solic,
  r.updated_at    AS data_autor
FROM resgates r
JOIN clientes c  ON c.cpf    = r.cpf
JOIN catalogo_itens ci ON ci.id = r.item_id
ORDER BY r.created_at DESC;

-- ═══════════════════════════════════════════════════════════
-- VIEW — mensalistas ativos
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW v_mensalistas_ativos AS
SELECT *
FROM clientes
WHERE tipo = 'mensalista'
  AND plano_vencimento >= CURRENT_DATE
ORDER BY nome;

-- ═══════════════════════════════════════════════════════════
-- FUNCTION — Lançar corte e atualizar pontos atomicamente
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION fn_lancar_corte(
  p_cpf         VARCHAR(11),
  p_admin_id    INTEGER,
  p_tipo        VARCHAR(20),
  p_pontos      INTEGER,
  p_semana      INTEGER DEFAULT NULL,
  p_obs         TEXT    DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_corte_id INTEGER;
  v_pontos_novos INTEGER;
BEGIN
  -- Inserir registro do corte
  INSERT INTO cortes (cpf, admin_id, tipo_servico, pontos_adicionados, semana_plano, observacao)
  VALUES (p_cpf, p_admin_id, p_tipo, p_pontos, p_semana, p_obs)
  RETURNING id INTO v_corte_id;

  -- Atualizar pontos do cliente
  UPDATE clientes SET pontos = pontos + p_pontos WHERE cpf = p_cpf
  RETURNING pontos INTO v_pontos_novos;

  -- Registrar no histórico
  INSERT INTO pontos_historico (cpf, tipo, pontos, descricao, ref_id)
  VALUES (p_cpf, 'ganho', p_pontos,
          CASE p_tipo WHEN 'corte' THEN 'Corte realizado' ELSE 'Barba realizada' END
          || CASE WHEN p_semana IS NOT NULL THEN ' · Semana ' || p_semana ELSE '' END,
          v_corte_id);

  RETURN json_build_object('corte_id', v_corte_id, 'pontos_atuais', v_pontos_novos);
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════
-- FUNCTION — Solicitar resgate (reservar pontos)
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION fn_solicitar_resgate(
  p_cpf     VARCHAR(11),
  p_item_id INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_item     catalogo_itens%ROWTYPE;
  v_cliente  clientes%ROWTYPE;
  v_res_id   INTEGER;
  v_pendentes INTEGER;
BEGIN
  SELECT * INTO v_item FROM catalogo_itens WHERE id = p_item_id AND ativo = TRUE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado ou inativo'; END IF;

  SELECT * INTO v_cliente FROM clientes WHERE cpf = p_cpf;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cliente não encontrado'; END IF;

  IF v_cliente.pontos < v_item.custo_pontos THEN
    RAISE EXCEPTION 'Pontos insuficientes: % disponíveis, % necessários',
      v_cliente.pontos, v_item.custo_pontos;
  END IF;

  -- Verificar limite de pendentes (config)
  SELECT COUNT(*) INTO v_pendentes FROM resgates
  WHERE cpf = p_cpf AND status = 'pendente';

  -- Deduzir pontos e criar resgate
  UPDATE clientes SET pontos = pontos - v_item.custo_pontos WHERE cpf = p_cpf;

  INSERT INTO resgates (cpf, item_id, pontos_usados)
  VALUES (p_cpf, p_item_id, v_item.custo_pontos)
  RETURNING id INTO v_res_id;

  RETURN json_build_object(
    'resgate_id', v_res_id,
    'item_nome', v_item.nome,
    'pontos_usados', v_item.custo_pontos,
    'pontos_restantes', v_cliente.pontos - v_item.custo_pontos
  );
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════
-- RLS — Row Level Security
-- ═══════════════════════════════════════════════════════════
ALTER TABLE clientes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE resgates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE cortes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_itens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_sistema   ENABLE ROW LEVEL SECURITY;

-- Service role bypassa RLS (backend usa service role)
-- Anon role lê apenas catálogo ativo
CREATE POLICY "catalogo_publico"
  ON catalogo_itens FOR SELECT
  TO anon
  USING (ativo = TRUE);

-- Usuário autenticado pode ler sua própria linha
CREATE POLICY "cliente_le_proprio"
  ON clientes FOR SELECT
  TO authenticated
  USING (cpf = current_setting('app.cpf_atual', TRUE));

CREATE POLICY "cliente_le_historico"
  ON pontos_historico FOR SELECT
  TO authenticated
  USING (cpf = current_setting('app.cpf_atual', TRUE));

CREATE POLICY "cliente_le_resgates"
  ON resgates FOR SELECT
  TO authenticated
  USING (cpf = current_setting('app.cpf_atual', TRUE));

COMMENT ON TABLE admins IS 'Usuários administradores da barbearia';
COMMENT ON TABLE clientes IS 'Clientes cadastrados — CPF é a chave primária';
COMMENT ON TABLE catalogo_itens IS 'Itens disponíveis para resgate de pontos';
COMMENT ON TABLE cortes IS 'Registro de cada corte/barba realizado';
COMMENT ON TABLE resgates IS 'Solicitações de resgate do catálogo';
COMMENT ON TABLE pontos_historico IS 'Auditoria completa de movimentação de pontos';
COMMENT ON TABLE config_sistema IS 'Feature flags e configurações do sistema';
