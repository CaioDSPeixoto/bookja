-- ============================================================
-- Bookja — RLS Policies
-- CRÍTICO: 001 habilitou RLS sem policies, bloqueando TODO acesso
-- via anon key. Sem policies, o Supabase NEGA tudo por padrão.
-- ============================================================

-- ============================================================
-- PERFIL
-- ============================================================
create policy "perfil_select_own" on perfil
  for select using (auth.uid() = id);

create policy "perfil_select_public" on perfil
  for select using (true);

create policy "perfil_update_own" on perfil
  for update using (auth.uid() = id);

-- ============================================================
-- PROJETO
-- ============================================================
create policy "projeto_select_own" on projeto
  for select using (dono_id = auth.uid());

create policy "projeto_select_colaborador" on projeto
  for select using (
    exists (
      select 1 from projeto_colaborador
      where projeto_colaborador.projeto_id = projeto.id
        and projeto_colaborador.usuario_id = auth.uid()
    )
  );

create policy "projeto_select_publicado" on projeto
  for select using (status = 'publicado');

create policy "projeto_insert_own" on projeto
  for insert with check (dono_id = auth.uid());

create policy "projeto_update_own" on projeto
  for update using (dono_id = auth.uid());

create policy "projeto_delete_own" on projeto
  for delete using (dono_id = auth.uid());

-- ============================================================
-- PROJETO_COLABORADOR
-- ============================================================
create policy "colaborador_select_own_project" on projeto_colaborador
  for select using (
    usuario_id = auth.uid()
    or exists (
      select 1 from projeto where projeto.id = projeto_colaborador.projeto_id and projeto.dono_id = auth.uid()
    )
  );

create policy "colaborador_insert_owner" on projeto_colaborador
  for insert with check (
    exists (
      select 1 from projeto where projeto.id = projeto_colaborador.projeto_id and projeto.dono_id = auth.uid()
    )
  );

create policy "colaborador_delete_owner" on projeto_colaborador
  for delete using (
    exists (
      select 1 from projeto where projeto.id = projeto_colaborador.projeto_id and projeto.dono_id = auth.uid()
    )
  );

-- ============================================================
-- DOCUMENTO
-- ============================================================
create policy "documento_select_own_project" on documento
  for select using (
    exists (
      select 1 from projeto where projeto.id = documento.projeto_id and projeto.dono_id = auth.uid()
    )
  );

create policy "documento_select_colaborador" on documento
  for select using (
    exists (
      select 1 from projeto_colaborador
      where projeto_colaborador.projeto_id = documento.projeto_id
        and projeto_colaborador.usuario_id = auth.uid()
    )
  );

create policy "documento_select_publico" on documento
  for select using (publico = true);

create policy "documento_insert_own_project" on documento
  for insert with check (
    exists (
      select 1 from projeto where projeto.id = documento.projeto_id and projeto.dono_id = auth.uid()
    )
    or exists (
      select 1 from projeto_colaborador
      where projeto_colaborador.projeto_id = documento.projeto_id
        and projeto_colaborador.usuario_id = auth.uid()
    )
  );

create policy "documento_update_own_project" on documento
  for update using (
    exists (
      select 1 from projeto where projeto.id = documento.projeto_id and projeto.dono_id = auth.uid()
    )
    or exists (
      select 1 from projeto_colaborador
      where projeto_colaborador.projeto_id = documento.projeto_id
        and projeto_colaborador.usuario_id = auth.uid()
    )
  );

create policy "documento_delete_own_project" on documento
  for delete using (
    exists (
      select 1 from projeto where projeto.id = documento.projeto_id and projeto.dono_id = auth.uid()
    )
  );

-- ============================================================
-- DOCUMENTO_LOCK
-- ============================================================
create policy "lock_select_all_authenticated" on documento_lock
  for select using (auth.uid() is not null);

create policy "lock_insert_authenticated" on documento_lock
  for insert with check (travado_por = auth.uid());

create policy "lock_update_own" on documento_lock
  for update using (travado_por = auth.uid());

create policy "lock_delete_own" on documento_lock
  for delete using (travado_por = auth.uid());

-- ============================================================
-- TAG (leitura pública)
-- ============================================================
create policy "tag_select_all" on tag
  for select using (true);

-- ============================================================
-- PROJETO_TAG
-- ============================================================
create policy "projeto_tag_select" on projeto_tag
  for select using (true);

create policy "projeto_tag_insert_owner" on projeto_tag
  for insert with check (
    exists (
      select 1 from projeto where projeto.id = projeto_tag.projeto_id and projeto.dono_id = auth.uid()
    )
  );

create policy "projeto_tag_delete_owner" on projeto_tag
  for delete using (
    exists (
      select 1 from projeto where projeto.id = projeto_tag.projeto_id and projeto.dono_id = auth.uid()
    )
  );

-- ============================================================
-- COMENTARIO
-- ============================================================
create policy "comentario_select_public" on comentario
  for select using (true);

create policy "comentario_insert_authenticated" on comentario
  for insert with check (autor_id = auth.uid());

create policy "comentario_update_own" on comentario
  for update using (autor_id = auth.uid());

create policy "comentario_delete_own" on comentario
  for delete using (autor_id = auth.uid());

-- ============================================================
-- COMENTARIO_REACAO
-- ============================================================
create policy "reacao_select" on comentario_reacao
  for select using (true);

create policy "reacao_insert_own" on comentario_reacao
  for insert with check (usuario_id = auth.uid());

create policy "reacao_delete_own" on comentario_reacao
  for delete using (usuario_id = auth.uid());

-- ============================================================
-- PROJETO_VISUALIZACAO
-- ============================================================
create policy "visualizacao_insert_authenticated" on projeto_visualizacao
  for insert with check (auth.uid() is not null);

create policy "visualizacao_select_owner" on projeto_visualizacao
  for select using (
    exists (
      select 1 from projeto where projeto.id = projeto_visualizacao.projeto_id and projeto.dono_id = auth.uid()
    )
  );

-- ============================================================
-- PLATAFORMA_CONFIG (somente leitura)
-- ============================================================
create policy "config_select" on plataforma_config
  for select using (true);

-- ============================================================
-- FAVORITO
-- ============================================================
create policy "favorito_select_own" on favorito
  for select using (usuario_id = auth.uid());

create policy "favorito_insert_own" on favorito
  for insert with check (usuario_id = auth.uid());

create policy "favorito_delete_own" on favorito
  for delete using (usuario_id = auth.uid());

-- ============================================================
-- LEITURA_ATUAL
-- ============================================================
create policy "leitura_select_own" on leitura_atual
  for select using (usuario_id = auth.uid());

create policy "leitura_insert_own" on leitura_atual
  for insert with check (usuario_id = auth.uid());

create policy "leitura_update_own" on leitura_atual
  for update using (usuario_id = auth.uid());

-- ============================================================
-- NOTIFICACAO
-- ============================================================
create policy "notificacao_select_own" on notificacao
  for select using (usuario_id = auth.uid());

create policy "notificacao_update_own" on notificacao
  for update using (usuario_id = auth.uid());

-- ============================================================
-- BLOQUEIO
-- ============================================================
create policy "bloqueio_select_own" on bloqueio
  for select using (bloqueador_id = auth.uid());

create policy "bloqueio_insert_own" on bloqueio
  for insert with check (bloqueador_id = auth.uid());

create policy "bloqueio_delete_own" on bloqueio
  for delete using (bloqueador_id = auth.uid());
