-- Seeds de tags iniciais por categoria

INSERT INTO tag (nome, categoria) VALUES
  -- Gênero
  ('Romance', 'genero'),
  ('Fantasia', 'genero'),
  ('Ficção Científica', 'genero'),
  ('Terror', 'genero'),
  ('Suspense', 'genero'),
  ('Aventura', 'genero'),
  ('Drama', 'genero'),
  ('Comédia', 'genero'),
  ('Mistério', 'genero'),
  ('Histórico', 'genero'),
  ('Poesia', 'genero'),
  ('Slice of Life', 'genero'),
  ('Ação', 'genero'),
  ('Thriller', 'genero'),

  -- Tema
  ('Amizade', 'tema'),
  ('Família', 'tema'),
  ('Superação', 'tema'),
  ('Vingança', 'tema'),
  ('Redenção', 'tema'),
  ('Sobrevivência', 'tema'),
  ('Amor proibido', 'tema'),
  ('Segunda chance', 'tema'),
  ('Poder', 'tema'),
  ('Identidade', 'tema'),
  ('Luto', 'tema'),
  ('Viagem', 'tema'),

  -- Aviso de conteúdo
  ('Violência', 'aviso_conteudo'),
  ('Linguagem forte', 'aviso_conteudo'),
  ('Conteúdo sexual', 'aviso_conteudo'),
  ('Morte de personagem', 'aviso_conteudo'),
  ('Temas sensíveis', 'aviso_conteudo'),
  ('Abuso', 'aviso_conteudo'),
  ('Automutilação', 'aviso_conteudo'),

  -- Público-alvo
  ('Livre', 'publico_alvo'),
  ('+12', 'publico_alvo'),
  ('+16', 'publico_alvo'),
  ('+18', 'publico_alvo'),

  -- Fandom
  ('Original', 'fandom'),
  ('Fanfiction', 'fandom'),
  ('Universo alternativo', 'fandom'),
  ('Crossover', 'fandom')
ON CONFLICT (nome) DO NOTHING;
