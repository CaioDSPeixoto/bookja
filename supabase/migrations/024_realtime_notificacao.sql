-- Habilita Realtime para a tabela notificacao, permitindo que o cliente receba
-- novas notificações em tempo real (postgres_changes). O RLS de notificacao
-- (select do próprio usuário) é respeitado pelo Realtime, então cada usuário só
-- recebe as próprias notificações.

alter publication supabase_realtime add table notificacao;
