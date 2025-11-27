'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import MessageThread from '@/components/MessageThread'
import { ArrowLeft, Calendar, Clock, MapPin, FileText, Image as ImageIcon, Download } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Reclamation = Database['public']['Tables']['reclamations']['Row']
type Fichier = Database['public']['Tables']['fichiers']['Row']

export default function ReclamationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [reclamation, setReclamation] = useState<Reclamation | null>(null)
  const [fichiers, setFichiers] = useState<Fichier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadReclamation()
      loadFichiers()
    }
  }, [params.id])

  const loadReclamation = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('reclamations')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setReclamation(data)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Réclamation introuvable')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadFichiers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('fichiers')
        .select('*')
        .eq('reclamation_id', params.id)

      if (error) throw error
      setFichiers(data || [])
    } catch (error) {
      console.error('Erreur fichiers:', error)
    }
  }

  const getStatusBadge = (statut: string) => {
    const styles = {
      en_attente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      en_cours: 'bg-blue-100 text-blue-800 border-blue-300',
      cloture: 'bg-green-100 text-green-800 border-green-300',
      annule: 'bg-gray-100 text-gray-800 border-gray-300',
    }

    const labels = {
      en_attente: 'En attente',
      en_cours: 'En cours',
      cloture: 'Clôturé',
      annule: 'Annulé',
    }

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[statut as keyof typeof styles]}`}>
        {labels[statut as keyof typeof labels]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!reclamation) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Détails de la réclamation */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {reclamation.num_colis}
                    </h1>
                    <p className="text-gray-600">{reclamation.ref_dossier}</p>
                  </div>
                  {getStatusBadge(reclamation.statut)}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Circuit
                    </label>
                    <p className="text-lg font-semibold text-gray-900">{reclamation.circuit}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Type
                    </label>
                    <p className="text-lg text-gray-900">{reclamation.type_reclamation}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Date de remise
                    </label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Calendar className="w-4 h-4" />
                      {new Date(reclamation.date_remise_reclamation).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      À clôturer avant
                    </label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Clock className="w-4 h-4" />
                      {new Date(reclamation.date_cloture_avant).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>

                {reclamation.adresse_client && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Adresse du client
                    </label>
                    <div className="flex items-start gap-2 text-gray-900 bg-gray-50 p-3 rounded-lg">
                      <MapPin className="w-4 h-4 mt-1" />
                      {reclamation.adresse_client}
                    </div>
                  </div>
                )}

                {reclamation.motif && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Motif
                    </label>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-900 whitespace-pre-wrap">{reclamation.motif}</p>
                    </div>
                  </div>
                )}

                {reclamation.remarque && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Remarque
                    </label>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-gray-900 whitespace-pre-wrap">{reclamation.remarque}</p>
                    </div>
                  </div>
                )}

                {reclamation.action_commentaire && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Action / Commentaire
                    </label>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-gray-900 whitespace-pre-wrap">{reclamation.action_commentaire}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fichiers joints */}
            {fichiers.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Fichiers joints ({fichiers.length})
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {fichiers.map((file) => (
                      <a
                        key={file.id}
                        href={file.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition"
                      >
                        {file.file_type.startsWith('image/') ? (
                          <img
                            src={file.file_path}
                            alt={file.file_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                            <FileText className="w-12 h-12 text-gray-400" />
                            <p className="text-xs text-gray-600 mt-2 px-2 text-center truncate w-full">
                              {file.file_name}
                            </p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center">
                          <Download className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Messagerie */}
          <div className="lg:col-span-1">
            <MessageThread reclamationId={params.id as string} />
          </div>
        </div>
      </div>
    </div>
  )
}
