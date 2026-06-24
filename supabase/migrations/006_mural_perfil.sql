-- ============================================================
-- Mural de Perfil — Comentários no perfil de usuários
-- ============================================================

create table mural_comentario (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfil(id) on delete cascade,
  autor_id uuid not null references perfil(id) on delete cascade,
  pai_id uuid references mural_comentario(id) on delete cascade,
  conteudo text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz
);
comment on table mural_comentario is 'Comentários no mural do perfil de um usuário';

create table mural_reacao (
  comentario_id uuid not null references mural_comentario(id) on delete cascade,
  usuario_id uuid not null references perfil(id) on delete cascade,
  emoji text not null,
  criado_em timestamptz not null default now(),
  primary key (comentario_id, usuario_id, emoji)
);
comment on table mural_reacao is 'Reações com emoji em comentários do mural';

-- Índices
create index idx_mural_comentario_perfil on mural_comentario(perfil_id, criado_em desc);
create index idx_mural_comentario_autor on mural_comentario(autor_id);
create index idx_mural_comentario_pai on mural_comentario(pai_id);

-- RLS
alter table mural_comentario enable row level security;
alter table mural_reacao enable row level security;

-- Policies: qualquer autenticado lê; autenticados criam; autor ou dono do perfil deleta
create policy "mural_leitura" on mural_comentario for select using (true);
create policy "mural_inserir" on mural_comentario for insert with check (auth.uid() = autor_id);
create policy "mural_deletar" on mural_comentario for delete using (
  auth.uid() = autor_id or auth.uid() = perfil_id
);
create policy "mural_atualizar" on mural_comentario for update using (auth.uid() = autor_id);

create policy "mural_reacao_leitura" on mural_reacao for select using (true);
create policy "mural_reacao_inserir" on mural_reacao for insert with check (auth.uid() = usuario_id);
create policy "mural_reacao_deletar" on mural_reacao for delete using (auth.uid() = usuario_id);
