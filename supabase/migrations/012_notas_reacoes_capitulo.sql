-- Post-its do autor (notas/curiosidades) e reacoes de leitores por capitulo (documento).
-- Idempotente.

create table if not exists documento_nota (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references documento(id) on delete cascade,
  autor_id uuid not null references perfil(id) on delete cascade,
  conteudo text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz
);
comment on table documento_nota is 'Notas/curiosidades do autor (post-its) por capitulo, visiveis na leitura';
create index if not exists idx_documento_nota_documento on documento_nota(documento_id);
alter table documento_nota enable row level security;

drop policy if exists "documento_nota_select" on documento_nota;
create policy "documento_nota_select" on documento_nota for select using (
  exists (
    select 1 from documento d join projeto p on p.id = d.projeto_id
    where d.id = documento_nota.documento_id and d.publico = true and p.status = 'publicado'
  )
  or exists (
    select 1 from documento d
    where d.id = documento_nota.documento_id
      and (public.eh_dono_projeto(d.projeto_id, auth.uid()) or public.eh_colaborador(d.projeto_id, auth.uid()))
  )
);

drop policy if exists "documento_nota_insert" on documento_nota;
create policy "documento_nota_insert" on documento_nota for insert to authenticated
with check (
  autor_id = auth.uid()
  and exists (
    select 1 from documento d
    where d.id = documento_nota.documento_id
      and (public.eh_dono_projeto(d.projeto_id, auth.uid()) or public.eh_colaborador(d.projeto_id, auth.uid()))
  )
);

drop policy if exists "documento_nota_update" on documento_nota;
create policy "documento_nota_update" on documento_nota for update to authenticated
using (autor_id = auth.uid())
with check (autor_id = auth.uid());

drop policy if exists "documento_nota_delete" on documento_nota;
create policy "documento_nota_delete" on documento_nota for delete to authenticated
using (autor_id = auth.uid());

create table if not exists documento_reacao (
  documento_id uuid not null references documento(id) on delete cascade,
  usuario_id uuid not null references perfil(id) on delete cascade,
  emoji text not null,
  criado_em timestamptz not null default now(),
  primary key (documento_id, usuario_id, emoji)
);
comment on table documento_reacao is 'Reacoes (emoji) de leitores a um capitulo';
alter table documento_reacao enable row level security;

drop policy if exists "documento_reacao_select" on documento_reacao;
create policy "documento_reacao_select" on documento_reacao for select using (
  exists (
    select 1 from documento d join projeto p on p.id = d.projeto_id
    where d.id = documento_reacao.documento_id and d.publico = true and p.status = 'publicado'
  )
  or exists (
    select 1 from documento d
    where d.id = documento_reacao.documento_id
      and (public.eh_dono_projeto(d.projeto_id, auth.uid()) or public.eh_colaborador(d.projeto_id, auth.uid()))
  )
);

drop policy if exists "documento_reacao_insert" on documento_reacao;
create policy "documento_reacao_insert" on documento_reacao for insert to authenticated
with check (
  usuario_id = auth.uid()
  and (
    exists (
      select 1 from documento d join projeto p on p.id = d.projeto_id
      where d.id = documento_reacao.documento_id and d.publico = true and p.status = 'publicado'
    )
    or exists (
      select 1 from documento d
      where d.id = documento_reacao.documento_id
        and (public.eh_dono_projeto(d.projeto_id, auth.uid()) or public.eh_colaborador(d.projeto_id, auth.uid()))
    )
  )
);

drop policy if exists "documento_reacao_delete" on documento_reacao;
create policy "documento_reacao_delete" on documento_reacao for delete to authenticated
using (usuario_id = auth.uid());
