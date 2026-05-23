-- Registra qual admin autorizou ou recusou cada resgate.

alter table resgates
  add column if not exists admin_cpf text,
  add column if not exists admin_nome text,
  add column if not exists processed_at timestamptz;

create index if not exists idx_resgates_processed_at
  on resgates(processed_at desc)
  where processed_at is not null;

drop view if exists v_resgates_completo;

create view v_resgates_completo as
select
  r.id,
  r.cpf,
  c.nome as cliente_nome,
  c.telefone as cliente_tel,
  r.item_id,
  ci.nome as item_nome,
  ci.categoria as item_cat,
  r.pontos_usados,
  r.status,
  r.data_agenda,
  r.admin_cpf,
  r.admin_nome,
  r.processed_at,
  r.motivo_recusa,
  r.created_at,
  r.updated_at
from resgates r
join clientes c on c.cpf = r.cpf
join catalogo_itens ci on ci.id = r.item_id;
