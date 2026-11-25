-- The hosted project has a function that turns on RLS for new tables. It runs as an
-- event trigger, so API roles never need to call it. It is not created by our
-- migrations, so it may be missing from a new project.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable()
      from public, anon, authenticated, service_role;
  end if;
end;
$$;
