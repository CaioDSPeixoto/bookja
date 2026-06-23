-- ============================================================
-- Bookja — Migration Inicial do Modelo de Dados
-- Banco: PostgreSQL (Supabase)
-- Data: 2026-06-23
-- ============================================================

-- 1. perfil — Dados públicos do usuário, vinculado ao auth.users
create table perfil (
  id uuid primary key references auth.users on delete cascade,
  nome_usuario text unique not null,
  nome_exibicao text,
  bio text,
  avatar_url text,
  chave_pix text,
  papel text not null default 'escritor',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz
);
comment on table perfil is 'Perfil público do usuário na plataforma';

-- 2. projeto — Obra literária (livro, fanfic, etc.)
create table projeto (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references perfil(id) on delete cascade,
  titulo text not null,
  sinopse text,
  capa_url text,
  status text not null default 'rascunho' check (status in ('rascunho', 'revisao', 'publicado')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz,
  publicado_em timestamptz,
  contagem_visualizacoes int not null default 0,
  media_avaliacao decimal(3,2) not null default 0,
  contagem_avaliacoes int not null default 0
);
comment on table projeto is 'Projeto literário (livro, fanfic, coletânea)';

-- 3. projeto_colaborador — Coautores e colaboradores de um projeto
create table projeto_colaborador (
  projeto_id uuid not null references projeto(id) on delete cascade,
  usuario_id uuid not null references perfil(id) on delete cascade,
  papel text not null default 'coautor',
  convidado_em timestamptz not null default now(),
  aceito_em timestamptz,
  primary key (projeto_id, usuario_id)
);
comment on table projeto_colaborador is 'Relação de colaboradores (coautores, revisores) em um projeto';

-- 4. documento — Capítulos, fichas de personagem, notas, etc.
create table documento (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projeto(id) on delete cascade,
  titulo text not null,
  tipo text not null default 'capitulo' check (tipo in ('capitulo', 'ficha_personagem', 'biblia', 'nota', 'outro')),
  conteudo jsonb,
  ordem int not null default 0,
  publico boolean not null default false,
  contagem_palavras int not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz,
  publicado_em timestamptz
);
comment on table documento is 'Documento pertencente a um projeto (capítulo, ficha, nota)';

-- 5. documento_lock — Trava de edição colaborativa
create table documento_lock (
  documento_id uuid primary key references documento(id) on delete cascade,
  travado_por uuid not null references perfil(id) on delete cascade,
  travado_em timestamptz not null default now(),
  expira_em timestamptz not null
);
comment on table documento_lock is 'Trava de edição simultânea em documentos colaborativos';

-- 6. tag — Tags para categorização de projetos
create table tag (
  id serial primary key,
  nome text unique not null,
  categoria text,
  criado_em timestamptz not null default now()
);
comment on table tag is 'Tags de categorização (gênero, tema, aviso de conteúdo, fandom)';

-- 7. projeto_tag — Relação N:N entre projetos e tags
create table projeto_tag (
  projeto_id uuid not null references projeto(id) on delete cascade,
  tag_id int not null references tag(id) on delete cascade,
  primary key (projeto_id, tag_id)
);
comment on table projeto_tag is 'Associação entre projetos e tags';

-- 8. comentario — Comentários e avaliações em projetos/documentos
create table comentario (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projeto(id) on delete cascade,
  documento_id uuid references documento(id) on delete cascade,
  autor_id uuid not null references perfil(id) on delete cascade,
  pai_id uuid references comentario(id) on delete cascade,
  conteudo text not null,
  nota smallint check (nota >= 1 and nota <= 5),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz
);
comment on table comentario is 'Comentários e avaliações em projetos ou documentos específicos';

-- 9. comentario_reacao — Reações (emoji) em comentários
create table comentario_reacao (
  comentario_id uuid not null references comentario(id) on delete cascade,
  usuario_id uuid not null references perfil(id) on delete cascade,
  emoji text not null,
  criado_em timestamptz not null default now(),
  primary key (comentario_id, usuario_id, emoji)
);
comment on table comentario_reacao is 'Reações com emoji em comentários';

-- 10. projeto_visualizacao — Registro de visualizações em projetos
create table projeto_visualizacao (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projeto(id) on delete cascade,
  usuario_id uuid references perfil(id) on delete set null,
  visualizado_em timestamptz not null default now()
);
comment on table projeto_visualizacao is 'Registro de visualizações de projetos (analytics)';

-- 11. plataforma_config — Configurações globais da plataforma
create table plataforma_config (
  chave text primary key,
  valor text
);
comment on table plataforma_config is 'Configurações key-value da plataforma';

-- 12. favorito — Projetos favoritados pelo usuário
create table favorito (
  usuario_id uuid not null references perfil(id) on delete cascade,
  projeto_id uuid not null references projeto(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (usuario_id, projeto_id)
);
comment on table favorito is 'Projetos marcados como favoritos pelo usuário';

-- 13. leitura_atual — Progresso de leitura do usuário
create table leitura_atual (
  usuario_id uuid not null references perfil(id) on delete cascade,
  projeto_id uuid not null references projeto(id) on delete cascade,
  ultimo_documento_id uuid references documento(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz,
  primary key (usuario_id, projeto_id)
);
comment on table leitura_atual is 'Progresso de leitura do usuário em cada projeto';

-- 14. notificacao — Notificações do sistema para o usuário
create table notificacao (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfil(id) on delete cascade,
  tipo text not null,
  projeto_id uuid references projeto(id) on delete cascade,
  documento_id uuid references documento(id) on delete cascade,
  comentario_id uuid references comentario(id) on delete cascade,
  mensagem text not null,
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);
comment on table notificacao is 'Notificações enviadas ao usuário (novos comentários, convites, etc.)';

-- 15. bloqueio — Bloqueio entre usuários
create table bloqueio (
  bloqueador_id uuid not null references perfil(id) on delete cascade,
  bloqueado_id uuid not null references perfil(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (bloqueador_id, bloqueado_id)
);
comment on table bloqueio is 'Registro de bloqueios entre usuários';

-- ============================================================
-- ROW LEVEL SECURITY — Habilitação em todas as tabelas
-- ============================================================

alter table perfil enable row level security;
alter table projeto enable row level security;
alter table projeto_colaborador enable row level security;
alter table documento enable row level security;
alter table documento_lock enable row level security;
alter table tag enable row level security;
alter table projeto_tag enable row level security;
alter table comentario enable row level security;
alter table comentario_reacao enable row level security;
alter table projeto_visualizacao enable row level security;
alter table plataforma_config enable row level security;
alter table favorito enable row level security;
alter table leitura_atual enable row level security;
alter table notificacao enable row level security;
alter table bloqueio enable row level security;

-- ============================================================
-- ÍNDICES
-- ============================================================

create index idx_projeto_dono_id on projeto(dono_id);
create index idx_projeto_status on projeto(status);
create index idx_projeto_publicado_em on projeto(publicado_em desc nulls last);

create index idx_documento_projeto_id on documento(projeto_id);
create index idx_documento_ordem on documento(projeto_id, ordem);

create index idx_comentario_projeto_id on comentario(projeto_id);
create index idx_comentario_documento_id on comentario(documento_id);
create index idx_comentario_autor_id on comentario(autor_id);
create index idx_comentario_pai_id on comentario(pai_id);

create index idx_projeto_visualizacao_projeto_id on projeto_visualizacao(projeto_id);
create index idx_projeto_visualizacao_usuario_id on projeto_visualizacao(usuario_id);

create index idx_notificacao_usuario_id on notificacao(usuario_id);
create index idx_notificacao_lida on notificacao(usuario_id, lida) where lida = false;

create index idx_favorito_projeto_id on favorito(projeto_id);

create index idx_leitura_atual_projeto_id on leitura_atual(projeto_id);

create index idx_tag_categoria on tag(categoria);

-- ============================================================
-- TRIGGER — Criação automática de perfil ao registrar usuário
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.perfil (id, nome_usuario, nome_exibicao, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome_usuario', 'user_' || left(new.id::text, 8)),
    coalesce(new.raw_user_meta_data->>'nome_exibicao', new.raw_user_meta_data->>'nome_usuario'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- SEED — Tags iniciais
-- ============================================================

insert into tag (nome, categoria) values
  -- Gêneros
  ('Fantasia', 'genero'),
  ('Romance', 'genero'),
  ('Ficção Científica', 'genero'),
  ('Terror', 'genero'),
  ('Aventura', 'genero'),
  ('Drama', 'genero'),
  ('Comédia', 'genero'),
  ('Suspense', 'genero'),
  ('Mistério', 'genero'),
  -- Temas
  ('Amizade', 'tema'),
  ('Família', 'tema'),
  ('Superação', 'tema'),
  ('Vingança', 'tema'),
  ('Redenção', 'tema'),
  -- Avisos de conteúdo
  ('Violência', 'aviso_conteudo'),
  ('Conteúdo Sexual', 'aviso_conteudo'),
  ('Linguagem Forte', 'aviso_conteudo'),
  ('Temas Psicológicos', 'aviso_conteudo'),
  ('Morte de Personagem', 'aviso_conteudo'),
  -- Fandoms
  ('Star Wars', 'fandom'),
  ('Marvel', 'fandom'),
  ('Harry Potter', 'fandom'),
  ('Anime/Mangá', 'fandom'),
  ('Jogos', 'fandom');
