# Status do Bookja — planejamento e tratativas

Snapshot do andamento do projeto. Complementa os documentos vivos:
[ESTADO_DO_PROJETO.md](ESTADO_DO_PROJETO.md) (mapa técnico) e
[PLANO_IMPLEMENTACAO.md](PLANO_IMPLEMENTACAO.md) (plano da 1ª entrega).

Última atualização: 2026-07-08.

## Resumo executivo

O projeto está em **estado de lançamento** para uma 1ª entrega no plano Free.
Sobre o MVP funcional, esta fase adicionou uma camada de **features de valor,
performance e endurecimento** — tudo commitado, **deployado (Vercel verde)** e
verificado onde foi possível automatizar. O banco remoto (`ezdtqfmpornhkyilaxlh`)
está alinhado às migrations 015→028.

Destaques recentes: busca com debounce (título/sinopse/autor), filtro por múltiplas
tags, avaliação por estrelas dedicada, progresso de leitura nos cards, edição de
comentários (obra + mural), **denúncia/moderação** (`/moderacao`), **otimização de
imagens** (AVIF/WebP), **PWA completo** (offline + instalação), **reordenação
transacional** de capítulos, **tipos gerados** do Supabase e acessibilidade ampla.

Não há pendências de **alta prioridade** em aberto. O caminho crítico restante é
**validação humana** (checagem visual + realtime em 2 navegadores; passada mobile
em device físico) — não código. Os fluxos de colaboração, notificação, bloqueio e
denúncia já foram validados no nível **banco/RLS/RPC** com 2 usuários reais.

Qualidade contínua: a cada bloco de mudança rodou `npm run lint`, `npm run test`
(119) e `npm run build` com sucesso.

---

## ✅ Concluído

### Banco remoto e segurança (RLS)
- Migrations 015/016 aplicadas no remoto (status editorial por capítulo, RPCs de
  notificação, aprovação de revisão supervisionada) — desbloqueio do `42703`/`PGRST202`.
- **017** — SELECT público de `documento` exige capítulo publicado em projeto publicado.
- **018** — dono não pode favoritar a própria história (UI + action + RLS).
- **019** — SELECT de `comentario`/`comentario_reacao` restrito a conteúdo publicado ou dono/colaborador.
- **020** — tags duplicadas removidas + índice único case-insensitive.
- **021** — uma avaliação por usuário por projeto (índice único parcial).
- **022** — recálculo de avaliação atômico via RPC `recalcular_avaliacao_projeto`.
- **023** — `data_nascimento` movida para `perfil_privado` (privacidade; coluna pública removida).
- **024** — `notificacao` no Realtime.
- **025** — RPC `existe_bloqueio` para bloqueio recíproco.
- **026** — normalização de nomes de usuário legados inválidos (corrige 404 de perfil).
- Verificações de RLS feitas com `set role anon` e testes transacionais com rollback.

### Mobile e usabilidade
- Editor de escrita: sumário vira **drawer** no mobile; toolbar com scroll horizontal; barra inferior compacta.
- Menu mobile: abre pela direita, com cabeçalho de usuário, ícones e animação; mostra "Meu perfil" e "Sair".
- "Configurações" passou a ser **"Editar perfil"** acessada pelo perfil (não item de menu solto).
- Catálogo: filtro de tags **recolhível** (fim do paredão de tags) + **scroll infinito**.
- Skeletons de carregamento (catálogo, história, perfil).

### Visual
- Linguagem unificada (cards `rounded-2xl`, sombra, paleta **indigo/violeta**; zero `blue-`).
- Redesenho de entrar, cadastro, perfil, detalhe da história, home, catálogo, configurações,
  favoritos, documentos, prévia e componentes (CardHistoria, comentários, mural, reações, popup).
- Correção de bug de layout: `<html>/<body>` aninhados entre root e locale layout.
- **Otimização de imagens** (`next/image` nativo da Vercel): removido `unoptimized` de capas/avatares; `sizes` responsivo + `srcset`, AVIF/WebP e lazy-loading; `priority` na capa da obra (LCP). Impacto direto em performance mobile.

### Funcionalidades
- Perfil: cards de histórias com **capa, nota e visualizações**; cadastro valida nome de usuário.
- Painel "Meus Projetos": visualizações, nota média e nº de comentários por card.
- **Progresso de leitura** na página da história (barra + continuar lendo).
- **PWA**: manifest standalone, ícone, theme-color, meta Apple **+ service worker offline** (`public/sw.js`, sem dependências): shell e assets em cache, navegação network-first com fallback offline; registrado só em produção. **Botão de instalação** (`beforeinstallprompt`) discreto no header, com dispensa persistida. **Página offline dedicada** (`public/offline.html`) precacheada e servida no fallback.
- **Notificações em tempo real** (#19).
- **Bloqueio entre usuários** (#20): bloquear/desbloquear no perfil; oculta conteúdo **e reações** de bloqueados; impede post no mural.
- **Leitura**: barra de capítulos do topo removida, reações movidas para baixo, "Bastidores" recolhível.
- **Obra**: data de publicação por capítulo + nota exibida; **notificações** com nome da obra/capítulo e link clicável.
- **Loading**: overlay bloqueante em entrar/cadastro; loading no "Sair".
- **Avaliação por estrelas dedicada**: widget na página da história que salva na hora, separado do comentário.
- **Progresso de leitura no card** do catálogo **e favoritos** (barra sobre a capa; favoritos padronizados com `CardHistoria`).
- **Busca com debounce** no catálogo, casando título, sinopse **e autor**.
- **Filtro por múltiplas tags** (semântica E: história precisa ter todas as selecionadas), com compat de link antigo.
- **Acessibilidade**: `aria-label` em botões só de ícone (favoritar, reações, excluir, notificações, mural) **e no editor** (toolbar de formatação, sumário, baú de informações, ficha, cabeçalho da escrita), com `aria-pressed`/`aria-expanded` em toggles e `aria-hidden` nos ícones.
- **Edição de comentários**: autor edita o próprio comentário inline (na obra **e no mural**), com marca "editado".
- **Tipos do Supabase gerados** (substituem os manuais frouxos): `src/types/database.ts` canônico; estreitamentos de tipo corrigidos no app.
- **Denúncia/moderação de conteúdo**: botão de denunciar em comentários e mural; tabela `denuncia` + RLS (migration 027); painel `/moderacao` restrito a admin (`papel = 'admin'`).
- **Reordenação transacional de capítulos** (migration 028): RPC `reordenar_documentos` aplica todas as ordens de uma vez (tudo ou nada), no lugar do loop de UPDATEs que podia deixar a ordem parcialmente aplicada.
- Correções: autosave 500 em capítulos importados (`eJson` tolera `undefined`); criação de projeto com coautor não trava mais; fundo cinza p/ contraste dos cards; `engines` em Node 24.
- Correções: avaliação recalculada ao excluir comentário; favoritos despublicados ocultados.

---

## ⏳ Pendente

### Validações manuais (precisam de ambiente real / 2 contas)
- ✅ **Nível banco/RLS/RPC validado** com 2 usuários reais (2026-07-07): colaborador (convite→aceite→aprovar + guards), notificação de novo capítulo, bloqueio (`existe_bloqueio` + lista) e denúncia/moderação (visibilidade + resolver + duplicata). Usuários de teste criados e deletados.
- Falta só o que não dá por SQL: **entrega realtime no navegador** (websocket do popup) e **render visual** desses fluxos logado (2 navegadores).
- Passada **visual mobile** ampla em dispositivo físico (telas autenticadas).
- **E2E (Playwright)** no checkout principal (com `.env.local`).

### Configuração (fora do código)
- ✅ **Admin concedido** à conta `caiowinrar@gmail.com` (acesso ao `/moderacao`). Para outros: `update perfil set papel = 'admin' where nome_usuario = '<usuario>';`
- **Leaked Password Protection**: **Pro-only** — indisponível no plano Free atual. Reavaliar ao migrar para Pro. No Free, dá para exigir comprimento mínimo/caracteres de senha na mesma tela (Auth → Providers → Email).
- Sincronizar a `main` **local** no diretório principal (`git stash` + `git pull`) — está atrás do remoto.

---

## 🔭 Ajustes e ideias futuras (backlog)

### Médio prazo
- Moderação: enriquecer o painel com prévia do conteúdo denunciado e ação de remover direto.

### Maior esforço
- Edição simultânea real (CRDT/Yjs) no editor.
- `plataforma_config`: tabela key-value criada na migration 001, **sem uso no código e vazia** (scaffolding morto). Decidir: virar sistema de feature flags ou **remover**.
- Internacionalização app-wide quando houver 2º idioma.

---

## Migrations aplicadas no remoto (histórico recente)

`015` status/notificações · `016` aprovação revisão · `017` RLS documento ·
`018` favorito não-dono · `019` RLS comentário · `020` dedup tags ·
`021` 1 avaliação/usuário · `022` RPC avaliação · `023` perfil_privado ·
`024` realtime notificação · `025` helper bloqueio · `026` normaliza usernames legados ·
`027` denúncias + helper `eh_admin` · `028` RPC reordenação atômica.

Repositório e banco remoto estão sincronizados.

## Como validar

```bash
npm run lint
npm run test
npm run build
npm run test:e2e   # requer .env.local e navegadores do Playwright
```
