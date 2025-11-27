'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import {
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Upload,
  Eye,
  Edit
} from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database.types'

type Reclamation = Database['public']['Tables']['reclamations']['Row']

export default function DashboardPage() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    en_attente: 0,
    en_cours: 0,
    cloture: 0,
    en_retard: 0,
  })

  useEffect(() => {
    loadReclamations()
    loadStats()
  }, [])

  const loadReclamations = async () => {
    try {
      const supabase = createClient()
      let query = supabase
        .from('reclamations')
        .select('*')
        .order('date_remise_reclamation', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('statut', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setReclamations(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('stats_reclamations')
        .select('*')
        .single()

      if (error) throw error
      if (data) {
        setStats({
          total: data.total || 0,
          en_attente: data.en_attente || 0,
          en_cours: data.en_cours || 0,
          cloture: data.cloture || 0,
          en_retard: data.en_retard || 0,
        })
      }
    } catch (error) {
      console.error('Erreur stats:', error)
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

  const getPrioriteBadge = (priorite: string) => {
    const styles = {
      basse: 'bg-gray-100 text-gray-700',
      normale: 'bg-blue-100 text-blue-700',
      haute: 'bg-orange-100 text-orange-700',
      urgente: 'bg-red-100 text-red-700',
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[priorite as keyof typeof styles]}`}>
        {priorite}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-3xl font-bold text-gray-900">{stats.en_attente}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-3xl font-bold text-gray-900">{stats.en_cours}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clôturés</p>
                <p className="text-3xl font-bold text-gray-900">{stats.cloture}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En retard</p>
                <p className="text-3xl font-bold text-gray-900">{stats.en_retard}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Réclamations
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

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="en_attente">En attente</option>
                  <option value="en_cours">En cours</option>
                  <option value="cloture">Clôturé</option>
                </select>

                <Link
                  href="/dashboard/nouvelle"
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
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucune réclamation trouvée</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Num Colis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Circuit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      À clôturer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priorité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReclamations.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {rec.num_colis}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {rec.ref_dossier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {rec.circuit}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {rec.type_reclamation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(rec.date_remise_reclamation).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(rec.date_cloture_avant).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPrioriteBadge(rec.priorite)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(rec.statut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/reclamation/${rec.id}`}
                            className="text-blue-600 hover:text-blue-800"
                            title="Voir"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <Link
                            href={`/dashboard/reclamation/${rec.id}/edit`}
                            className="text-green-600 hover:text-green-800"
                            title="Modifier"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
