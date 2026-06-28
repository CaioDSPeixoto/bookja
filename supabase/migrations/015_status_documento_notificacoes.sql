-- Status editorial por documento e notificacoes internas seguras.

alter table documento
  add column if not exists status text not null default 'rascunho';

alter table documento
  drop constraint if exists documento_status_check;

alter table documento
  add constraint documento_status_check
  check (status in ('rascunho', 'revisao', 'revisao_supervisionada', 'publicado'));

update documento
set status = case when publico then 'publicado' else 'rascunho' end
where status is null
   or (publico = true and status <> 'publicado')
   or (publico = false and status = 'publicado');

create index if not exists idx_documento_status_publicacao
  on documento(projeto_id, status, ordem);

create or replace function public.criar_notificacao_sistema(
  p_usuario_id uuid,
  p_tipo text,
  p_projeto_id uuid default null,
  p_documento_id uuid default null,
  p_comentario_id uuid default null,
  p_mensagem text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_atual uuid := auth.uid();
begin
  if v_usuario_atual is null then
    raise exception 'autenticacao necessaria';
  end if;

  if p_usuario_id is null or coalesce(trim(p_tipo), '') = '' or coalesce(trim(p_mensagem), '') = '' then
    raise exception 'notificacao invalida';
  end if;

  if p_tipo = 'convite' then
    if not exists (
      select 1
      from projeto p
      join projeto_colaborador pc
        on pc.projeto_id = p.id
       and pc.usuario_id = p_usuario_id
      where p.id = p_projeto_id
        and p.dono_id = v_usuario_atual
    ) then
      raise exception 'sem permissao para notificar convite';
    end if;
  elsif p_tipo = 'comentario' then
    if not exists (
      select 1
      from projeto p
      where p.id = p_projeto_id
        and p.dono_id = p_usuario_id
        and p.status = 'publicado'
        and p.dono_id <> v_usuario_atual
    ) then
      raise exception 'sem permissao para notificar comentario';
    end if;
  else
    raise exception 'tipo de notificacao invalido';
  end if;

  insert into notificacao (
    usuario_id,
    tipo,
    projeto_id,
    documento_id,
    comentario_id,
    mensagem
  )
  values (
    p_usuario_id,
    p_tipo,
    p_projeto_id,
    p_documento_id,
    p_comentario_id,
    trim(p_mensagem)
  );
end;
$$;

create or replace function public.notificar_favoritos_capitulo_publicado(
  p_projeto_id uuid,
  p_documento_id uuid,
  p_mensagem text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_atual uuid := auth.uid();
begin
  if v_usuario_atual is null then
    raise exception 'autenticacao necessaria';
  end if;

  if not exists (
    select 1
    from documento d
    join projeto p on p.id = d.projeto_id
    where d.id = p_documento_id
      and d.projeto_id = p_projeto_id
      and d.status = 'publicado'
      and d.publico = true
      and p.status = 'publicado'
      and (
        p.dono_id = v_usuario_atual
        or public.eh_colaborador(p.id, v_usuario_atual)
      )
  ) then
    raise exception 'sem permissao para notificar novo capitulo';
  end if;

  insert into notificacao (usuario_id, tipo, projeto_id, documento_id, mensagem)
  select f.usuario_id, 'novo_capitulo', p_projeto_id, p_documento_id, trim(p_mensagem)
  from favorito f
  where f.projeto_id = p_projeto_id
    and f.usuario_id <> v_usuario_atual
    and not exists (
      select 1
      from notificacao n
      where n.usuario_id = f.usuario_id
        and n.tipo = 'novo_capitulo'
        and n.documento_id = p_documento_id
    );
end;
$$;

revoke execute on function public.criar_notificacao_sistema(uuid, text, uuid, uuid, uuid, text) from public;
grant execute on function public.criar_notificacao_sistema(uuid, text, uuid, uuid, uuid, text) to authenticated;

revoke execute on function public.notificar_favoritos_capitulo_publicado(uuid, uuid, text) from public;
grant execute on function public.notificar_favoritos_capitulo_publicado(uuid, uuid, text) to authenticated;
