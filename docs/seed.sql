-- Corte Fino / Barbershop - seed inicial
-- Execute depois de docs/schema.sql.
-- Nao coloque senha real neste arquivo se ele for versionado.

insert into catalogo_itens (nome, descricao, custo_pontos, categoria, ordem) values
('Corte Gratis', 'Corte masculino completo sem custo', 100, 'corte', 1),
('Corte + Barba', 'Combo completo: corte e barba por pontos', 140, 'corte', 2),
('Barba Gratis', 'Modelagem e acabamento de barba completo', 60, 'barba', 3),
('Cerveja Gelada', 'Uma bebida gelada durante o atendimento', 30, 'bebida', 4),
('Refrigerante', 'Lata gelada a sua escolha', 15, 'bebida', 5),
('Pomada Matte', 'Fixacao forte, acabamento opaco', 50, 'produto', 6),
('Balm Barba', 'Hidratacao e controle da barba', 40, 'produto', 7);

insert into config_sistema (chave, valor, tipo, descricao) values
('modulo_mensalista', 'true', 'boolean', 'Habilita planos mensalistas'),
('modulo_catalogo', 'true', 'boolean', 'Habilita catalogo de resgates'),
('validacao_cpf', 'true', 'boolean', 'Valida CPF no cadastro/login'),
('limite_solicitacoes', '2', 'integer', 'Maximo de resgates pendentes por cliente'),
('expiracao_solicitacao_dias', '7', 'integer', 'Dias para expirar solicitacao pendente'),
('pontos_por_corte', '10', 'integer', 'Pontos por corte para cliente regular'),
('pontos_mensalista', '3', 'integer', 'Pontos por sessao para mensalistas'),
('nome_barbearia', 'Corte Fino', 'string', 'Nome exibido no app'),
('preco_mensalista', '150', 'integer', 'Preco do plano completo'),
('preco_mensalista_sem_barba', '100', 'integer', 'Preco do plano sem barba'),
('preco_mensalista_so_barba', '80', 'integer', 'Preco do plano so barba'),
('dias_plano', '30', 'integer', 'Duracao do plano em dias');

-- Clientes de exemplo. Remova se quiser iniciar com banco vazio.
insert into clientes (cpf, nome, telefone, pontos, tipo) values
('04232595120', 'Carlos Eduardo', '(66) 99234-5678', 50, 'regular'),
('98765432100', 'Pedro Henrique', '(66) 97654-3210', 80, 'regular'),
('55566677788', 'Lucas Ferreira', '(66) 95432-1098', 20, 'regular');

insert into clientes (
  cpf,
  nome,
  telefone,
  pontos,
  tipo,
  plano_tipo,
  plano_inicio,
  plano_vencimento,
  semanas_barba,
  cortes_semanas,
  barbas_semanas
) values
(
  '12345678900',
  'Rafael Mendes',
  '(66) 98765-4321',
  130,
  'mensalista',
  'completo',
  current_date - 18,
  current_date + 12,
  'impar',
  '[1,2]'::jsonb,
  '[1]'::jsonb
);
