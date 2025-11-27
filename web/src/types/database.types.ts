export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'chauffeur'
          circuit: number | null
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'chauffeur'
          circuit?: number | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'chauffeur'
          circuit?: number | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reclamations: {
        Row: {
          id: string
          num_colis: string
          ref_dossier: string
          adresse_client: string | null
          circuit: number
          type_reclamation: string
          motif: string
          date_remise_reclamation: string
          date_cloture_avant: string
          date_retour_chauffeur: string | null
          remarque: string | null
          action_commentaire: string | null
          statut: 'en_attente' | 'en_cours' | 'cloture' | 'annule'
          priorite: 'basse' | 'normale' | 'haute' | 'urgente'
          created_by: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          num_colis: string
          ref_dossier: string
          adresse_client?: string | null
          circuit: number
          type_reclamation: string
          motif: string
          date_remise_reclamation: string
          date_cloture_avant: string
          date_retour_chauffeur?: string | null
          remarque?: string | null
          action_commentaire?: string | null
          statut?: 'en_attente' | 'en_cours' | 'cloture' | 'annule'
          priorite?: 'basse' | 'normale' | 'haute' | 'urgente'
          created_by?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          num_colis?: string
          ref_dossier?: string
          adresse_client?: string | null
          circuit?: number
          type_reclamation?: string
          motif?: string
          date_remise_reclamation?: string
          date_cloture_avant?: string
          date_retour_chauffeur?: string | null
          remarque?: string | null
          action_commentaire?: string | null
          statut?: 'en_attente' | 'en_cours' | 'cloture' | 'annule'
          priorite?: 'basse' | 'normale' | 'haute' | 'urgente'
          created_by?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      fichiers: {
        Row: {
          id: string
          reclamation_id: string
          file_name: string
          file_path: string
          file_type: string
          file_size: number | null
          description: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reclamation_id: string
          file_name: string
          file_path: string
          file_type: string
          file_size?: number | null
          description?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reclamation_id?: string
          file_name?: string
          file_path?: string
          file_type?: string
          file_size?: number | null
          description?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      historique: {
        Row: {
          id: string
          reclamation_id: string
          user_id: string | null
          action: string
          champ_modifie: string | null
          ancienne_valeur: string | null
          nouvelle_valeur: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reclamation_id: string
          user_id?: string | null
          action: string
          champ_modifie?: string | null
          ancienne_valeur?: string | null
          nouvelle_valeur?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reclamation_id?: string
          user_id?: string | null
          action?: string
          champ_modifie?: string | null
          ancienne_valeur?: string | null
          nouvelle_valeur?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          reclamation_id: string
          type: 'nouvelle' | 'assignation' | 'modification' | 'echeance' | 'cloture'
          message: string
          lu: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reclamation_id: string
          type: 'nouvelle' | 'assignation' | 'modification' | 'echeance' | 'cloture'
          message: string
          lu?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reclamation_id?: string
          type?: 'nouvelle' | 'assignation' | 'modification' | 'echeance' | 'cloture'
          message?: string
          lu?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      stats_reclamations: {
        Row: {
          total: number | null
          en_attente: number | null
          en_cours: number | null
          cloture: number | null
          en_retard: number | null
          echeance_prochaine: number | null
        }
      }
      stats_par_circuit: {
        Row: {
          circuit: number | null
          total: number | null
          en_attente: number | null
          en_cours: number | null
          cloture: number | null
        }
      }
    }
    Functions: {
      search_reclamations: {
        Args: {
          search_query?: string
          search_circuit?: number
          search_statut?: string
          search_date_debut?: string
          search_date_fin?: string
        }
        Returns: {
          id: string
          num_colis: string
          ref_dossier: string
          circuit: number
          statut: string
          date_remise_reclamation: string
          date_cloture_avant: string
          priorite: string
        }[]
      }
    }
  }
}
