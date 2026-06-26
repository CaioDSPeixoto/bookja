# Bookja

Plataforma web para leitura, escrita e publicação de histórias.

## Documentação obrigatória do estado do projeto

O mapa vivo do projeto fica em [docs/ESTADO_DO_PROJETO.md](docs/ESTADO_DO_PROJETO.md).

Esse documento deve ser atualizado sempre que houver mudança relevante em rotas, banco, integrações, fluxos, padrões, dependências, pendências ou decisões técnicas.

## Desenvolvimento

```bash
npm run dev
```

A aplicação roda em `http://localhost:3000`.

## Validação

```bash
npm run lint
npm run test
npm run build
```

O script E2E existe como `npm run test:e2e`, mas a configuração Playwright atual está em `playwright.config.ts.bak` e precisa ser revisada antes de considerar E2E como validado.
