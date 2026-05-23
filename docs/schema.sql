-- Corte Fino / Barbershop - Supabase schema
-- Execute este arquivo no Supabase SQL Editor.

create extension if not exists "pgcrypto";

drop view if exists v_resgates_completo;
drop view if exists v_mensalistas_ativos;

drop table if exists pontos_historico cascade;
drop table if exists resgates cascade;
drop table if exists cortes cascade;
drop table if exists catalogo_itens cascade;
drop table if exists admin_permissoes cascade;
drop table if exists config_sistema cascade;
drop table if exists clientes cascade;
drop table if exists admins cascade;

create table admins (
  id bigserial primary key,
  email text not null unique,
  senha_hash text not null,
  nome text not null default 'Administrador',
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table clientes (
  cpf text primary key check (cpf ~ '^[0-9]{11}$'),
  nome text not null default 'Sem nome',
  telefone text not null,
  pontos integer not null default 0 check (pontos >= 0),
  tipo text not null default 'regular' check (tipo in ('regular', 'mensalista')),
  plano_tipo text default 'completo' check (plano_tipo in ('completo', 'sem_barba', 'so_barba')),
  plano_inicio date,
  plano_vencimento date,
  semanas_barba text default 'impar' check (semanas_barba in ('impar', 'par')),
  cortes_semanas jsonb not null default '[]'::jsonb,
  barbas_semanas jsonb not null default '[]'::jsonb,
  data_nascimento date,
  anotacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table admin_permissoes (
  cpf text primary key references clientes(cpf) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'superadmin')),
  senha_hash text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table catalogo_itens (
  id bigserial primary key,
  nome text not null,
  descricao text,
  custo_pontos integer not null check (custo_pontos > 0),
  categoria text not null check (categoria in ('corte', 'barba', 'bebida', 'produto')),
  ativo boolean not null default true,
  imagem_url text,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create table cortes (
  id bigserial primary key,
  cpf text not null references clientes(cpf) on delete cascade,
  admin_id bigint references admins(id),
  tipo_servico text not null default 'corte' check (tipo_servico in ('corte', 'barba')),
  pontos_adicionados integer not null check (pontos_adicionados > 0),
  semana_plano integer,
  observacao text,
  created_at timestamptz not null default now()
);

create table resgates (
  id bigserial primary key,
  cpf text not null references clientes(cpf) on delete cascade,
  item_id bigint not null references catalogo_itens(id),
  pontos_usados integer not null check (pontos_usados > 0),
  status text not null default 'pendente' check (status in ('pendente', 'autorizado', 'recusado', 'expirado')),
  data_agenda date,
  admin_id bigint references admins(id),
  motivo_recusa text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table pontos_historico (
  id bigserial primary key,
  cpf text not null references clientes(cpf) on delete cascade,
  tipo text not null check (tipo in ('ganho', 'resgate', 'estorno', 'expiracao', 'bonus')),
  pontos integer not null,
  descricao text,
  ref_id bigint,
  created_at timestamptz not null default now()
);

create table config_sistema (
  chave text primary key,
  valor text not null,
  tipo text not null default 'boolean' check (tipo in ('boolean', 'integer', 'string')),
  descricao text,
  updated_at timestamptz not null default now()
);

create index idx_clientes_tipo on clientes(tipo);
create index idx_admin_permissoes_role on admin_permissoes(role);
create index idx_clientes_vencimento on clientes(plano_vencimento) where plano_vencimento is not null;
create index idx_catalogo_ativo_ordem on catalogo_itens(ativo, ordem);
create index idx_cortes_cpf_created on cortes(cpf, created_at desc);
create index idx_resgates_cpf_created on resgates(cpf, created_at desc);
create index idx_resgates_status on resgates(status);
create index idx_resgates_agenda on resgates(data_agenda) where data_agenda is not null;
create index idx_historico_cpf_created on pontos_historico(cpf, created_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_clientes_updated
before update on clientes
for each row execute function set_updated_at();

create trigger trg_resgates_updated
before update on resgates
for each row execute function set_updated_at();

create trigger trg_admin_permissoes_updated
before update on admin_permissoes
for each row execute function set_updated_at();

create or replace view v_resgates_completo as
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
  r.motivo_recusa,
  r.created_at,
  r.updated_at
from resgates r
join clientes c on c.cpf = r.cpf
join catalogo_itens ci on ci.id = r.item_id;

create or replace view v_mensalistas_ativos as
select *
from clientes
where tipo = 'mensalista'
  and plano_vencimento >= current_date
order by nome;

create or replace function fn_lancar_corte(
  p_cpf text,
  p_admin_id bigint,
  p_tipo text,
  p_pontos integer,
  p_semana integer default null,
  p_obs text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_corte_id bigint;
  v_pontos_novos integer;
begin
  if p_tipo not in ('corte', 'barba') then
    raise exception 'Tipo de servico invalido';
  end if;

  insert into cortes (cpf, admin_id, tipo_servico, pontos_adicionados, semana_plano, observacao)
  values (p_cpf, p_admin_id, p_tipo, p_pontos, p_semana, p_obs)
  returning id into v_corte_id;

  update clientes
  set pontos = pontos + p_pontos
  where cpf = p_cpf
  returning pontos into v_pontos_novos;

  insert into pontos_historico (cpf, tipo, pontos, descricao, ref_id)
  values (
    p_cpf,
    'ganho',
    p_pontos,
    case p_tipo when 'corte' then 'Corte realizado' else 'Barba realizada' end,
    v_corte_id
  );

  return jsonb_build_object('corte_id', v_corte_id, 'pontos_atuais', v_pontos_novos);
end;
$$;

create or replace function fn_solicitar_resgate(
  p_cpf text,
  p_item_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item catalogo_itens%rowtype;
  v_pontos integer;
  v_resgate_id bigint;
  v_pendentes integer;
  v_limite integer;
begin
  select * into v_item
  from catalogo_itens
  where id = p_item_id and ativo = true;

  if not found then
    raise exception 'Item indisponivel';
  end if;

  select pontos into v_pontos
  from clientes
  where cpf = p_cpf
  for update;

  if not found then
    raise exception 'Cliente nao encontrado';
  end if;

  select coalesce(valor::integer, 2) into v_limite
  from config_sistema
  where chave = 'limite_solicitacoes';

  select count(*) into v_pendentes
  from resgates
  where cpf = p_cpf and status = 'pendente';

  if v_limite > 0 and v_pendentes >= v_limite then
    raise exception 'Limite de solicitacoes pendentes atingido';
  end if;

  if v_pontos < v_item.custo_pontos then
    raise exception 'Pontos insuficientes';
  end if;

  update clientes
  set pontos = pontos - v_item.custo_pontos
  where cpf = p_cpf;

  insert into resgates (cpf, item_id, pontos_usados)
  values (p_cpf, p_item_id, v_item.custo_pontos)
  returning id into v_resgate_id;

  return jsonb_build_object(
    'resgate_id', v_resgate_id,
    'item_nome', v_item.nome,
    'pontos_usados', v_item.custo_pontos,
    'pontos_restantes', v_pontos - v_item.custo_pontos
  );
end;
$$;

create or replace function fn_autorizar_resgate(
  p_resgate_id bigint,
  p_admin_id bigint,
  p_data_agenda date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resgate resgates%rowtype;
begin
  select * into v_resgate
  from resgates
  where id = p_resgate_id and status = 'pendente'
  for update;

  if not found then
    raise exception 'Resgate nao encontrado ou ja processado';
  end if;

  update resgates
  set status = 'autorizado',
      admin_id = p_admin_id,
      data_agenda = p_data_agenda
  where id = p_resgate_id;

  insert into pontos_historico (cpf, tipo, pontos, descricao, ref_id)
  values (v_resgate.cpf, 'resgate', -v_resgate.pontos_usados, 'Resgate autorizado', p_resgate_id);

  return jsonb_build_object('status', 'autorizado', 'data_agenda', p_data_agenda);
end;
$$;

create or replace function fn_recusar_resgate(
  p_resgate_id bigint,
  p_admin_id bigint,
  p_motivo text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resgate resgates%rowtype;
begin
  select * into v_resgate
  from resgates
  where id = p_resgate_id and status = 'pendente'
  for update;

  if not found then
    raise exception 'Resgate nao encontrado ou ja processado';
  end if;

  update resgates
  set status = 'recusado',
      admin_id = p_admin_id,
      motivo_recusa = p_motivo
  where id = p_resgate_id;

  update clientes
  set pontos = pontos + v_resgate.pontos_usados
  where cpf = v_resgate.cpf;

  insert into pontos_historico (cpf, tipo, pontos, descricao, ref_id)
  values (v_resgate.cpf, 'estorno', v_resgate.pontos_usados, 'Resgate recusado: pontos devolvidos', p_resgate_id);

  return jsonb_build_object('status', 'recusado', 'pontos_devolvidos', v_resgate.pontos_usados);
end;
$$;

alter table admins enable row level security;
alter table admin_permissoes enable row level security;
alter table clientes enable row level security;
alter table catalogo_itens enable row level security;
alter table cortes enable row level security;
alter table resgates enable row level security;
alter table pontos_historico enable row level security;
alter table config_sistema enable row level security;

-- O app mobile nao deve acessar o Supabase direto neste projeto.
-- O backend usa DATABASE_URL/service credentials e aplica autorizacao propria.
revoke all on admins from anon, authenticated;
revoke all on admin_permissoes from anon, authenticated;
revoke all on clientes from anon, authenticated;
revoke all on catalogo_itens from anon, authenticated;
revoke all on cortes from anon, authenticated;
revoke all on resgates from anon, authenticated;
revoke all on pontos_historico from anon, authenticated;
revoke all on config_sistema from anon, authenticated;
