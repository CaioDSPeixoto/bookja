-- Endurece o SELECT publico de comentario e comentario_reacao.
--
-- As policies anteriores usavam qual = true, tornando todo comentario (e suas
-- reacoes) legivel por qualquer um via PostgREST, inclusive comentarios em
-- projetos com status != 'publicado' ou em capitulos privados/nao publicados.
-- Mesma classe das correcoes 013 (notas/reacoes) e 017 (documento).
--
-- Regra: leitura publica so de comentario cujo projeto esta publicado e, quando
-- o comentario e de um capitulo especifico (documento_id), cujo capitulo esta
-- publico e publicado. Dono e colaborador do projeto mantem acesso amplo.
--
-- mural_comentario/mural_reacao NAO sao alterados: o mural pertence a um perfil
-- publico e nao possui fronteira de publicacao, entao leitura publica e o
-- comportamento pretendido.

drop policy if exists comentario_select_public on comentario;

create policy comentario_select_public on comentario
  for select
  using (
    exists (
      select 1
      from projeto p
      where p.id = comentario.projeto_id
        and (
          (
            p.status = 'publicado'
            and (
              comentario.documento_id is null
              or exists (
                select 1
                from documento d
                where d.id = comentario.documento_id
                  and d.publico = true
                  and d.status = 'publicado'
              )
            )
          )
          or public.eh_dono_projeto(p.id, auth.uid())
          or public.eh_colaborador(p.id, auth.uid())
        )
    )
  );

drop policy if exists reacao_select on comentario_reacao;

create policy reacao_select on comentario_reacao
  for select
  using (
    exists (
      select 1
      from comentario c
      join projeto p on p.id = c.projeto_id
      where c.id = comentario_reacao.comentario_id
        and (
          (
            p.status = 'publicado'
            and (
              c.documento_id is null
              or exists (
                select 1
                from documento d
                where d.id = c.documento_id
                  and d.publico = true
                  and d.status = 'publicado'
              )
            )
          )
          or public.eh_dono_projeto(p.id, auth.uid())
          or public.eh_colaborador(p.id, auth.uid())
        )
    )
  );
