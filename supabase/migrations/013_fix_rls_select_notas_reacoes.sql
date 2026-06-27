-- Corrige vazamento: o select aberto (using true) em 012 expunha notas/reacoes
-- de capitulos em rascunho. Restringe leitura a capitulos publicos de projetos
-- publicados, ou ao dono/colaborador do projeto. Idempotente.

drop policy if exists "documento_nota_select" on documento_nota;
create policy "documento_nota_select" on documento_nota for select using (
  exists (
    select 1 from documento d join projeto p on p.id = d.projeto_id
    where d.id = documento_nota.documento_id and d.publico = true and p.status = 'publicado'
  )
  or exists (
    select 1 from documento d
    where d.id = documento_nota.documento_id
      and (public.eh_dono_projeto(d.projeto_id, auth.uid()) or public.eh_colaborador(d.projeto_id, auth.uid()))
  )
);

drop policy if exists "documento_reacao_select" on documento_reacao;
create policy "documento_reacao_select" on documento_reacao for select using (
  exists (
    select 1 from documento d join projeto p on p.id = d.projeto_id
    where d.id = documento_reacao.documento_id and d.publico = true and p.status = 'publicado'
  )
  or exists (
    select 1 from documento d
    where d.id = documento_reacao.documento_id
      and (public.eh_dono_projeto(d.projeto_id, auth.uid()) or public.eh_colaborador(d.projeto_id, auth.uid()))
  )
);
