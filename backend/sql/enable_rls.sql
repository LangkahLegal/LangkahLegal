-- Tutup akses langsung anon/authenticated ke schema public.
-- Backend memakai service role key, yang melewati RLS dan grant ini, jadi API tetap berjalan.
-- Jalankan di Supabase Dashboard -> SQL Editor. Aman dijalankan ulang.

do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

-- Verifikasi: semua baris harus rowsecurity = true.
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
