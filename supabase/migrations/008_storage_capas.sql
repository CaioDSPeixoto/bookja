-- Criar bucket para capas (execução manual no dashboard do Supabase)
-- insert into storage.buckets (id, name, public) values ('capas', 'capas', true);

-- Policy: qualquer autenticado faz upload, qualquer um lê
create policy "capas_upload" on storage.objects for insert with check (
  bucket_id = 'capas' and auth.role() = 'authenticated'
);
create policy "capas_leitura" on storage.objects for select using (
  bucket_id = 'capas'
);
create policy "capas_delete" on storage.objects for delete using (
  bucket_id = 'capas' and auth.role() = 'authenticated'
);
