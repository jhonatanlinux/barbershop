# Padrao de commits

Use mensagens completas quando a mudanca for importante para deploy, banco de dados, APK ou regra de negocio.

Exemplo:

```text
feat: usar permissao de admin por CPF

Versao: APP 1.1

Problema:

- Login admin dependia de um usuario generico.
- A senha de admin poderia circular entre pessoas nao autorizadas.

Correcao:

- Cria permissao de admin vinculada ao CPF.
- Adiciona tabela admin_permissoes no Supabase.
- Atualiza tela de login admin para CPF e senha.

Impacto:

- Admins precisam estar cadastrados pelo CPF antes de acessar o painel.
- Novo APK deve ser gerado para entregar a tela atualizada.

Cuidados:

- Rodar a migration no Supabase antes de testar login admin.
- Criar o primeiro superadmin manualmente no SQL Editor.
- Nao versionar senhas reais.
```

Tipos recomendados:

- `feat`: nova funcionalidade.
- `fix`: correcao de erro.
- `refactor`: melhoria interna sem mudar comportamento esperado.
- `chore`: configuracao, build, limpeza ou tarefa tecnica.
- `docs`: documentacao.
- `security`: ajuste ligado a seguranca.

Checklist antes do commit:

- Verificar `git status`.
- Conferir se nao entrou `.env`, senha, token ou chave.
- Testar o app ou ao menos validar a tela/fluxo alterado.
- Se alterar APK, confirmar versao e `versionCode`.
- Se alterar banco, documentar migration e ordem de execucao.
