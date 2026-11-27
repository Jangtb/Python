-- Prueba de humo de RLS. Ver docs/MODELO-DE-DATOS.md para ejecutarla.
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
insert into auth.users values ('00000000-0000-4000-8000-000000000001','a@x.com', now()), ('00000000-0000-4000-8000-000000000002','b@x.com', null), ('00000000-0000-4000-8000-000000000003','m@x.com', now());
insert into public.profiles (user_id, handle, display_name) values ('00000000-0000-4000-8000-000000000001','ana','Ana'), ('00000000-0000-4000-8000-000000000002','beto','Beto');
insert into public.profiles (user_id, handle, display_name, role, trust_level) values ('00000000-0000-4000-8000-000000000003','mod','Mod','moderator',1);
insert into public.events (id, slug, title, summary, description, format, modality, starts_at, ends_at, organizer, capacity) values ('00000000-0000-4000-8000-0000000000e1','ev','Ev','s','d','charla','online', now()+interval '2 day', now()+interval '2 day 1 hour','C',1);
insert into public.event_private values ('00000000-0000-4000-8000-0000000000e1','https://meet.example/secreto');

set role authenticated;
-- Ana (verificada, nueva)
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001', false);
do $$ begin
  begin update public.profiles set role='admin' where user_id=auth.uid(); 
    if (select role from public.profiles where handle='ana')='admin' then raise exception 'FALLO: escaló rol'; end if;
  exception when insufficient_privilege or check_violation then null; end;
  begin insert into public.threads(kind,title,body,category_slug,author_id,moderation) values ('discussion','Titulo suficientemente largo','cuerpo con mas de treinta caracteres de largo ok','data-quality',auth.uid(),'published');
    raise exception 'FALLO: cuenta nueva publicó sin revisión';
  exception when insufficient_privilege then raise notice 'OK: cuenta nueva no puede autopublicar'; end;
end $$;
insert into public.threads(id,kind,title,body,category_slug,author_id,moderation) values ('00000000-0000-4000-8000-0000000000a1','discussion','Titulo suficientemente largo','cuerpo con mas de treinta caracteres de largo ok','data-quality',auth.uid(),'pending');
select 'OK: Ana ve su pendiente' where exists (select 1 from public.threads where id='00000000-0000-4000-8000-0000000000a1');
select count(*) as url_visible_antes_de_inscribirse from public.event_private;
select public.register_for_event('00000000-0000-4000-8000-0000000000e1');
select count(*) as url_visible_tras_inscribirse from public.event_private;

-- Beto (sin verificar)
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002', false);
select count(*) as beto_ve_pendiente_ajeno from public.threads where id='00000000-0000-4000-8000-0000000000a1';
do $$ begin perform public.register_for_event('00000000-0000-4000-8000-0000000000e1'); raise exception 'FALLO'; exception when others then raise notice 'OK: sin verificar no se inscribe (%)', sqlerrm; end $$;

-- Moderación aprueba
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003', false);
update public.threads set moderation='published' where id='00000000-0000-4000-8000-0000000000a1';
do $$ begin perform public.register_for_event('00000000-0000-4000-8000-0000000000e1'); raise exception 'FALLO: superó cupo'; exception when raise_exception then raise notice 'OK: cupo respetado (%)', sqlerrm; end $$;

-- Anónimo
reset role; set role anon; select set_config('request.jwt.claim.sub','', false);
select count(*) as anon_ve_publicada from public.threads where id='00000000-0000-4000-8000-0000000000a1';
select count(*) as anon_ve_url from public.event_private;
