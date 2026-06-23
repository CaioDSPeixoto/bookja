-- ============================================================
-- FIX: Infinite recursion between projeto <-> projeto_colaborador
-- Solução: dropar policies problemáticas e recriar usando
-- security definer functions que bypassam RLS
-- ============================================================

-- Função helper que bypassa RLS para checar se user é colaborador
create or replace function public.eh_colaborador(p_projeto_id uuid, p_usuario_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from projeto_colaborador
    where projeto_id = p_projeto_id and usuario_id = p_usuario_id
  );
$$;

-- Função helper que bypassa RLS para checar se user é dono
create or replace function public.eh_dono_projeto(p_projeto_id uuid, p_usuario_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from projeto
    where id = p_projeto_id and dono_id = p_usuario_id
  );
$$;

-- Drop policies que causam recursão
drop policy if exists "projeto_select_colaborador" on projeto;
drop policy if exists "colaborador_select_own_project" on projeto_colaborador;
drop policy if exists "colaborador_insert_owner" on projeto_colaborador;
drop policy if exists "colaborador_delete_owner" on projeto_colaborador;
drop policy if exists "documento_select_own_project" on documento;
drop policy if exists "documento_select_colaborador" on documento;
drop policy if exists "documento_insert_own_project" on documento;
drop policy if exists "documento_update_own_project" on documento;
drop policy if exists "documento_delete_own_project" on documento;
drop policy if exists "projeto_tag_insert_owner" on projeto_tag;
drop policy if exists "projeto_tag_delete_owner" on projeto_tag;
drop policy if exists "visualizacao_select_owner" on projeto_visualizacao;

-- Recriar sem recursão usando as functions security definer

-- PROJETO: colaborador pode ver
create policy "projeto_select_colaborador" on projeto
  for select using (public.eh_colaborador(id, auth.uid()));

-- PROJETO_COLABORADOR
create policy "colaborador_select_own_project" on projeto_colaborador
  for select using (
    usuario_id = auth.uid()
    or public.eh_dono_projeto(projeto_id, auth.uid())
  );

create policy "colaborador_insert_owner" on projeto_colaborador
  for insert with check (
    public.eh_dono_projeto(projeto_id, auth.uid())
  );

create policy "colaborador_delete_owner" on projeto_colaborador
  for delete using (
    public.eh_dono_projeto(projeto_id, auth.uid())
  );

-- DOCUMENTO
create policy "documento_select_own_project" on documento
  for select using (
    public.eh_dono_projeto(projeto_id, auth.uid())
  );

create policy "documento_select_colaborador" on documento
  for select using (
    public.eh_colaborador(projeto_id, auth.uid())
  );

create policy "documento_insert_own_project" on documento
  for insert with check (
    public.eh_dono_projeto(projeto_id, auth.uid())
    or public.eh_colaborador(projeto_id, auth.uid())
  );

create policy "documento_update_own_project" on documento
  for update using (
    public.eh_dono_projeto(projeto_id, auth.uid())
    or public.eh_colaborador(projeto_id, auth.uid())
  );

create policy "documento_delete_own_project" on documento
  for delete using (
    public.eh_dono_projeto(projeto_id, auth.uid())
  );

-- PROJETO_TAG
create policy "projeto_tag_insert_owner" on projeto_tag
  for insert with check (
    public.eh_dono_projeto(projeto_id, auth.uid())
  );

create policy "projeto_tag_delete_owner" on projeto_tag
  for delete using (
    public.eh_dono_projeto(projeto_id, auth.uid())
  );

-- PROJETO_VISUALIZACAO
create policy "visualizacao_select_owner" on projeto_visualizacao
  for select using (
    public.eh_dono_projeto(projeto_id, auth.uid())
  );
