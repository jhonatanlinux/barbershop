-- ═══════════════════════════════════════════════════════════
-- BARBERSHOP — Seed (dados iniciais)
-- Execute APÓS o schema.sql
-- ═══════════════════════════════════════════════════════════

-- ── Admin padrão ──────────────────────────────────────────
-- Senha: -1PL&,8!gk>J9Np
INSERT INTO admins (email, senha_hash, nome) VALUES
('admin', crypt('-1PL&,8!gk>J9Np', gen_salt('bf')), 'Administrador');

-- ── Catálogo de resgates ──────────────────────────────────
INSERT INTO catalogo_itens (nome, descricao, custo_pontos, categoria, ordem) VALUES
('Corte Grátis',       'Corte masculino completo sem custo',         100, 'corte',   1),
('Corte + Barba',      'Combo completo: corte e barba por pontos',   140, 'corte',   2),
('Barba Grátis',       'Modelagem e acabamento de barba completo',   60,  'barba',   3),
('Cerveja Gelada',     'Uma Heineken bem gelada durante o atendimento', 30, 'bebida', 4),
('Refrigerante',       'Lata gelada à sua escolha',                  15,  'bebida',  5),
('Zacca Pomada Matte', 'Efeito matte — fixação forte, acabamento opaco', 50, 'produto', 6),
('Zacca Balm Barba',   'Hidratação e controle — 120g com pump',      40,  'produto', 7);

-- ── Feature Flags padrão ─────────────────────────────────
INSERT INTO config_sistema (chave, valor, tipo, descricao) VALUES
('modulo_mensalista',          'true',  'boolean', 'Habilita planos mensalistas'),
('modulo_catalogo',            'true',  'boolean', 'Habilita catálogo de resgates'),
('modulo_indicacao',           'false', 'boolean', 'Programa de indicação'),
('modulo_aniversario',         'false', 'boolean', 'Pontos dobrados no aniversário'),
('modulo_agendamento_cliente', 'false', 'boolean', 'Agendamento pelo cliente'),
('modulo_fila_walkin',         'false', 'boolean', 'Fila de espera walk-in'),
('modulo_avaliacao',           'false', 'boolean', 'Avaliação pós-atendimento'),
('modulo_qrcode',              'false', 'boolean', 'QR Code do cliente'),
('modulo_whatsapp',            'false', 'boolean', 'Notificação WhatsApp'),
('modulo_multiplos_barbeiros', 'false', 'boolean', 'Múltiplos barbeiros'),
('validacao_cpf',              'true',  'boolean', 'Validação matemática do CPF'),
('pin_cliente',                'false', 'boolean', 'PIN de 4 dígitos no login'),
('limite_solicitacoes',        '2',     'integer', 'Máx. de resgates pendentes por cliente (0=sem limite)'),
('expiracao_solicitacao_dias', '7',     'integer', 'Dias para expirar solicitação não respondida (0=nunca)'),
('pontos_por_corte',           '10',    'integer', 'Pontos por corte para clientes regulares'),
('pontos_mensalista',          '3',     'integer', 'Pontos por sessão para mensalistas'),
('pontos_indicacao',           '20',    'integer', 'Pontos bônus por indicação'),
('aniversario_multiplicador',  '2',     'integer', 'Multiplicador de pontos no mês do aniversário'),
('nome_barbearia',             'Barbearia', 'string', 'Nome exibido no app'),
('preco_mensalista',           '150',   'integer', 'Preço do plano Completo (R$)'),
('preco_mensalista_sem_barba', '100',   'integer', 'Preço do plano Sem Barba (R$)'),
('preco_mensalista_so_barba',  '80',    'integer', 'Preço do plano Só Barba (R$)'),
('dias_plano',                 '30',    'integer', 'Duração do plano em dias');

-- ── Clientes de exemplo ────────────────────────────────────
INSERT INTO clientes (cpf, nome, telefone, pontos, tipo) VALUES
('04232595120', 'Carlos Eduardo', '(66) 99234-5678', 50,  'regular'),
('98765432100', 'Pedro Henrique', '(66) 97654-3210', 80,  'regular'),
('55566677788', 'Lucas Ferreira', '(66) 95432-1098', 20,  'regular');

-- Mensalistas
INSERT INTO clientes (
  cpf, nome, telefone, pontos, tipo,
  plano_tipo, plano_inicio, plano_vencimento, semanas_barba,
  cortes_semanas, barbas_semanas
) VALUES
('12345678900', 'Rafael Mendes', '(66) 98765-4321', 130, 'mensalista',
 'completo', CURRENT_DATE - 18, CURRENT_DATE + 12, 'impar', '[1,2]', '[1]'),
('11122233344', 'Marcos Vinícius', '(66) 96543-2109', 75, 'mensalista',
 'so_barba', CURRENT_DATE - 8, CURRENT_DATE + 22, 'par', '[]', '[1]');

-- ── Histórico de pontos ────────────────────────────────────
INSERT INTO pontos_historico (cpf, tipo, pontos, descricao, created_at) VALUES
('04232595120', 'ganho',    10,  'Corte realizado',    NOW() - INTERVAL '7 days'),
('04232595120', 'ganho',    10,  'Corte realizado',    NOW() - INTERVAL '14 days'),
('04232595120', 'resgate',  -30, 'Resgate: Cerveja Gelada', NOW() - INTERVAL '20 days'),
('04232595120', 'ganho',    10,  'Corte realizado',    NOW() - INTERVAL '28 days'),
('98765432100', 'ganho',    10,  'Corte realizado',    NOW() - INTERVAL '5 days'),
('98765432100', 'ganho',    10,  'Corte realizado',    NOW() - INTERVAL '12 days'),
('12345678900', 'ganho',    3,   'Corte · Mensalista Semana 3', NOW() - INTERVAL '3 days'),
('12345678900', 'ganho',    3,   'Corte · Mensalista Semana 2', NOW() - INTERVAL '10 days'),
('11122233344', 'ganho',    3,   'Barba · Mensalista Semana 2', NOW() - INTERVAL '2 days'),
('11122233344', 'resgate',  -60, 'Resgate: Barba Grátis',       NOW() - INTERVAL '5 days');

-- ── Solicitações de exemplo ────────────────────────────────
INSERT INTO resgates (cpf, item_id, pontos_usados, status, created_at) VALUES
('04232595120', 1, 100, 'pendente',   NOW() - INTERVAL '1 day'),
('98765432100', 4, 30,  'pendente',   NOW()),
('11122233344', 3, 60,  'pendente',   NOW()),
('12345678900', 6, 50,  'autorizado', NOW() - INTERVAL '5 days'),
('98765432100', 1, 100, 'autorizado', NOW() - INTERVAL '9 days');

UPDATE resgates SET data_agenda = CURRENT_DATE + 2
WHERE cpf = '98765432100' AND status = 'autorizado';
