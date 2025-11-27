'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Plus, Search, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database.types'

type Reclamation = Database['public']['Tables']['reclamations']['Row']

export default function ChauffeurPage() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    assignees: 0,
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

      const { data, error } = await supabase
        .from('reclamations')
        .select('*')
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
        .order('date_remise_reclamation', { ascending: false })

      if (error) {
        console.error('Erreur de chargement:', error.message)
        setReclamations([])
      } else {
        const recs = data || []
        setReclamations(recs)

        setStats({
          assignees: recs.filter(r => r.assigned_to === user.id && r.statut !== 'cloture').length,
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
    rec.ref_dossier.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mes réclamations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.assignees}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-3xl font-bold text-gray-900">{stats.en_cours}</p>
              </div>
              <Clock className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Terminées</p>
                <p className="text-3xl font-bold text-gray-900">{stats.terminees}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Mes Réclamations
              </h2>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
                  />
                </div>

                <Link
                  href="/chauffeur/nouvelle"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  <Plus className="w-5 h-5" />
                  Nouvelle réclamation
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredReclamations.length === 0 ? (
              <div className="text-center p-12">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucune réclamation</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredReclamations.map((rec) => (
                  <div key={rec.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {rec.num_colis}
                          </h3>
                          {getStatusBadge(rec.statut)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Référence:</span> {rec.ref_dossier}
                          </div>
                          <div>
                            <span className="font-medium">Circuit:</span> {rec.circuit}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {rec.type_reclamation}
                          </div>
                          <div>
                            <span className="font-medium">À clôturer:</span>{' '}
                            {new Date(rec.date_cloture_avant).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        {rec.motif && (
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            <span className="font-medium">Motif:</span> {rec.motif}
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/chauffeur/reclamation/${rec.id}`}
                        className="ml-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Eye className="w-5 h-5" />
                        Voir détails
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
