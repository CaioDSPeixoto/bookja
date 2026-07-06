-- Reordenação atômica de documentos de um projeto. Substitui o loop de UPDATEs
-- do app (que deixava a ordem parcialmente aplicada se um update falhasse) por
-- uma única instrução dentro de uma função — tudo ou nada.
-- Recebe um array jsonb [{ "id": uuid, "ordem": int }, ...].

create or replace function public.reordenar_documentos(p_projeto_id uuid, p_ordens jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Apenas dono ou colaborador do projeto pode reordenar.
  if not (
    public.eh_dono_projeto(p_projeto_id, auth.uid())
    or public.eh_colaborador(p_projeto_id, auth.uid())
  ) then
    raise exception 'Sem permissão para reordenar os documentos';
  end if;

  -- Aplica todas as novas ordens de uma vez, restrito aos documentos do projeto.
  update documento d
  set ordem = (elemento->>'ordem')::int
  from jsonb_array_elements(p_ordens) as elemento
  where d.id = (elemento->>'id')::uuid
    and d.projeto_id = p_projeto_id;
end;
$$;

revoke execute on function public.reordenar_documentos(uuid, jsonb) from public;
grant execute on function public.reordenar_documentos(uuid, jsonb) to authenticated;
