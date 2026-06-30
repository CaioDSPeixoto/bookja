-- Move data_nascimento para uma tabela privada.
--
-- A tabela `perfil` tem SELECT público (perfil_select_public = true), então a
-- coluna data_nascimento ficava consultável por qualquer um via PostgREST, mesmo
-- não aparecendo no perfil. Move o dado para `perfil_privado`, legível/escrevível
-- apenas pelo próprio usuário, e remove a coluna pública.

create table if not exists perfil_privado (
  id uuid primary key references perfil(id) on delete cascade,
  data_nascimento date
);

alter table perfil_privado enable row level security;

create policy "perfil_privado_select_own" on perfil_privado
  for select to authenticated using (id = auth.uid());

create policy "perfil_privado_insert_own" on perfil_privado
  for insert to authenticated with check (id = auth.uid());

create policy "perfil_privado_update_own" on perfil_privado
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Migra os dados existentes.
insert into perfil_privado (id, data_nascimento)
select id, data_nascimento from perfil where data_nascimento is not null
on conflict (id) do nothing;

-- Passa a popular perfil_privado no cadastro (a partir do metadata do signup).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.perfil (id, nome_usuario, nome_exibicao, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome_usuario', 'user_' || left(new.id::text, 8)),
    coalesce(new.raw_user_meta_data->>'nome_exibicao', new.raw_user_meta_data->>'nome_usuario'),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.perfil_privado (id, data_nascimento)
  values (new.id, nullif(new.raw_user_meta_data->>'data_nascimento', '')::date);
  return new;
end;
$function$;

-- Remove a coluna pública.
alter table perfil drop column if exists data_nascimento;
