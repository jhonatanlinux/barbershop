-- Cria ou atualiza o primeiro superadmin.
-- Troque CPF e senha antes de executar no Supabase SQL Editor.
-- Nao versione senha real.

insert into admin_permissoes (cpf, role, senha_hash)
values (
  '04232595120',
  'superadmin',
  crypt('TROQUE_POR_UMA_SENHA_FORTE', gen_salt('bf'))
)
on conflict (cpf) do update
set role = excluded.role,
    senha_hash = excluded.senha_hash,
    ativo = true;
