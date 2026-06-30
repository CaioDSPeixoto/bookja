-- Helper para verificar bloqueio entre dois usuários sem expor a lista de
-- bloqueios de terceiros (o RLS de `bloqueio` só permite ver os próprios).
-- Usado, por exemplo, para impedir que alguém bloqueado escreva no mural de quem
-- o bloqueou (verificação recíproca que o autor não conseguiria fazer via SELECT).

create or replace function public.existe_bloqueio(p_bloqueador uuid, p_bloqueado uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from bloqueio
    where bloqueador_id = p_bloqueador and bloqueado_id = p_bloqueado
  );
$$;

revoke execute on function public.existe_bloqueio(uuid, uuid) from public;
grant execute on function public.existe_bloqueio(uuid, uuid) to authenticated;
