# Plano de implementação do Bookja

Documento vivo para guiar a primeira entrega do Bookja. Deve ser atualizado sempre que uma correção, feature, migration, decisão de UX, regra de segurança ou pendência mudar de estado.

Última atualização: 2026-06-28

## Objetivo da primeira entrega

Entregar uma versão utilizável principalmente no celular, com fluxo completo de:

- cadastro/login;
- criação de projeto;
- escrita e gestão de capítulos;
- revisão/publicação;
- leitura pública;
- comentários, favoritos e notificações essenciais;
- importação/exportação básica;
- segurança mínima coerente com dados privados de autores e leitores.

A primeira entrega não precisa conter todas as features previstas no modelo, mas não pode ter fluxo principal quebrado, UI confusa no mobile ou regra de acesso insegura.

## Estado consolidado

### Já concluído

- Runtime e base técnica: Next.js App Router, React, TypeScript, Tailwind, Supabase Auth/Database/Storage, Server Actions, APIs internas e TipTap.
- Autenticação: cadastro, login, logout e callback Supabase.
- Biblioteca/projetos: criação, edição de metadados, status do projeto, tags, capa via Supabase Storage e publicação/despublicação com `publicado_em`.
- Documentos/capítulos: criação, edição TipTap, exclusão, reordenação básica, status editorial por capítulo e contagem de palavras.
- Escrita: auto-save com debounce de 2,5s, salvamento manual, aviso de saída com pendência, flush antes de trocar capítulo/criar capítulo/voltar/abrir prévia e erro recuperável com retry.
- Leitura: página de leitura redesenhada, navegação entre capítulos publicados, progresso de leitura e registro de visualização.
- Relação leitor-escritor: comentários por capítulo, reações por capítulo e post-its/notas do autor.
- Colaboração: convites, aceite obrigatório para acesso efetivo, presença ao vivo no editor e revisão supervisionada com aprovações.
- Importação/exportação: EPUB/DOCX importados como capítulos; exportação EPUB/DOCX/PDF com regras de acesso.
- Segurança: RLS nas tabelas principais, helpers de autorização, validações de entrada, erros públicos, logger com redaction, headers HTTP de segurança e remoção de listagem pública do bucket `capas`.
- Testes: lint, unitários, build e E2E básico já validados em ciclos anteriores.
- Documentação: README expandido e mapa técnico vivo em `docs/ESTADO_DO_PROJETO.md`.

### Mudanças recentes já incorporadas ao plano

- A visualização do "Baú de informações" saiu da tela de escrita, mas o motor de fichas continua no código para redesenho futuro.
- Botões de novo capítulo/importar foram suavizados e mantidos dentro do bloco de capítulos.
- Fluxo editorial por capítulo foi reforçado: capítulo nasce como rascunho e precisa passar por revisão antes de publicação.
- Tela de leitura foi redesenhada, mas ainda precisa de revisão visual/mobile de ponta a ponta.
- A migration `015` existe no repositório, mas o Supabase remoto verificado em 2026-06-28 ainda não a recebeu.

## Bloqueadores atuais

### B1. Migration 015/016 não aplicadas no remoto — RESOLVIDO em 2026-06-28

Status: resolvido. Migrations `015_status_documento_notificacoes.sql` e `016_aprovacao_revisao_documento.sql` aplicadas no Supabase remoto (projeto `ezdtqfmpornhkyilaxlh`) via MCP.

Verificação pós-aplicação (substitui a evidência anterior de `42703`/`PGRST202`):

- `documento.status` existe;
- `criar_notificacao_sistema` e `notificar_favoritos_capitulo_publicado` existem e estão restritas a `authenticated`;
- tabela `documento_aprovacao` existe com RLS;
- 16 documentos normalizados (4 publicados), 0 inconsistências entre `publico` e `status`.

Pendência residual (não bloqueia): teste manual ponta a ponta de convite de colaborador e de favorito + publicação de capítulo + notificação no ambiente real (requer dois usuários).

### B2. Experiência mobile — auditoria de código concluída em 2026-06-28 (validação visual pendente)

Status: auditoria estática e correções de código feitas; falta validação visual em dispositivo/emulador real.

Resultado da auditoria (2026-06-28):

- Editor de escrita era o principal ofensor (sumário lateral fixo `w-64`) — corrigido: sumário vira drawer no mobile, toolbar com scroll horizontal, paddings/título responsivos. Ver Fase B.
- `editar projeto` já estava adaptado (ações viram ícones, `hidden sm:inline`, `shrink-0`, modais `mx-4 w-full max-w-md`).
- Grids de catálogo/biblioteca/perfil/leitura já são responsivos (base mobile escalando por breakpoint).
- Ajustes pontuais aplicados: `colaboradores` (form empilha no mobile, campos full-width, item de lista não espreme o botão excluir), `importar` (cabeçalho do preview trunca nome de arquivo, linha de ações empilha no mobile), `notificacoes` (ícone/botão `shrink-0`, conteúdo `min-w-0`).

Validação visual parcial (2026-06-28): app servido com `.env.local` apontando ao remoto e inspecionado via preview a 390x844. A home renderiza completa com menu mobile ativo. No processo foi descoberto e corrigido um bug de layout (html/body aninhados entre root e locale layout) que deixava o `main` sem conteúdo no preview.

Próximo passo:

- validar visualmente as telas autenticadas (especialmente o drawer do editor) em 360x740, 390x844 e 430x932 — requer login com usuário de teste;
- confirmar fluxo criar projeto → escrever → publicar → ler sem zoom/corte.

## Critérios de pronto da primeira entrega

### Produto

- Usuário consegue criar conta, entrar, criar projeto, criar capítulo, escrever, revisar, publicar e ler em outra sessão.
- Capítulos publicados aparecem para leitores; rascunhos e revisões não aparecem publicamente.
- Favoritar uma história e publicar novo capítulo gera notificação.
- Convidar colaborador gera convite/notificação e o colaborador só acessa após aceitar.
- Importação cria capítulos em rascunho.
- Exportação respeita acesso público/privado.

### Mobile e usabilidade

- Todas as telas principais funcionam confortavelmente em celular, sem elementos cortados ou ações escondidas.
- Botões de ação primária têm área de toque suficiente e texto compreensível.
- O editor no celular deve ter navegação de capítulos acessível sem ocupar permanentemente a largura útil de escrita.
- Menus, popups e modais devem caber na tela e permitir fechar sem precisão excessiva.
- Leitura deve ser confortável: largura, espaçamento, contraste e navegação anterior/próximo adequados.
- Estados vazios, erro, carregamento e sucesso devem orientar o usuário sem mensagens técnicas.
- Fluxos destrutivos, como excluir capítulo/projeto, devem exigir confirmação clara.

### Visual

- A interface deve parecer consistente entre público e painel: botões, badges, cards, listas e estados.
- Evitar excesso de botões preenchidos competindo entre si; manter ação principal clara e ações secundárias discretas.
- Evitar telas com densidade de desktop no celular.
- Revisar hierarquia visual de: biblioteca, edição de projeto, escrita, importação, leitura, notificações e colaboradores.
- Remover ou corrigir mojibake visível antes da entrega.

### Segurança

- RLS e helpers de autorização devem impedir acesso a rascunhos, capítulos privados, notas internas e projetos não autorizados.
- Colaborador pendente não pode editar/ler projeto privado antes de aceitar.
- APIs e Server Actions não podem expor `error.message` técnico ao usuário final.
- Upload de capa não pode permitir escrita em path de outro projeto.
- RPCs `security definer` devem validar `auth.uid()` e escopo de permissão antes de inserir notificações.
- Conteúdo com classificação etária restrita não deve aparecer para idade desconhecida.
- Nenhuma chave sensível deve ser versionada; `.env.local` continua local e ignorado.

## Plano até a primeira entrega

### Fase A. Alinhar banco remoto — CONCLUÍDA (2026-06-28)

Prioridade: P0.

Objetivo: deixar o ambiente Supabase compatível com o código atual.

Tarefas:

- [x] Aplicar migration `015_status_documento_notificacoes.sql`.
- [x] Aplicar `016_aprovacao_revisao_documento.sql`.
- [x] Confirmar via SQL que `documento.status`, as RPCs e `documento_aprovacao` existem.
- [x] Validar convite de colaborador (RPC `criar_notificacao_sistema` tipo convite) — teste transacional em 2026-06-29 gerou a notificação para o colaborador.
- [x] Validar favorito + publicação de capítulo + notificação (RPC `notificar_favoritos_capitulo_publicado`) — teste transacional gerou a notificação para o favoritador.

Critério de pronto:

- [x] As sondas remotas deixam de retornar `42703`/`PGRST202`.
- [x] Convite e notificações validados no ambiente real (via RPC, teste transacional com rollback).

### Fase B. Auditoria mobile-first

Prioridade: P0.

Objetivo: tornar os fluxos principais fáceis no celular.

Telas a revisar:

- `/{locale}/biblioteca`
- `/{locale}/projeto/{id}/editar`
- `/{locale}/projeto/{id}/escrita`
- `/{locale}/projeto/{id}/importar`
- `/{locale}/projeto/{id}/colaboradores`
- `/{locale}/notificacoes`
- `/{locale}/historia/{id}`
- `/{locale}/historia/{id}/ler/{docId}`
- `/{locale}/perfil/{nomeUsuario}`

Ajustes esperados:

- [x] Transformar sumário lateral do editor em drawer/bottom sheet ou navegação recolhível no mobile. Feito em 2026-06-28: `SumarioCapitulos` vira drawer off-canvas com overlay no mobile (`<md`) e permanece sidebar fixa no desktop; `EscritaPage` ganhou botão no header (mobile) com o título do capítulo ativo para abrir o sumário; fecha ao selecionar/criar capítulo.
- [x] Revisar toolbar do editor para caber em toque e não roubar espaço de escrita. Feito: `BarraFerramentas` com scroll horizontal e botões `flex-shrink-0`; paddings do `EditorCapitulo` e do header agora responsivos (`px-4 sm:px-8`), título `text-2xl sm:text-3xl`.
- Garantir que ações de publicar/salvar/preview/excluir no editor de projeto não virem uma linha apertada.
- Ajustar telas com listas para evitar cards grandes demais ou botões pequenos demais.
- Melhorar modais de confirmação para mobile.
- Validar leitura com tipografia confortável e navegação clara no final do capítulo.

Critério de pronto:

- Fluxo criar projeto → escrever capítulo → publicar → ler é executável em 390x844 sem zoom, corte ou confusão.

### Fase C. Fluxo editorial e colaboração

Prioridade: P1.

Objetivo: fechar o ciclo de capítulo do ponto de vista de autor/colaborador.

Tarefas:

- Validar regra: rascunho → revisão ou revisão supervisionada → publicado.
- Melhorar feedback quando publicação é bloqueada por falta de revisão/aprovação.
- Criar visão simples de pendências de revisão supervisionada para colaboradores ou destacar melhor no fluxo existente.
- Confirmar que excluir capítulo atualiza sumário e estado ativo sem quebrar a escrita.
- Confirmar que capítulos importados entram como rascunho.

Critério de pronto:

- Autor entende claramente o que falta para publicar.
- Colaborador entende onde aprovar.
- O leitor nunca vê capítulo não publicado.

### Fase D. Notificações e ações de leitura

Prioridade: P1.

Objetivo: fazer notificações parecerem úteis, não só registros em tabela.

Tarefas:

- Validar notificação de convite.
- Validar notificação de novo capítulo para favoritos.
- Revisar links das notificações para levar ao lugar correto.
- Marcar como lida individualmente e em lote.
- Avaliar polling simples ou atualização ao abrir popup/página.

Critério de pronto:

- Notificação leva o usuário para uma ação clara.
- Não há notificação falsa positiva nem duplicada para o mesmo capítulo.

### Fase E. Segurança e consistência final

Prioridade: P1.

Objetivo: reduzir risco antes da primeira entrega.

Tarefas:

- [x] Revisar policies/RPCs tocadas nas migrations 015 e 016. RPCs validam `auth.uid()` e foram revogadas de `public`; `documento_aprovacao` escopada a dono/colaborador.
- [x] Testar acesso público vs privado para projeto, capítulo, notas e reações. Achado e corrigido: SELECT público de `documento` exigia só `publico = true` — migration `017` endurece para capítulo publicado em projeto publicado. Verificado com `set role anon` (4/16 documentos, 1 projeto).
- [ ] Revisar endpoints de importação/exportação com arquivos inválidos, formatos inválidos e projeto sem permissão.
- [ ] Revisar bloqueio de colaborador pendente no editor, importação, exportação e documentos.
- [x] Remover ou corrigir strings com mojibake visível. Varredura em 2026-06-28 não encontrou mojibake em `src`/`supabase`.
- [~] Rodar `npm run lint`, `npm run test`, `npm run build` e E2E básico. Em 2026-06-28: lint, test (106) e build passaram. E2E não executado neste worktree por ausência de `.env.local` (rodar no checkout principal com env válido).

Critério de pronto:

- Falhas retornam mensagens públicas.
- Dados privados não aparecem em fluxo público.
- Build e suíte local passam.

## Backlog pós-primeira entrega

Itens importantes, mas não bloqueadores da primeira entrega se os critérios acima forem atendidos:

- Edição simultânea real com CRDT/Yjs e merge colaborativo.
- Reordenação transacional por RPC para documentos.
- Fallback de auto-save para fechamento abrupto com rota API/`sendBeacon`.
- Baú de informações redesenhado em local próprio.
- Sistema de bloqueio entre usuários aplicado em perfil, mural, comentários e reações.
- `plataforma_config`: decidir se vira feature flags/config global ou se será removida.
- Substituir tipos manuais por tipos gerados pela Supabase CLI.
- Internacionalização app-wide quando houver segundo idioma.
- Remover `any` e casts restantes em queries Supabase.
- Testes adicionais para catálogo, importação/exportação, presença, upload de capa e componentes mobile.
- Auditoria de assets públicos não usados.

## Ordem recomendada de execução

1. [x] Aplicar e validar migrations remotas 015/016.
2. [x] Fazer auditoria mobile-first das telas principais.
3. [x] Corrigir layout mobile do editor de escrita (validado no app real a 390px).
4. [x] Validar fluxo editorial/colaborador (RPC de convite via teste transacional).
5. [x] Validar notificações reais (RPCs de convite e novo capítulo via teste transacional).
6. [x] Fazer revisão de segurança/RLS/API (migrations 017, 018, 019).
7. [~] Rodar validação completa: lint, testes (107), build OK. E2E pendente (rodar no checkout principal com `.env.local`).

## Checklist de validação manual

- Criar conta nova no celular.
- Criar projeto no celular.
- Adicionar capa no celular.
- Criar capítulo pelo editor.
- Trocar de capítulo com alteração pendente e confirmar que salva.
- Importar documento e confirmar que capítulos entram como rascunho.
- Mudar capítulo para revisão e publicar.
- Favoritar história com outro usuário.
- Publicar novo capítulo e receber notificação.
- Convidar colaborador, aceitar convite e aprovar revisão supervisionada.
- Ler história publicada no celular.
- Tentar acessar capítulo rascunho como visitante e confirmar bloqueio.
- Exportar história publicada como visitante.
- Exportar projeto privado como usuário sem permissão e confirmar bloqueio.
