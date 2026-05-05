-- Pocket Manager vault storage
-- Creates a private bucket for per-user song assets.

insert into storage.buckets (id, name, public, file_size_limit)
values ('vault-assets', 'vault-assets', false, 52428800)
on conflict (id) do nothing;

drop policy if exists "vault_assets_owner_select" on storage.objects;
drop policy if exists "vault_assets_owner_insert" on storage.objects;
drop policy if exists "vault_assets_owner_update" on storage.objects;
drop policy if exists "vault_assets_owner_delete" on storage.objects;

create policy "vault_assets_owner_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'vault-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "vault_assets_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'vault-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "vault_assets_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'vault-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'vault-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "vault_assets_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'vault-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);
