alter table public.pesanan
  add column if not exists status text not null default 'selesai';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pesanan_status_check'
      and conrelid = 'public.pesanan'::regclass
  ) then
    alter table public.pesanan
      add constraint pesanan_status_check
      check (status in ('menunggu_konfirmasi', 'selesai'));
  end if;
end;
$$;

drop policy if exists "kasir_confirm_pending_pesanan" on public.pesanan;

create policy "kasir_confirm_pending_pesanan"
  on public.pesanan
  for update
  to authenticated
  using (
    status = 'menunggu_konfirmasi'
    and exists (
      select 1
      from public.profil
      where profil.id = auth.uid()
        and profil.peran in ('admin', 'kasir')
    )
  )
  with check (
    status = 'selesai'
    and exists (
      select 1
      from public.profil
      where profil.id = auth.uid()
        and profil.peran in ('admin', 'kasir')
    )
  );
