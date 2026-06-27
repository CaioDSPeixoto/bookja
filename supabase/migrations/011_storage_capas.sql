-- Storage de capas de projetos.
-- Substitui o fluxo antigo de salvar a imagem como Data URL base64 em projeto.capa_url.
-- Idempotente: pode ser reaplicada com seguranca.
-- (Esta migration torna obsoleta a 008_storage_capas (NAO RODAR).sql.)

-- Bucket publico para capas de projetos
insert into storage.buckets (id, name, public)
values ('capas', 'capas', true)
on conflict (id) do update set public = true;

-- Leitura publica das capas
drop policy if exists "capas_leitura_publica" on storage.objects;
create policy "capas_leitura_publica" on storage.objects
  for select using (bucket_id = 'capas');

-- Upload restrito ao dono do projeto (1o segmento do path = projeto.id)
drop policy if exists "capas_insert_dono" on storage.objects;
create policy "capas_insert_dono" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'capas'
    and exists (
      select 1 from public.projeto p
      where p.id::text = split_part(storage.objects.name, '/', 1)
        and p.dono_id = auth.uid()
    )
  );

-- Atualizacao restrita ao dono do projeto
drop policy if exists "capas_update_dono" on storage.objects;
create policy "capas_update_dono" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'capas'
    and exists (
      select 1 from public.projeto p
      where p.id::text = split_part(storage.objects.name, '/', 1)
        and p.dono_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'capas'
    and exists (
      select 1 from public.projeto p
      where p.id::text = split_part(storage.objects.name, '/', 1)
        and p.dono_id = auth.uid()
    )
  );

-- Remocao restrita ao dono do projeto
drop policy if exists "capas_delete_dono" on storage.objects;
create policy "capas_delete_dono" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'capas'
    and exists (
      select 1 from public.projeto p
      where p.id::text = split_part(storage.objects.name, '/', 1)
        and p.dono_id = auth.uid()
    )
  );
