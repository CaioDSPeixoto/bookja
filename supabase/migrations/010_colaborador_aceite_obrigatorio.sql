-- ============================================================
-- Colaborador so recebe acesso efetivo apos aceitar convite
-- ============================================================

create or replace function public.eh_colaborador(p_projeto_id uuid, p_usuario_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from projeto_colaborador
    where projeto_id = p_projeto_id
      and usuario_id = p_usuario_id
      and aceito_em is not null
  );
$$;

drop policy if exists "colaborador_update_self_accept" on projeto_colaborador;

create policy "colaborador_update_self_accept" on projeto_colaborador
  for update using (
    usuario_id = auth.uid()
  )
  with check (
    usuario_id = auth.uid()
    and aceito_em is not null
  );

create or replace function public.validar_aceite_colaborador()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.usuario_id then
    if new.projeto_id is distinct from old.projeto_id
      or new.usuario_id is distinct from old.usuario_id
      or new.papel is distinct from old.papel
      or new.convidado_em is distinct from old.convidado_em then
      raise exception 'Convite so pode alterar aceito_em';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validar_aceite_colaborador_trigger on projeto_colaborador;

create trigger validar_aceite_colaborador_trigger
  before update on projeto_colaborador
  for each row execute function public.validar_aceite_colaborador();

revoke execute on function public.validar_aceite_colaborador() from public;
