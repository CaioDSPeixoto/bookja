// Tipos gerados a partir do schema remoto do Supabase (projeto ezdtqfmpornhkyilaxlh).
// NÃO editar à mão: após aplicar migrations, regenerar via CLI do Supabase
// (`supabase gen types typescript`) ou pelo MCP (generate_typescript_types).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bloqueio: {
        Row: {
          bloqueado_id: string
          bloqueador_id: string
          criado_em: string
        }
        Insert: {
          bloqueado_id: string
          bloqueador_id: string
          criado_em?: string
        }
        Update: {
          bloqueado_id?: string
          bloqueador_id?: string
          criado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "bloqueio_bloqueado_id_fkey"
            columns: ["bloqueado_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueio_bloqueador_id_fkey"
            columns: ["bloqueador_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      comentario: {
        Row: {
          atualizado_em: string | null
          autor_id: string
          conteudo: string
          criado_em: string
          documento_id: string | null
          id: string
          nota: number | null
          pai_id: string | null
          projeto_id: string
        }
        Insert: {
          atualizado_em?: string | null
          autor_id: string
          conteudo: string
          criado_em?: string
          documento_id?: string | null
          id?: string
          nota?: number | null
          pai_id?: string | null
          projeto_id: string
        }
        Update: {
          atualizado_em?: string | null
          autor_id?: string
          conteudo?: string
          criado_em?: string
          documento_id?: string | null
          id?: string
          nota?: number | null
          pai_id?: string | null
          projeto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentario_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentario_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentario_pai_id_fkey"
            columns: ["pai_id"]
            isOneToOne: false
            referencedRelation: "comentario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentario_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projeto"
            referencedColumns: ["id"]
          },
        ]
      }
      comentario_reacao: {
        Row: {
          comentario_id: string
          criado_em: string
          emoji: string
          usuario_id: string
        }
        Insert: {
          comentario_id: string
          criado_em?: string
          emoji: string
          usuario_id: string
        }
        Update: {
          comentario_id?: string
          criado_em?: string
          emoji?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentario_reacao_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "comentario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentario_reacao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      denuncia: {
        Row: {
          alvo_id: string
          criado_em: string
          denunciante_id: string
          id: string
          motivo: string
          resolvida: boolean
          resolvida_em: string | null
          tipo_alvo: string
        }
        Insert: {
          alvo_id: string
          criado_em?: string
          denunciante_id: string
          id?: string
          motivo: string
          resolvida?: boolean
          resolvida_em?: string | null
          tipo_alvo: string
        }
        Update: {
          alvo_id?: string
          criado_em?: string
          denunciante_id?: string
          id?: string
          motivo?: string
          resolvida?: boolean
          resolvida_em?: string | null
          tipo_alvo?: string
        }
        Relationships: [
          {
            foreignKeyName: "denuncia_denunciante_id_fkey"
            columns: ["denunciante_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      documento: {
        Row: {
          atualizado_em: string | null
          contagem_palavras: number
          conteudo: Json | null
          criado_em: string
          id: string
          ordem: number
          projeto_id: string
          publicado_em: string | null
          publico: boolean
          status: string
          tipo: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string | null
          contagem_palavras?: number
          conteudo?: Json | null
          criado_em?: string
          id?: string
          ordem?: number
          projeto_id: string
          publicado_em?: string | null
          publico?: boolean
          status?: string
          tipo?: string
          titulo: string
        }
        Update: {
          atualizado_em?: string | null
          contagem_palavras?: number
          conteudo?: Json | null
          criado_em?: string
          id?: string
          ordem?: number
          projeto_id?: string
          publicado_em?: string | null
          publico?: boolean
          status?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "documento_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projeto"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_aprovacao: {
        Row: {
          aprovado_em: string | null
          criado_em: string
          documento_id: string
          usuario_id: string
        }
        Insert: {
          aprovado_em?: string | null
          criado_em?: string
          documento_id: string
          usuario_id: string
        }
        Update: {
          aprovado_em?: string | null
          criado_em?: string
          documento_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documento_aprovacao_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_aprovacao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_lock: {
        Row: {
          documento_id: string
          expira_em: string
          travado_em: string
          travado_por: string
        }
        Insert: {
          documento_id: string
          expira_em: string
          travado_em?: string
          travado_por: string
        }
        Update: {
          documento_id?: string
          expira_em?: string
          travado_em?: string
          travado_por?: string
        }
        Relationships: [
          {
            foreignKeyName: "documento_lock_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: true
            referencedRelation: "documento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_lock_travado_por_fkey"
            columns: ["travado_por"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_nota: {
        Row: {
          atualizado_em: string | null
          autor_id: string
          conteudo: string
          criado_em: string
          documento_id: string
          id: string
        }
        Insert: {
          atualizado_em?: string | null
          autor_id: string
          conteudo: string
          criado_em?: string
          documento_id: string
          id?: string
        }
        Update: {
          atualizado_em?: string | null
          autor_id?: string
          conteudo?: string
          criado_em?: string
          documento_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documento_nota_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_nota_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documento"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_reacao: {
        Row: {
          criado_em: string
          documento_id: string
          emoji: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          documento_id: string
          emoji: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          documento_id?: string
          emoji?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documento_reacao_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_reacao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      favorito: {
        Row: {
          criado_em: string
          projeto_id: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          projeto_id: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          projeto_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorito_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projeto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorito_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      leitura_atual: {
        Row: {
          atualizado_em: string | null
          criado_em: string
          projeto_id: string
          ultimo_documento_id: string | null
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string
          projeto_id: string
          ultimo_documento_id?: string | null
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string
          projeto_id?: string
          ultimo_documento_id?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leitura_atual_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projeto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leitura_atual_ultimo_documento_id_fkey"
            columns: ["ultimo_documento_id"]
            isOneToOne: false
            referencedRelation: "documento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leitura_atual_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      mural_comentario: {
        Row: {
          atualizado_em: string | null
          autor_id: string
          conteudo: string
          criado_em: string
          id: string
          pai_id: string | null
          perfil_id: string
        }
        Insert: {
          atualizado_em?: string | null
          autor_id: string
          conteudo: string
          criado_em?: string
          id?: string
          pai_id?: string | null
          perfil_id: string
        }
        Update: {
          atualizado_em?: string | null
          autor_id?: string
          conteudo?: string
          criado_em?: string
          id?: string
          pai_id?: string | null
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mural_comentario_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mural_comentario_pai_id_fkey"
            columns: ["pai_id"]
            isOneToOne: false
            referencedRelation: "mural_comentario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mural_comentario_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      mural_reacao: {
        Row: {
          comentario_id: string
          criado_em: string
          emoji: string
          usuario_id: string
        }
        Insert: {
          comentario_id: string
          criado_em?: string
          emoji: string
          usuario_id: string
        }
        Update: {
          comentario_id?: string
          criado_em?: string
          emoji?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mural_reacao_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "mural_comentario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mural_reacao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacao: {
        Row: {
          comentario_id: string | null
          criado_em: string
          documento_id: string | null
          id: string
          lida: boolean
          mensagem: string
          projeto_id: string | null
          tipo: string
          usuario_id: string
        }
        Insert: {
          comentario_id?: string | null
          criado_em?: string
          documento_id?: string | null
          id?: string
          lida?: boolean
          mensagem: string
          projeto_id?: string | null
          tipo: string
          usuario_id: string
        }
        Update: {
          comentario_id?: string | null
          criado_em?: string
          documento_id?: string | null
          id?: string
          lida?: boolean
          mensagem?: string
          projeto_id?: string | null
          tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacao_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "comentario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacao_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacao_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projeto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil: {
        Row: {
          atualizado_em: string | null
          avatar_url: string | null
          bio: string | null
          chave_pix: string | null
          criado_em: string
          id: string
          nome_exibicao: string | null
          nome_usuario: string
          papel: string
        }
        Insert: {
          atualizado_em?: string | null
          avatar_url?: string | null
          bio?: string | null
          chave_pix?: string | null
          criado_em?: string
          id: string
          nome_exibicao?: string | null
          nome_usuario: string
          papel?: string
        }
        Update: {
          atualizado_em?: string | null
          avatar_url?: string | null
          bio?: string | null
          chave_pix?: string | null
          criado_em?: string
          id?: string
          nome_exibicao?: string | null
          nome_usuario?: string
          papel?: string
        }
        Relationships: []
      }
      perfil_privado: {
        Row: {
          data_nascimento: string | null
          id: string
        }
        Insert: {
          data_nascimento?: string | null
          id: string
        }
        Update: {
          data_nascimento?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfil_privado_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto: {
        Row: {
          atualizado_em: string | null
          capa_url: string | null
          contagem_avaliacoes: number
          contagem_visualizacoes: number
          criado_em: string
          dono_id: string
          id: string
          media_avaliacao: number
          publicado_em: string | null
          sinopse: string | null
          status: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string | null
          capa_url?: string | null
          contagem_avaliacoes?: number
          contagem_visualizacoes?: number
          criado_em?: string
          dono_id: string
          id?: string
          media_avaliacao?: number
          publicado_em?: string | null
          sinopse?: string | null
          status?: string
          titulo: string
        }
        Update: {
          atualizado_em?: string | null
          capa_url?: string | null
          contagem_avaliacoes?: number
          contagem_visualizacoes?: number
          criado_em?: string
          dono_id?: string
          id?: string
          media_avaliacao?: number
          publicado_em?: string | null
          sinopse?: string | null
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_dono_id_fkey"
            columns: ["dono_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_colaborador: {
        Row: {
          aceito_em: string | null
          convidado_em: string
          papel: string
          projeto_id: string
          usuario_id: string
        }
        Insert: {
          aceito_em?: string | null
          convidado_em?: string
          papel?: string
          projeto_id: string
          usuario_id: string
        }
        Update: {
          aceito_em?: string | null
          convidado_em?: string
          papel?: string
          projeto_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_colaborador_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projeto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_colaborador_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_tag: {
        Row: {
          projeto_id: string
          tag_id: number
        }
        Insert: {
          projeto_id: string
          tag_id: number
        }
        Update: {
          projeto_id?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "projeto_tag_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projeto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_tag_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_visualizacao: {
        Row: {
          id: string
          projeto_id: string
          usuario_id: string | null
          visualizado_em: string
        }
        Insert: {
          id?: string
          projeto_id: string
          usuario_id?: string | null
          visualizado_em?: string
        }
        Update: {
          id?: string
          projeto_id?: string
          usuario_id?: string | null
          visualizado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_visualizacao_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projeto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_visualizacao_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      tag: {
        Row: {
          categoria: string | null
          criado_em: string
          id: number
          nome: string
        }
        Insert: {
          categoria?: string | null
          criado_em?: string
          id?: number
          nome: string
        }
        Update: {
          categoria?: string | null
          criado_em?: string
          id?: number
          nome?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adquirir_lock_documento: {
        Args: { p_documento_id: string; p_usuario_id: string }
        Returns: Json
      }
      criar_notificacao_sistema: {
        Args: {
          p_comentario_id?: string
          p_documento_id?: string
          p_mensagem?: string
          p_projeto_id?: string
          p_tipo: string
          p_usuario_id: string
        }
        Returns: undefined
      }
      eh_admin: {
        Args: { p_usuario_id: string }
        Returns: boolean
      }
      eh_colaborador: {
        Args: { p_projeto_id: string; p_usuario_id: string }
        Returns: boolean
      }
      eh_dono_projeto: {
        Args: { p_projeto_id: string; p_usuario_id: string }
        Returns: boolean
      }
      existe_bloqueio: {
        Args: { p_bloqueado: string; p_bloqueador: string }
        Returns: boolean
      }
      incrementar_visualizacao: {
        Args: { p_projeto_id: string; p_usuario_id?: string }
        Returns: undefined
      }
      notificar_favoritos_capitulo_publicado: {
        Args: {
          p_documento_id: string
          p_mensagem: string
          p_projeto_id: string
        }
        Returns: undefined
      }
      recalcular_avaliacao_projeto: {
        Args: { p_projeto_id: string }
        Returns: undefined
      }
      reordenar_documentos: {
        Args: { p_ordens: Json; p_projeto_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
