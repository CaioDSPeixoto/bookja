-- ============================================================
-- Bookja — Lock atômico via RPC
-- Resolve race condition na aquisição de lock de documento
-- ============================================================

create or replace function public.adquirir_lock_documento(
  p_documento_id uuid,
  p_usuario_id uuid
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_lock record;
  v_nome text;
begin
  -- Lock advisory para evitar race condition entre requests concorrentes
  perform pg_advisory_xact_lock(hashtext(p_documento_id::text));

  select * into v_lock
  from public.documento_lock
  where documento_id = p_documento_id;

  -- Sem lock existente: inserir
  if v_lock is null then
    insert into public.documento_lock (documento_id, travado_por, travado_em, expira_em)
    values (p_documento_id, p_usuario_id, now(), now() + interval '5 minutes');
    return jsonb_build_object('sucesso', true);
  end if;

  -- Lock do mesmo usuário: renovar
  if v_lock.travado_por = p_usuario_id then
    update public.documento_lock
    set expira_em = now() + interval '5 minutes', travado_em = now()
    where documento_id = p_documento_id;
    return jsonb_build_object('sucesso', true);
  end if;

  -- Lock expirado de outro usuário: tomar
  if v_lock.expira_em < now() then
    update public.documento_lock
    set travado_por = p_usuario_id, travado_em = now(), expira_em = now() + interval '5 minutes'
    where documento_id = p_documento_id;
    return jsonb_build_object('sucesso', true);
  end if;

  -- Lock ativo de outro usuário: negar
  select coalesce(nome_usuario, 'Alguém') into v_nome
  from public.perfil
  where id = v_lock.travado_por;

  return jsonb_build_object('sucesso', false, 'travado_por_nome', v_nome);
end;
$$;
