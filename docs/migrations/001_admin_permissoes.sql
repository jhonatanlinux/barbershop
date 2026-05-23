-- Migra admin por email para permissao administrativa vinculada ao CPF.
-- Execute no Supabase SQL Editor.

create table if not exists admin_permissoes (
  cpf text primary key references clientes(cpf) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'superadmin')),
  senha_hash text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_admin_permissoes_updated
before update on admin_permissoes
for each row execute function set_updated_at();

alter table admin_permissoes enable row level security;
revoke all on admin_permissoes from anon, authenticated;

create index if not exists idx_admin_permissoes_role on admin_permissoes(role);

-- Exemplo: troque CPF e senha antes de executar.
-- insert into admin_permissoes (cpf, role, senha_hash)
-- values ('04232595120', 'superadmin', crypt('TROQUE_POR_UMA_SENHA_FORTE', gen_salt('bf')))
-- on conflict (cpf) do update
-- set role = excluded.role,
--     senha_hash = excluded.senha_hash,
--     ativo = true;
