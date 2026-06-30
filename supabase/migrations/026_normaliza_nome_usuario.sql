-- Normaliza nomes de usuário legados que não são slugs válidos (continham
-- espaços, @, maiúsculas etc.), o que gerava URLs de perfil quebradas (404).
-- Regra alinhada à validação do cadastro: ^[a-z0-9_]{3,20}$.

update perfil p
set nome_usuario = sub.novo
from (
  select id,
    case
      when length(slug) between 3 and 20 then slug
      else 'user_' || left(id::text, 8)
    end as novo
  from (
    select id,
      trim(both '_' from left(regexp_replace(lower(nome_usuario), '[^a-z0-9]+', '_', 'g'), 20)) as slug
    from perfil
    where nome_usuario !~ '^[a-z0-9_]{3,20}$'
  ) s
) sub
where p.id = sub.id;
