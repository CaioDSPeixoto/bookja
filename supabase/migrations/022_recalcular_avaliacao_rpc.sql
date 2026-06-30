-- Recalcula a avaliação de um projeto de forma atômica (uma única instrução),
-- evitando divergências sob concorrência que existiam ao recalcular no app
-- (ler todas as notas e depois atualizar em chamadas separadas).
-- É idempotente e só grava o valor correto derivado de `comentario`, então pode
-- ser chamada por qualquer usuário autenticado sem risco.

create or replace function public.recalcular_avaliacao_projeto(p_projeto_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update projeto p
  set contagem_avaliacoes = sub.cnt,
      media_avaliacao = sub.media
  from (
    select
      count(*) as cnt,
      coalesce(round(avg(nota)::numeric, 1), 0) as media
    from comentario
    where projeto_id = p_projeto_id and nota is not null
  ) sub
  where p.id = p_projeto_id;
$$;

revoke execute on function public.recalcular_avaliacao_projeto(uuid) from public;
grant execute on function public.recalcular_avaliacao_projeto(uuid) to authenticated;
