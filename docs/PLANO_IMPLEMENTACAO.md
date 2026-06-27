# Plano de implementação do Bookja

Documento de trabalho para corrigir bugs, fechar features incompletas e estabilizar a base antes de novas funcionalidades.

Última atualização: 2026-06-27

## Resumo executivo

O projeto já tem uma base funcional relevante: autenticação, painel, criação e edição de projetos, documentos TipTap, catálogo público, leitura, comentários, mural, favoritos, notificações, colaboração, importação/exportação e modelo Supabase com RLS.

O principal risco atual não é falta de tela, mas inconsistência entre modelo, código e fluxos. Há campos consultados que não existem, tipos do Supabase ainda não gerados, regras de autorização duplicadas, publicação incompleta, E2E desativado, alguns fluxos de produto sem persistência real e validações insuficientes.

## Progresso

### Concluído em 2026-06-26

- Corrigido `criarComentario` para notificar `projeto.dono_id`.
- Corrigida a home para buscar `leitura_atual` com `projeto_id` e `ultimo_documento_id`.
- Adicionada persistência de `leitura_atual` ao abrir uma página de leitura.
- Criadas `publicarProjeto` e `despublicarProjeto`, com manutenção de `publicado_em`.
- Removidos logs de debug de `listarProjetos`.
- Restaurado `playwright.config.ts`.
- Atualizados specs E2E de autenticação/navegação para a UI atual.
- Adicionados testes unitários para publicação/despublicação e notificação de comentário.
- Criado helper compartilhado de acesso a projeto em `src/lib/projetos/acesso.ts`.
- Documentos, colaboradores, importação e exportação passaram a usar a autorização compartilhada.
- Exportação de histórias publicadas passou a permitir visitante, exportando apenas capítulos públicos.
- Substituído o placeholder de `src/types/database.ts` por tipos manuais alinhados às migrations.
- Tipados os clientes Supabase (`browser`, `server` e `middleware`) com `Database`.
- Atualizado `@supabase/ssr` para `^0.12.0`, compatível com `@supabase/supabase-js` `2.108.x`.
- Declarados relacionamentos Supabase usados por embeds: projetos/documentos, colaboradores/perfis, tags, comentários, mural, favoritos, leitura atual e locks.
- Ajustados contratos TypeScript para `null`, ids numéricos de tags, conteúdo `Json` e status restrito de projeto.
- Validado `npm run test:e2e` localmente com `.env.local` ignorado pelo Git.
- Removidos warnings de lint em hooks, imagens, imports e testes.
- Adicionados `playwright-report/` e `test-results/` ao `.gitignore`.
- Corrigida regra de classificação etária para bloquear conteúdo restrito quando a idade é desconhecida.
- Corrigida autorização de colaboradores para exigir `aceito_em is not null`.
- Adicionada migration `010_colaborador_aceite_obrigatorio.sql` com `eh_colaborador` revisada, policy de aceite e trigger para impedir alteração indevida do convite.

### Concluído em 2026-06-27

- Criado helper `src/lib/api/respostas.ts` para respostas públicas de erro, parsing JSON seguro, validação de UUID e validação de valores JSON.
- Aplicado o helper nas APIs de importação, confirmação de importação, exportação e lock.
- Rotas de importação/exportação passaram a retornar erro interno genérico em falhas inesperadas, sem expor `error.message`.
- Rotas de lock passaram a validar payload JSON e UUID de forma centralizada e também retornam erro interno genérico em falhas inesperadas.
- Adicionados testes unitários para validação de UUID/JSON e mapeamento de erros de acesso.
- Criado helper `src/lib/validacao/comum.ts` para validações neutras reutilizadas por APIs e Server Actions.
- Criado helper `src/lib/actions/erros.ts` para padronizar erros públicos em Server Actions.
- Server Actions de projetos passaram a validar UUID, título e status no servidor e a ocultar mensagens técnicas do Supabase.
- Server Actions de documentos passaram a validar UUID, tipo, conteúdo JSON, contagem de palavras e ordem antes de mutações.
- Adicionados testes unitários para validação e erros públicos em projetos/documentos.

## Achados prioritários

### P0 - Corrigir antes de evoluir features

1. Comentários consultam campo inexistente em `projeto`
   - Local: `src/lib/comentarios/actions.ts`
   - Problema: a criação de comentário busca `autor_id`, mas a tabela `projeto` possui `dono_id`.
   - Impacto: notificação de novo comentário pode falhar ou nunca chegar ao dono.
   - Status: concluído em 2026-06-26.

2. Home consulta colunas inexistentes em `leitura_atual`
   - Local: `src/app/[locale]/(publico)/page.tsx`
   - Problema: a query seleciona `id`, `titulo`, `ultimo_capitulo_titulo`, `capitulo_id` e `historia_id`; a migration define `usuario_id`, `projeto_id`, `ultimo_documento_id`, `criado_em`, `atualizado_em`.
   - Impacto: a seção "Continuar lendo" quebra ou fica sempre vazia.
   - Status: concluído em 2026-06-26.

3. Tipos do Supabase são placeholder
   - Local: `src/types/database.ts`
   - Problema: `Tables: Record<string, never>` impede tipagem real.
   - Impacto: campos inexistentes passam despercebidos, como os dois problemas acima.
   - Status: concluído provisoriamente em 2026-06-26 com tipos manuais alinhados às migrations. Próximo passo futuro: substituir por tipos gerados via Supabase CLI quando houver acesso ao projeto remoto.

4. Publicação não preenche `publicado_em`
   - Local: `src/app/[locale]/(painel)/projeto/[id]/editar/page.tsx` e `src/lib/projetos/actions.ts`
   - Problema: publicar muda apenas `status`.
   - Impacto: `buscarNovidades()` filtra `publicado_em is not null`, então histórias recém-publicadas podem não aparecer em novidades.
   - Status: concluído em 2026-06-26.

5. Testes E2E estão configurados como arquivo `.bak`
   - Local: `playwright.config.ts.bak`
   - Problema: `npm run test:e2e` existe, mas a configuração ativa não está no nome esperado.
   - Impacto: fluxo E2E pode não rodar como esperado.
   - Status: concluído em 2026-06-26. Configuração restaurada e `npm run test:e2e` validado localmente.

### P1 - Segurança, consistência e dados

6. Exportação exige login mesmo para projeto publicado
   - Local: `src/app/api/exportar/[formato]/route.ts`
   - Problema: a rota retorna 401 antes de avaliar se o projeto é público.
   - Impacto: histórias publicadas não podem ser exportadas por visitantes, apesar do código indicar suporte a `isPublicado`.
   - Status: corrigido em 2026-06-26. Visitantes exportam apenas capítulos públicos de histórias publicadas.

7. Autorização de projeto está duplicada
   - Locais: documentos, importação, exportação, colaboradores e projetos.
   - Problema: cada fluxo reimplementa dono/colaborador.
   - Impacto: risco de divergência, bugs e brechas.
   - Status: parcialmente concluído em 2026-06-26. Helper criado e aplicado em documentos, colaboradores, importação e exportação; ainda falta expandir para todos os fluxos restantes.

8. Convites de colaborador dão acesso antes do aceite
   - Local: policies e ações que checam `projeto_colaborador.usuario_id`.
   - Problema: a existência da linha já autoriza acesso; `aceito_em` é usado na UI, mas não na autorização.
   - Impacto: usuário convidado pode acessar antes de aceitar.
   - Status: corrigido em 2026-06-26. Acesso de colaborador exige `aceito_em is not null`; convites pendentes continuam visíveis para o dono.

9. Classificação etária não bloqueia usuário sem data de nascimento
   - Local: `src/lib/historias/queries.ts`
   - Problema: `idadeUsuario === null` retorna todos os projetos.
   - Impacto: conteúdo +18 pode aparecer para visitante ou usuário sem idade.
   - Status: corrigido em 2026-06-26. Conteúdo com classificação acima de Livre é ocultado quando a idade é desconhecida.

10. Upload de capa persiste base64 no banco
    - Local: `src/app/[locale]/(painel)/projeto/[id]/editar/page.tsx`
    - Problema: imagem é redimensionada e salva como Data URL em `capa_url`.
    - Impacto: linhas grandes no Postgres, pior performance e ausência de lifecycle de arquivo.
    - Ação: concluir integração com Supabase Storage para bucket `capas`; salvar URL pública no banco.

11. Erros internos são expostos em APIs
    - Locais: importação/exportação e Server Actions.
    - Problema: `error.message` é retornado ao usuário em vários pontos.
    - Impacto: vazamento de detalhe interno e experiência inconsistente.
    - Status: parcialmente corrigido em 2026-06-27 nas APIs de importação/exportação/lock e nas Server Actions de projetos/documentos. Ainda falta revisar colaboradores, comentários, mural, perfil, favoritos e notificações, além de adicionar logging interno estruturado.

12. Validação de entrada ainda é pontual e duplicada
    - Locais: Server Actions e rotas em `src/app/api`.
    - Problema: cada fluxo valida manualmente UUID, payload, status e permissões; outros fluxos aceitam objetos parciais sem schema.
    - Impacto: regras divergentes, mensagens inconsistentes e maior chance de aceitar dados inválidos.
    - Status: parcialmente corrigido em 2026-06-27 nas rotas de importação/exportação/lock e nas Server Actions de projetos/documentos com helpers comuns para UUID e JSON. Próximo passo: definir schemas compartilhados para comentários, colaboradores, mural, perfil, favoritos e notificações.

### P2 - Robustez e qualidade

13. Reordenação de documentos não é transacional
    - Local: `src/lib/documentos/actions.ts`
    - Problema: loop faz múltiplos updates; falha no meio deixa ordem parcial.
    - Impacto: sumário inconsistente.
    - Ação: criar RPC transacional ou update em lote controlado.

14. Auto-save pode perder alteração no unmount
    - Local: `src/components/editor/EditorCapitulo.tsx`
    - Problema: save assíncrono no cleanup não é aguardado; navegação pode cancelar a chamada.
    - Impacto: perda silenciosa de texto.
    - Ação: adicionar `beforeunload` com aviso para pendências, salvar no clique de navegação e reduzir janela de debounce.

15. Logs de debug em produção
    - Local: `src/lib/projetos/actions.ts`
    - Problema: `console.log` e `console.error` em Server Action.
    - Impacto: ruído, possível vazamento de metadados.
    - Ação: remover logs ou encapsular em logger controlado por ambiente.

16. Strings hardcoded e mojibake em arquivos antigos
    - Locais: componentes, migrations antigas, mensagens e comentários.
    - Problema: há strings fora do i18n e arquivos antigos com codificação aparente quebrada.
    - Impacto: UX inconsistente e manutenção ruim.
    - Ação: migrar strings para `pt-BR.json` e normalizar arquivos tocados.

17. `any` e casts escondem inconsistências de dados
    - Locais: queries Supabase, catálogo, favoritos, mural e páginas com dados relacionais.
    - Problema: casts manuais substituem tipos reais e mascaram divergências de schema.
    - Impacto: bugs de runtime continuam escapando da revisão.
    - Ação: depois dos tipos Supabase, substituir casts por tipos derivados e helpers de normalização.

18. Cobertura de testes não protege fluxos críticos
    - Lacunas: publicação, comentários/notificações, leitura atual, importação/exportação, autorização de colaborador, catálogo por idade.
    - Ação: adicionar testes unitários antes/depois de cada correção P0/P1.

### P3 - Limpeza, produto e documentação

19. Assets padrão podem estar sobrando
    - Local: `public/`.
    - Problema: arquivos padrão do scaffold ainda existem e podem não fazer parte da identidade do produto.
    - Impacto: ruído no repositório e risco de uso acidental.
    - Ação: auditar uso dos assets e remover os não utilizados.

20. `plataforma_config` ainda não tem fluxo de uso
    - Local: tabela `plataforma_config`.
    - Problema: o modelo existe, mas não há fluxo claro de leitura/administração.
    - Impacto: tabela sem dono funcional e sem contrato.
    - Ação: decidir se será mantida para feature flags/configurações globais ou removida em migration futura.

21. `bloqueio` existe no banco, mas o produto não aplica a regra
    - Local: tabela `bloqueio`, perfil, comentários e mural.
    - Problema: a estrutura existe, mas não há UI nem enforcement consistente.
    - Impacto: usuários bloqueados podem continuar interagindo se nenhum fluxo consultar a tabela.
    - Ação: especificar regra de bloqueio e aplicar em perfil, mural, comentários, reações e listagens.

22. README/onboarding ainda é mínimo
    - Local: `README.md`.
    - Problema: aponta para o mapa vivo, mas não documenta env vars, Supabase, migrations, testes e setup completo.
    - Impacto: ambiente novo depende de conhecimento externo.
    - Ação: expandir README ou criar guia de onboarding com setup local/remoto.

## Plano por fases

### Fase 1 - Estabilização de runtime

Objetivo: remover bugs que quebram fluxo ou escondem dados.

Escopo:

- Corrigir `comentarios/actions.ts` para usar `dono_id`.
- Corrigir query de `leitura_atual` na home.
- Implementar persistência de progresso de leitura na página de leitura.
- Criar `publicarProjeto` e `despublicarProjeto`.
- Preencher `publicado_em` ao publicar e limpar ou manter ao despublicar conforme regra definida.
- Remover logs de debug.
- Restaurar `playwright.config.ts`.
- Atualizar `docs/ESTADO_DO_PROJETO.md`.

Testes mínimos:

- Unitário para notificação de comentário.
- Unitário para publicação preencher `publicado_em`.
- Unitário ou integração mockada para leitura atual.
- `npm run lint`
- `npm run test`
- `npm run build`

Critério de pronto:

- Criar, publicar e listar história em novidades funciona.
- Comentar em história publicada não quebra e gera notificação para o dono.
- Continuar lendo mostra projeto/documento correto.
- E2E básico está executável.

### Fase 2 - Tipagem, acesso e segurança

Objetivo: reduzir bugs estruturais e centralizar autorização.

Escopo:

- Gerar ou escrever tipos Supabase alinhados às migrations.
- Tipar `criarClienteBrowser` e `criarClienteServidor` com `Database`.
- Criar helper de acesso a projeto.
- Substituir checagens duplicadas em documentos, importação, exportação e colaboradores.
- Decidir e aplicar regra de `aceito_em`.
- Decidir e aplicar regra de classificação etária para visitantes/idade desconhecida.
- Padronizar mensagens de erro públicas.
- Padronizar validação de entrada com schemas compartilhados.
- Aplicar o helper atual de APIs aos endpoints restantes e evoluir para schemas por comando.
- Remover `any` e casts principais conforme os tipos forem gerados.
- Revisar exportação pública vs autenticada.

Testes mínimos:

- Dono acessa projeto.
- Colaborador pendente não acessa, se essa regra for adotada.
- Colaborador aceito acessa.
- Visitante não vê conteúdo restrito por idade, se essa regra for adotada.
- Exportação respeita documentos públicos.

Critério de pronto:

- Novo campo inválido em query passa a falhar no TypeScript.
- Regras de acesso estão em um único módulo.
- Fluxos públicos e autenticados têm comportamento documentado.

### Fase 3 - Storage e mídia

Objetivo: tirar capas do banco e fechar infraestrutura de mídia.

Escopo:

- Criar migration segura para bucket `capas` ou documentar provisionamento idempotente.
- Confirmar o estado real atual do bucket `capas` no ambiente Supabase antes de migrar o fluxo.
- Implementar upload para Supabase Storage.
- Salvar URL pública ou path no `capa_url`.
- Remover Data URL base64 do fluxo novo.
- Definir regra de exclusão/substituição de capa antiga.

Testes mínimos:

- Mock do upload.
- Atualização de capa salva URL.
- Remoção limpa `capa_url`.

Critério de pronto:

- Capas novas não aumentam payload do registro `projeto`.
- Ambientes novos conseguem provisionar bucket sem passo ambíguo.

### Fase 4 - Editor e documentos

Objetivo: melhorar confiabilidade de escrita.

Escopo:

- Criar RPC transacional para reordenar documentos.
- Melhorar auto-save e aviso de alterações pendentes.
- Revisar lock para garantir que colaborador pendente não edite, conforme regra escolhida.
- Avaliar salvamento mais frequente ou explícito ao trocar documento.
- Adicionar feedback de erro recuperável no editor.

Testes mínimos:

- Reordenação parcial não ocorre em caso de erro.
- Editor preserva alteração pendente em navegação controlada.
- Lock perdido deixa editor somente leitura.

Critério de pronto:

- Escrita não perde alteração silenciosamente em caminhos comuns.
- Ordem de documentos é consistente.

### Fase 5 - Produto e UX pendentes

Objetivo: fechar features que já aparecem no modelo/UI.

Escopo:

- Bloqueio entre usuários: definir UI e impacto em perfil, comentários e mural.
- `plataforma_config`: decidir se vira configuração global/feature flags ou se será removida.
- Notificações: adicionar ações para comentário/resposta, links corretos e atualização em tempo real ou polling.
- Favoritos: melhorar feedback e lista com capa/autores.
- Perfil/configurações: incluir `nome_usuario`, `avatar_url`, `data_nascimento` e validações.
- Importação/exportação: adicionar limites de quantidade de capítulos e mensagens de erro mais claras.
- Catálogo: adicionar testes para busca, filtro por tag, paginação e classificação etária.
- Assets públicos: auditar e remover arquivos padrão não usados.
- README/onboarding: documentar env vars, Supabase local/remoto e comandos.

Testes mínimos:

- Testes de componentes para estados vazios, erro e sucesso.
- E2E de cadastro/login, criação/publicação, leitura e comentário.

Critério de pronto:

- Fluxos principais podem ser demonstrados de ponta a ponta sem setup manual não documentado.

## Ordem recomendada de execução

1. Fase 1 completa.
2. Gerar tipos Supabase no início da Fase 2.
3. Centralizar autorização antes de mexer em colaboração/importação/exportação.
4. Resolver Storage antes de investir em melhorias visuais de capas.
5. Melhorar editor depois que acesso, locks e publicação estiverem estáveis.

## Backlog inicial sugerido

1. `bug/comentario-notificacao-dono-id`
2. `bug/home-leitura-atual-schema`
3. `chore/supabase-types`
4. `feature/publicacao-com-publicado-em`
5. `test/restaurar-playwright`
6. `refactor/projeto-acesso-helper`
7. `security/regra-colaborador-aceito`
8. `security/classificacao-etaria-visitante`
9. `feature/storage-capas`
10. `reliability/editor-autosave`
11. `validation/schemas-server-actions-api`
12. `typing/remover-any-casts-supabase`
13. `product/bloqueio-usuarios`
14. `product/plataforma-config-decisao`
15. `test/catalogo-importacao-exportacao`
16. `docs/onboarding-setup`
17. `chore/remover-assets-publicos-nao-usados`
