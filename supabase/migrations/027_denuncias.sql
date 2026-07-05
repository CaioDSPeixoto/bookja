-- ============================================================
-- Denúncias de conteúdo — permite marcar comentários, mensagens
-- de mural ou projetos para moderação por administradores.
-- ============================================================

create table denuncia (
  id uuid primary key default gen_random_uuid(),
  denunciante_id uuid not null references perfil(id) on delete cascade,
  tipo_alvo text not null check (tipo_alvo in ('comentario', 'mural', 'projeto')),
  alvo_id uuid not null,
  motivo text not null,
  resolvida boolean not null default false,
  criado_em timestamptz not null default now(),
  resolvida_em timestamptz
);
comment on table denuncia is 'Denúncias de conteúdo para moderação';

-- Uma denúncia por usuário para cada alvo (evita spam de denúncias).
create unique index idx_denuncia_unica on denuncia (denunciante_id, tipo_alvo, alvo_id);
-- Consulta eficiente das pendentes (fila de moderação).
create index idx_denuncia_pendentes on denuncia (criado_em desc) where not resolvida;

-- Moderador = perfil com papel 'admin'. SECURITY DEFINER para uso em policies.
create or replace function public.eh_admin(p_usuario_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from perfil where id = p_usuario_id and papel = 'admin'
  );
$$;
revoke execute on function public.eh_admin(uuid) from public;
grant execute on function public.eh_admin(uuid) to authenticated;

alter table denuncia enable row level security;

-- Qualquer autenticado registra a própria denúncia.
create policy denuncia_inserir on denuncia
  for insert with check (auth.uid() = denunciante_id);

-- Denunciante vê as suas; admin vê todas.
create policy denuncia_ler on denuncia
  for select using (
    auth.uid() = denunciante_id or public.eh_admin(auth.uid())
  );

-- Apenas admin resolve (atualiza) denúncias.
create policy denuncia_atualizar on denuncia
  for update using (public.eh_admin(auth.uid()));
