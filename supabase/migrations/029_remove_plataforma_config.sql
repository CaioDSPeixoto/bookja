-- Remove a tabela plataforma_config: criada na 001 como key-value para configs
-- globais, nunca foi usada pelo app (0 referências no código) e estava vazia.
-- A policy config_select é removida junto com a tabela.

drop table if exists public.plataforma_config;
