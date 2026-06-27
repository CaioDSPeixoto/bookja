-- Bucket publico nao precisa de SELECT amplo em storage.objects: as URLs publicas
-- (/object/public/capas/...) funcionam sem policy. A policy ampla permitia LISTAR
-- todos os arquivos do bucket. Removida. Insert/update/delete (dono) permanecem.
-- Idempotente.
drop policy if exists "capas_leitura_publica" on storage.objects;
