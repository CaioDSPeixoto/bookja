create or replace function incrementar_visualizacao(p_projeto_id uuid, p_usuario_id uuid default null)
returns void
language plpgsql
security definer
as $$
begin
  insert into projeto_visualizacao (projeto_id, usuario_id) values (p_projeto_id, p_usuario_id);
  update projeto set contagem_visualizacoes = contagem_visualizacoes + 1 where id = p_projeto_id;
end;
$$;
