-- Copie este arquivo para um bloco separado no Supabase SQL Editor.
-- Troque os valores antes de executar.
-- Nao versione senha real.

insert into admins (email, senha_hash, nome)
values (
  'admin',
  crypt('B4rB3ariaC0RT3F|N0', gen_salt('bf')),
  'Administrador'
);
