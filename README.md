# Bookja

Plataforma web para leitura, escrita e publicação de histórias.

Stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (Auth/Database/Storage), TipTap no editor, e bibliotecas de importação/exportação para EPUB, DOCX e PDF. Internacionalização via `next-intl` (atualmente só `pt-BR`, com prefixo de locale obrigatório).

## Documentação viva do projeto

- Estado técnico e funcional atual: [docs/ESTADO_DO_PROJETO.md](docs/ESTADO_DO_PROJETO.md).
- Plano de correções e evolução priorizada: [docs/PLANO_IMPLEMENTACAO.md](docs/PLANO_IMPLEMENTACAO.md).

O `ESTADO_DO_PROJETO.md` deve ser atualizado sempre que houver mudança relevante em rotas, banco, integrações, fluxos, padrões, dependências, pendências ou decisões técnicas.

## Requisitos

- Node.js 20.x (ver `engines` em `package.json`).
- Conta/projeto Supabase (Auth + Postgres + Storage).

## Setup

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env.local` na raiz com as variáveis do seu projeto Supabase:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. Aplique as migrations de `supabase/migrations/` no seu projeto Supabase (Supabase CLI ou SQL Editor do dashboard), em ordem numérica.

   Observação: `008_storage_capas (NAO RODAR).sql` é histórico e não deve ser aplicado. O bucket público `capas` é provisionado pela migration `011_storage_capas.sql`, com policies de escrita escopadas ao dono do projeto.

## Desenvolvimento

```bash
npm run dev
```

A aplicação roda em `http://localhost:3000` e redireciona para o locale `/pt-BR`.

## Validação

```bash
npm run lint      # ESLint
npm run test      # Vitest (unitários e componentes)
npm run build     # build de produção
```

### Testes E2E (Playwright)

A configuração ativa está em `playwright.config.ts` e os specs em `e2e/`.

```bash
npm run test:e2e        # executa os testes E2E
npm run test:e2e:ui     # modo interativo
```

Pré-requisito: navegadores do Playwright instalados (`npx playwright install`) e um `.env.local` válido. O arquivo `playwright.config.ts.bak` é apenas um backup histórico e não é usado.

## Convenções

- Fim de linha normalizado para LF via `.gitattributes` (`* text=auto eol=lf`). Em Windows, isso evita que todo arquivo apareça como modificado por diferença de CRLF.
- App Router agrupado por contexto: `(publico)`, `(auth)`, `(painel)`.
- Mutações e operações autenticadas em Server Actions (`src/lib/*/actions.ts`); uploads, downloads, callback OAuth e `sendBeacon` em rotas API (`src/app/api`).
- Conteúdo de documentos armazenado como JSON compatível com TipTap.
- Autorização principal via RLS no Supabase; helpers de validação e erro público em `src/lib/api`, `src/lib/validacao` e `src/lib/actions`.

## Estrutura

```text
docs/                  # ESTADO_DO_PROJETO.md e PLANO_IMPLEMENTACAO.md
e2e/                   # specs Playwright
public/                # assets estáticos
src/
  app/                 # App Router (rotas localizadas + /api)
  components/          # componentes por domínio e de layout
  hooks/               # hooks client-side
  i18n/                # configuração next-intl
  lib/                 # acesso a dados, Server Actions e utilitários
  messages/            # mensagens pt-BR
  tests/               # testes unitários/componentes
  types/               # tipos compartilhados (database.ts)
supabase/migrations/   # modelo, RLS, RPCs e seeds
```
