-- Endurece o SELECT publico de documento.
--
-- A policy anterior (documento_select_publico) exigia apenas publico = true,
-- sem checar o status editorial do capitulo nem se o projeto pai esta publicado.
-- Isso permitia, via PostgREST direto, ler capitulos em rascunho/revisao marcados
-- publico = true, ou capitulos de projetos despublicados (onde os documentos
-- continuam publico = true). A pagina de leitura ja filtrava por status no app,
-- mas o RLS e a barreira real. Alinha o padrao com 013 (notas/reacoes) e com a
-- query da pagina de leitura: leitura publica exige capitulo publicado em projeto
-- publicado. Dono e colaborador seguem com acesso amplo pelas outras policies.

drop policy if exists documento_select_publico on documento;

create policy documento_select_publico on documento
  for select
  using (
    publico = true
    and status = 'publicado'
    and exists (
      select 1
      from projeto p
      where p.id = documento.projeto_id
        and p.status = 'publicado'
    )
  );
