-- Garante no máximo uma avaliação (comentário com nota) por usuário em cada projeto.
-- Comentários sem nota (conversas/respostas) continuam ilimitados; apenas os que
-- carregam nota ficam restritos a um por (projeto, autor). A Server Action
-- criarComentario zera a nota da avaliação anterior do usuário antes de registrar
-- a nova, então o índice é satisfeito e a contagem deixa de ser inflada.

create unique index if not exists idx_comentario_avaliacao_unica
  on comentario (projeto_id, autor_id)
  where nota is not null;
