-- Aprovacao supervisionada de capitulos por colaboradores.

create table if not exists documento_aprovacao (
  documento_id uuid not null references documento(id) on delete cascade,
  usuario_id uuid not null references perfil(id) on delete cascade,
  aprovado_em timestamptz,
  criado_em timestamptz not null default now(),
  primary key (documento_id, usuario_id)
);

alter table documento_aprovacao enable row level security;

create policy "documento_aprovacao_select_projeto" on documento_aprovacao
  for select
  to authenticated
  using (
    exists (
      select 1
      from documento d
      where d.id = documento_aprovacao.documento_id
        and (
          public.eh_dono_projeto(d.projeto_id, auth.uid())
          or public.eh_colaborador(d.projeto_id, auth.uid())
        )
    )
  );

create policy "documento_aprovacao_insert_projeto" on documento_aprovacao
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from documento d
      join projeto_colaborador pc
        on pc.projeto_id = d.projeto_id
       and pc.usuario_id = documento_aprovacao.usuario_id
       and pc.aceito_em is not null
      where d.id = documento_aprovacao.documento_id
        and (
          public.eh_dono_projeto(d.projeto_id, auth.uid())
          or public.eh_colaborador(d.projeto_id, auth.uid())
        )
    )
  );

create policy "documento_aprovacao_update_self" on documento_aprovacao
  for update
  to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create policy "documento_aprovacao_delete_projeto" on documento_aprovacao
  for delete
  to authenticated
  using (
    exists (
      select 1
      from documento d
      where d.id = documento_aprovacao.documento_id
        and (
          public.eh_dono_projeto(d.projeto_id, auth.uid())
          or public.eh_colaborador(d.projeto_id, auth.uid())
        )
    )
  );

create index if not exists idx_documento_aprovacao_pendente
  on documento_aprovacao(documento_id)
  where aprovado_em is null;
