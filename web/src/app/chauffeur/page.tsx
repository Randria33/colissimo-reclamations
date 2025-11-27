'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Search, Clock, CheckCircle, AlertCircle, MessageSquare, MapPin } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database.types'

type Reclamation = Database['public']['Tables']['reclamations']['Row'] & {
  unread_messages?: number
}

export default function ChauffeurPage() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    en_cours: 0,
    terminees: 0,
  })

  useEffect(() => {
    loadReclamations()
  }, [])

  const loadReclamations = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Récupérer le circuit du chauffeur
      const { data: profile } = await supabase
        .from('profiles')
        .select('circuit')
        .eq('id', user.id)
        .single()

      if (!profile?.circuit) {
        setLoading(false)
        return
      }

      // Récupérer les réclamations du circuit
      const { data, error } = await supabase
        .from('reclamations')
        .select('*')
        .eq('circuit', profile.circuit)
        .order('date_remise_reclamation', { ascending: false })

      if (error) {
        console.error('Erreur de chargement:', error.message)
        setReclamations([])
      } else {
        const recs = data || []
        setReclamations(recs)

        setStats({
          total: recs.filter(r => r.statut !== 'cloture').length,
          en_cours: recs.filter(r => r.statut === 'en_cours').length,
          terminees: recs.filter(r => r.statut === 'cloture').length,
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
      setReclamations([])
    } finally {
      setLoading(false)
    }
  }

  const filteredReclamations = reclamations.filter(rec =>
    rec.num_colis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.ref_dossier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.adresse_client?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[statut as keyof typeof styles]}`}>
        {labels[statut as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête avec statistiques simplifiées */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Tickets</h1>
          <p className="text-gray-600">Gérez vos réclamations et communiquez avec l'administration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tickets actifs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En traitement</p>
                <p className="text-3xl font-bold text-gray-900">{stats.en_cours}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Résolus</p>
                <p className="text-3xl font-bold text-gray-900">{stats.terminees}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par numéro de colis, référence ou adresse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full [color:black]"
            />
          </div>
        </div>

        {/* Liste des tickets en style carte */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-12 bg-white rounded-lg shadow">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredReclamations.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-lg shadow">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun ticket trouvé</p>
            </div>
          ) : (
            filteredReclamations.map((rec) => (
              <div key={rec.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          Colis: {rec.num_colis}
                        </h3>
                        {getStatusBadge(rec.statut)}
                      </div>
                      <p className="text-sm text-gray-500">Réf: {rec.ref_dossier}</p>
                    </div>
                  </div>

                  {/* Adresse du client - Information principale */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Adresse client</p>
                        <p className="text-base text-gray-900 mt-1">{rec.adresse_client}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action attendue - Information clé */}
                  {rec.action_attendue && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Action à réaliser</p>
                      <p className="text-base text-gray-900 font-medium">{rec.action_attendue}</p>
                    </div>
                  )}

                  {/* Informations complémentaires */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Type:</span>
                      <span className="text-gray-900 font-medium">{rec.type_reclamation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">À clôturer avant:</span>
                      <span className="text-gray-900 font-medium">
                        {new Date(rec.date_cloture_avant).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>

                  {/* Motif si présent */}
                  {rec.motif && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Motif</p>
                      <p className="text-sm text-gray-900">{rec.motif}</p>
                    </div>
                  )}

                  {/* Bouton pour ouvrir le ticket et discuter */}
                  <Link
                    href={`/chauffeur/reclamation/${rec.id}`}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Ouvrir le ticket et discuter avec l'admin
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
