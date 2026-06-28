export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type Tabela<Row, Insert, Update = Partial<Insert>> = {
  Row: Row & Record<string, unknown>
  Insert: Insert & Record<string, unknown>
  Update: Update & Record<string, unknown>
  Relationships: []
}

type RelacionamentoBanco = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

type TabelaRelacionada<Row, Insert, Update, Relationships extends RelacionamentoBanco[]> = {
  Row: Row & Record<string, unknown>
  Insert: Insert & Record<string, unknown>
  Update: Update & Record<string, unknown>
  Relationships: Relationships
}

type FuncaoBanco<Args extends Record<string, unknown> | never, Returns> = {
  Args: Args
  Returns: Returns
}

type FuncaoGenerica = FuncaoBanco<Record<string, unknown> | never, unknown>

type RegistroBase = {
  criado_em: string
  atualizado_em: string | null
}

type Id = string

export interface Database {
  public: {
    Tables: {
      perfil: Tabela<
        {
          id: Id
          nome_usuario: string
          nome_exibicao: string | null
          bio: string | null
          avatar_url: string | null
          chave_pix: string | null
          papel: string
          criado_em: string
          atualizado_em: string | null
          data_nascimento: string | null
        },
        {
          id: Id
          nome_usuario: string
          nome_exibicao?: string | null
          bio?: string | null
          avatar_url?: string | null
          chave_pix?: string | null
          papel?: string
          criado_em?: string
          atualizado_em?: string | null
          data_nascimento?: string | null
        },
        {
          nome_usuario?: string
          nome_exibicao?: string | null
          bio?: string | null
          avatar_url?: string | null
          chave_pix?: string | null
          papel?: string
          atualizado_em?: string | null
          data_nascimento?: string | null
        }
      >
      projeto: TabelaRelacionada<
        RegistroBase & {
          id: Id
          dono_id: Id
          titulo: string
          sinopse: string | null
          capa_url: string | null
          status: 'rascunho' | 'revisao' | 'publicado'
          publicado_em: string | null
          contagem_visualizacoes: number
          media_avaliacao: number
          contagem_avaliacoes: number
        },
        {
          id?: Id
          dono_id: Id
          titulo: string
          sinopse?: string | null
          capa_url?: string | null
          status?: 'rascunho' | 'revisao' | 'publicado'
          criado_em?: string
          atualizado_em?: string | null
          publicado_em?: string | null
          contagem_visualizacoes?: number
          media_avaliacao?: number
          contagem_avaliacoes?: number
        },
        Partial<{
          id?: Id
          dono_id: Id
          titulo: string
          sinopse?: string | null
          capa_url?: string | null
          status?: 'rascunho' | 'revisao' | 'publicado'
          criado_em?: string
          atualizado_em?: string | null
          publicado_em?: string | null
          contagem_visualizacoes?: number
          media_avaliacao?: number
          contagem_avaliacoes?: number
        }>,
        [
          {
            foreignKeyName: 'projeto_dono_id_fkey'
            columns: ['dono_id']
            referencedRelation: 'perfil'
            referencedColumns: ['id']
          },
        ]
      >
      projeto_colaborador: TabelaRelacionada<
        {
          projeto_id: Id
          usuario_id: Id
          papel: string
          convidado_em: string
          aceito_em: string | null
        },
        {
          projeto_id: Id
          usuario_id: Id
          papel?: string
          convidado_em?: string
          aceito_em?: string | null
        },
        Partial<{
          projeto_id: Id
          usuario_id: Id
          papel?: string
          convidado_em?: string
          aceito_em?: string | null
        }>,
        [
          {
            foreignKeyName: 'projeto_colaborador_projeto_id_fkey'
            columns: ['projeto_id']
            referencedRelation: 'projeto'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_colaborador_usuario_id_fkey'
            columns: ['usuario_id']
            referencedRelation: 'perfil'
            referencedColumns: ['id']
          },
        ]
      >
      documento: TabelaRelacionada<
        RegistroBase & {
          id: Id
          projeto_id: Id
          titulo: string
          tipo: 'capitulo' | 'ficha_personagem' | 'biblia' | 'nota' | 'outro'
          conteudo: Json | null
          ordem: number
          publico: boolean
          status: 'rascunho' | 'revisao' | 'revisao_supervisionada' | 'publicado'
          contagem_palavras: number
          publicado_em: string | null
        },
        {
          id?: Id
          projeto_id: Id
          titulo: string
          tipo?: 'capitulo' | 'ficha_personagem' | 'biblia' | 'nota' | 'outro'
          conteudo?: Json | null
          ordem?: number
          publico?: boolean
          status?: 'rascunho' | 'revisao' | 'revisao_supervisionada' | 'publicado'
          contagem_palavras?: number
          criado_em?: string
          atualizado_em?: string | null
          publicado_em?: string | null
        },
        {
          titulo?: string
          tipo?: 'capitulo' | 'ficha_personagem' | 'biblia' | 'nota' | 'outro'
          conteudo?: Json | null
          ordem?: number
          publico?: boolean
          status?: 'rascunho' | 'revisao' | 'revisao_supervisionada' | 'publicado'
          contagem_palavras?: number
          atualizado_em?: string | null
          publicado_em?: string | null
        },
        [
          {
            foreignKeyName: 'documento_projeto_id_fkey'
            columns: ['projeto_id']
            referencedRelation: 'projeto'
            referencedColumns: ['id']
          },
        ]
      >
      documento_lock: TabelaRelacionada<
        {
          documento_id: Id
          travado_por: Id
          travado_em: string
          expira_em: string
        },
        {
          documento_id: Id
          travado_por: Id
          travado_em?: string
          expira_em: string
        },
        Partial<{
          documento_id: Id
          travado_por: Id
          travado_em?: string
          expira_em: string
        }>,
        [
          {
            foreignKeyName: 'documento_lock_documento_id_fkey'
            columns: ['documento_id']
            referencedRelation: 'documento'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documento_lock_travado_por_fkey'
            columns: ['travado_por']
            referencedRelation: 'perfil'
            referencedColumns: ['id']
          },
        ]
      >
      tag: Tabela<
        {
          id: number
          nome: string
          categoria: string | null
          criado_em: string
        },
        {
          id?: number
          nome: string
          categoria?: string | null
          criado_em?: string
        }
      >
      projeto_tag: TabelaRelacionada<
        {
          projeto_id: Id
          tag_id: number
        },
        {
          projeto_id: Id
          tag_id: number
        },
        Partial<{
          projeto_id: Id
          tag_id: number
        }>,
        [
          {
            foreignKeyName: 'projeto_tag_projeto_id_fkey'
            columns: ['projeto_id']
            referencedRelation: 'projeto'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_tag_tag_id_fkey'
            columns: ['tag_id']
            referencedRelation: 'tag'
            referencedColumns: ['id']
          },
        ]
      >
      comentario: TabelaRelacionada<
        RegistroBase & {
          id: Id
          projeto_id: Id
          documento_id: Id | null
          autor_id: Id
          pai_id: Id | null
          conteudo: string
          nota: number | null
        },
        {
          id?: Id
          projeto_id: Id
          documento_id?: Id | null
          autor_id: Id
          pai_id?: Id | null
          conteudo: string
          nota?: number | null
          criado_em?: string
          atualizado_em?: string | null
        },
        Partial<{
          id?: Id
          projeto_id: Id
          documento_id?: Id | null
          autor_id: Id
          pai_id?: Id | null
          conteudo: string
          nota?: number | null
          criado_em?: string
          atualizado_em?: string | null
        }>,
        [
          {
            foreignKeyName: 'comentario_projeto_id_fkey'
            columns: ['projeto_id']
            referencedRelation: 'projeto'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comentario_autor_id_fkey'
            columns: ['autor_id']
            referencedRelation: 'perfil'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comentario_documento_id_fkey'
            columns: ['documento_id']
            referencedRelation: 'documento'
            referencedColumns: ['id']
          },
        ]
      >
      comentario_reacao: Tabela<
        {
          comentario_id: Id
          usuario_id: Id
          emoji: string
          criado_em: string
        },
        {
          comentario_id: Id
          usuario_id: Id
          emoji: string
          criado_em?: string
        }
      >
      documento_nota: TabelaRelacionada<
        {
          id: Id
          documento_id: Id
          autor_id: Id
          conteudo: string
          criado_em: string
          atualizado_em: string | null
        },
        {
          id?: Id
          documento_id: Id
          autor_id: Id
          conteudo: string
          criado_em?: string
          atualizado_em?: string | null
        },
        Partial<{
          conteudo: string
          atualizado_em: string | null
        }>,
        [
          {
            foreignKeyName: 'documento_nota_autor_id_fkey'
            columns: ['autor_id']
            referencedRelation: 'perfil'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documento_nota_documento_id_fkey'
            columns: ['documento_id']
            referencedRelation: 'documento'
            referencedColumns: ['id']
          }
        ]
      >
      documento_reacao: Tabela<
        {
          documento_id: Id
          usuario_id: Id
          emoji: string
          criado_em: string
        },
        {
          documento_id: Id
          usuario_id: Id
          emoji: string
          criado_em?: string
        }
      >
      projeto_visualizacao: Tabela<
        {
          id: Id
          projeto_id: Id
          usuario_id: Id | null
          visualizado_em: string
        },
        {
          id?: Id
          projeto_id: Id
          usuario_id?: Id | null
          visualizado_em?: string
        }
      >
      plataforma_config: Tabela<
        {
          chave: string
          valor: string | null
        },
        {
          chave: string
          valor?: string | null
        }
      >
      favorito: TabelaRelacionada<
        {
          usuario_id: Id
          projeto_id: Id
          criado_em: string
        },
        {
          usuario_id: Id
          projeto_id: Id
          criado_em?: string
        },
        Partial<{
          usuario_id: Id
          projeto_id: Id
          criado_em?: string
        }>,
        [
          {
            foreignKeyName: 'favorito_projeto_id_fkey'
            columns: ['projeto_id']
            referencedRelation: 'projeto'
            referencedColumns: ['id']
          },
        ]
      >
      leitura_atual: TabelaRelacionada<
        {
          usuario_id: Id
          projeto_id: Id
          ultimo_documento_id: Id | null
          criado_em: string
          atualizado_em: string | null
        },
        {
          usuario_id: Id
          projeto_id: Id
          ultimo_documento_id?: Id | null
          criado_em?: string
          atualizado_em?: string | null
        },
        Partial<{
          usuario_id: Id
          projeto_id: Id
          ultimo_documento_id?: Id | null
          criado_em?: string
          atualizado_em?: string | null
        }>,
        [
          {
            foreignKeyName: 'leitura_atual_projeto_id_fkey'
            columns: ['projeto_id']
            referencedRelation: 'projeto'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leitura_atual_ultimo_documento_id_fkey'
            columns: ['ultimo_documento_id']
            referencedRelation: 'documento'
            referencedColumns: ['id']
          },
        ]
      >
      notificacao: Tabela<
        {
          id: Id
          usuario_id: Id
          tipo: string
          projeto_id: Id | null
          documento_id: Id | null
          comentario_id: Id | null
          mensagem: string
          lida: boolean
          criado_em: string
        },
        {
          id?: Id
          usuario_id: Id
          tipo: string
          projeto_id?: Id | null
          documento_id?: Id | null
          comentario_id?: Id | null
          mensagem: string
          lida?: boolean
          criado_em?: string
        }
      >
      bloqueio: Tabela<
        {
          bloqueador_id: Id
          bloqueado_id: Id
          criado_em: string
        },
        {
          bloqueador_id: Id
          bloqueado_id: Id
          criado_em?: string
        }
      >
      mural_comentario: TabelaRelacionada<
        RegistroBase & {
          id: Id
          perfil_id: Id
          autor_id: Id
          pai_id: Id | null
          conteudo: string
        },
        {
          id?: Id
          perfil_id: Id
          autor_id: Id
          pai_id?: Id | null
          conteudo: string
          criado_em?: string
          atualizado_em?: string | null
        },
        Partial<{
          id?: Id
          perfil_id: Id
          autor_id: Id
          pai_id?: Id | null
          conteudo: string
          criado_em?: string
          atualizado_em?: string | null
        }>,
        [
          {
            foreignKeyName: 'mural_comentario_perfil_id_fkey'
            columns: ['perfil_id']
            referencedRelation: 'perfil'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mural_comentario_autor_id_fkey'
            columns: ['autor_id']
            referencedRelation: 'perfil'
            referencedColumns: ['id']
          },
        ]
      >
      mural_reacao: Tabela<
        {
          comentario_id: Id
          usuario_id: Id
          emoji: string
          criado_em: string
        },
        {
          comentario_id: Id
          usuario_id: Id
          emoji: string
          criado_em?: string
        }
      >
    }
    Views: { [_ in never]: never }
    Functions: {
      adquirir_lock_documento: {
        Args: {
          p_documento_id: Id
          p_usuario_id: Id
        }
        Returns: {
          sucesso: boolean
          travado_por_nome?: string
        }
      }
      incrementar_visualizacao: {
        Args: {
          p_projeto_id: Id
          p_usuario_id?: Id | null
        }
        Returns: undefined
      }
      eh_colaborador: {
        Args: {
          p_projeto_id: Id
          p_usuario_id: Id
        }
        Returns: boolean
      }
      eh_dono_projeto: {
        Args: {
          p_projeto_id: Id
          p_usuario_id: Id
        }
        Returns: boolean
      }
      criar_notificacao_sistema: {
        Args: {
          p_usuario_id: Id
          p_tipo: string
          p_projeto_id?: Id | null
          p_documento_id?: Id | null
          p_comentario_id?: Id | null
          p_mensagem?: string
        }
        Returns: undefined
      }
      notificar_favoritos_capitulo_publicado: {
        Args: {
          p_projeto_id: Id
          p_documento_id: Id
          p_mensagem: string
        }
        Returns: undefined
      }
    } & Record<string, FuncaoGenerica>
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
