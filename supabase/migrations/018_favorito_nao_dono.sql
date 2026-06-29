-- Impede que o dono do projeto favorite a propria historia.
--
-- A policy de insert anterior (favorito_insert_own) exigia apenas
-- usuario_id = auth.uid(), permitindo que o autor favoritasse o proprio
-- projeto (inflando o contador e gerando auto-curtida). Passa a exigir que o
-- usuario nao seja o dono do projeto. UI e Server Action tambem bloqueiam,
-- mas o RLS e a barreira real.

-- Limpa auto-favoritos ja existentes.
delete from favorito f
using projeto p
where p.id = f.projeto_id
  and p.dono_id = f.usuario_id;

drop policy if exists favorito_insert_own on favorito;

create policy favorito_insert_own on favorito
  for insert
  with check (
    usuario_id = auth.uid()
    and not public.eh_dono_projeto(projeto_id, auth.uid())
  );
