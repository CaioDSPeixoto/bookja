-- Remove tags de aviso duplicadas que diferem apenas por caixa (Title Case),
-- mantendo a versão do seed (sentence case). Reaponta eventuais referências em
-- projeto_tag antes de remover (defensivo) e cria índice único case-insensitive
-- para impedir novas duplicatas.

-- Reaponta referências das duplicatas para a tag canônica (mesma grafia, caixa diferente).
update projeto_tag pt
set tag_id = canon.id
from tag dup
join tag canon
  on lower(canon.nome) = lower(dup.nome)
 and canon.id <> dup.id
where dup.nome in ('Conteúdo Sexual', 'Linguagem Forte', 'Morte de Personagem')
  and pt.tag_id = dup.id
  and not exists (
    select 1 from projeto_tag x
    where x.projeto_id = pt.projeto_id and x.tag_id = canon.id
  );

-- Remove referências remanescentes que colidiriam com a canônica.
delete from projeto_tag pt
using tag dup
where dup.nome in ('Conteúdo Sexual', 'Linguagem Forte', 'Morte de Personagem')
  and pt.tag_id = dup.id;

-- Remove as tags duplicadas.
delete from tag
where nome in ('Conteúdo Sexual', 'Linguagem Forte', 'Morte de Personagem');

-- Impede novas duplicatas por diferença de caixa.
create unique index if not exists idx_tag_nome_lower_unico on tag (lower(nome));
