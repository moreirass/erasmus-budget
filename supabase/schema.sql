-- Run once in the Supabase SQL editor. No service-role key is used in the app.
create table if not exists public.budget_documents (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null,
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now(),
 constraint valid_payload check (jsonb_typeof(payload) = 'object' and payload->>'version' = '1')
);
alter table public.budget_documents enable row level security;
revoke all on public.budget_documents from anon, authenticated;
grant select, insert, update on public.budget_documents to authenticated;
create policy "Read own budget" on public.budget_documents for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own budget" on public.budget_documents for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own budget" on public.budget_documents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Compare-and-swap prevents silently overwriting another device's changes.
create or replace function public.save_budget(expected_revision bigint, document jsonb)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare next_revision bigint;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if octet_length(document::text) > 10000000 then raise exception 'Budget document is too large'; end if;
 if expected_revision = 0 then
  insert into public.budget_documents (user_id,payload,revision) values (auth.uid(),document,1)
  on conflict (user_id) do nothing returning revision into next_revision;
 else
  update public.budget_documents set payload=document,revision=revision+1,updated_at=now()
  where user_id=auth.uid() and revision=expected_revision returning revision into next_revision;
 end if;
 if next_revision is null then raise exception 'Cloud changed during sync. Press Sync again to resolve the conflict.'; end if;
 return next_revision;
end; $$;
revoke all on function public.save_budget(bigint,jsonb) from public, anon;
grant execute on function public.save_budget(bigint,jsonb) to authenticated;
