'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import {
  Archive,
  Search,
  Calendar,
  FileText,
  TrendingUp,
  Download,
  Eye
} from 'lucide-react'
import Link from 'next/link'

type ReclamationArchive = {
  id: string
  num_colis: string
  ref_dossier: string
  adresse_client: string
  circuit: number
  type_reclamation: string
  motif: string
  date_remise_reclamation: string
  date_cloture_avant: string
  date_cloture: string
  date_archivage: string
  statut: string
  priorite: string
  remarque: string | null
  action_commentaire: string | null
}

type ArchivageLog = {
  id: string
  action: string
  num_colis: string
  ref_dossier: string
  circuit: number
  date_cloture: string
  created_at: string
}

type Stats = {
  total_archives: number
  circuits_concernes: number
  premier_archivage: string | null
  dernier_archivage: string | null
  archives_30_derniers_jours: number
}

export default function ArchivesPage() {
  const [archives, setArchives] = useState<ReclamationArchive[]>([])
  const [logs, setLogs] = useState<ArchivageLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [circuitFilter, setCircuitFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'archives' | 'logs'>('archives')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()

      // Charger les archives
      const { data: archivesData } = await supabase
        .from('reclamations_archives')
        .select('*')
        .order('date_archivage', { ascending: false })

      // Charger les logs
      const { data: logsData } = await supabase
        .from('archivage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      // Charger les statistiques
      const { data: statsData } = await supabase
        .from('stats_archivage')
        .select('*')
        .single()

      setArchives(archivesData || [])
      setLogs(logsData || [])
      setStats(statsData)
    } catch (error) {
      console.error('Erreur chargement archives:', error)
    } finally {
      setLoading(false)
    }
  }

  const executeArchivage = async () => {
    if (!confirm('Voulez-vous exécuter l\'archivage maintenant ? Cela va archiver toutes les réclamations clôturées depuis plus de 3 mois.')) {
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('archiver_reclamations_cloturees')

      if (error) throw error

      alert(data[0]?.message || 'Archivage terminé')
      loadData() // Recharger les données
    } catch (error) {
      console.error('Erreur archivage:', error)
      alert('Erreur lors de l\'archivage')
    }
  }

  const filteredArchives = archives.filter(arc => {
    const matchesSearch = searchQuery === '' ||
      arc.num_colis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      arc.ref_dossier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      arc.adresse_client?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCircuit = circuitFilter === 'all' || arc.circuit.toString() === circuitFilter

    return matchesSearch && matchesCircuit
  })

  const exportArchives = () => {
    const exportData = filteredArchives.map(arc => ({
      'Num Colis': arc.num_colis,
      'Réf dossier': arc.ref_dossier,
      'Adresse': arc.adresse_client,
      'Circuit': arc.circuit,
      'Type': arc.type_reclamation,
      'Motif': arc.motif,
      'Date remise': arc.date_remise_reclamation,
      'Date clôture': new Date(arc.date_cloture).toLocaleDateString('fr-FR'),
      'Date archivage': new Date(arc.date_archivage).toLocaleDateString('fr-FR')
    }))

    const headers = Object.keys(exportData[0] || {})
    const csvContent = [
      headers.join(','),
      ...exportData.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row]
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `archives_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Archive className="w-8 h-8 text-blue-600" />
            Archives
          </h1>
          <p className="text-gray-600 mt-2">
            Réclamations clôturées archivées automatiquement après 3 mois
          </p>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total archives</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_archives}</p>
                </div>
                <Archive className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Circuits concernés</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.circuits_concernes}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">30 derniers jours</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.archives_30_derniers_jours}</p>
                </div>
                <Calendar className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Dernier archivage</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats.dernier_archivage
                      ? new Date(stats.dernier_archivage).toLocaleDateString('fr-FR')
                      : 'N/A'}
                  </p>
                </div>
                <FileText className="w-10 h-10 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {/* Onglets */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('archives')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'archives'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Archives ({archives.length})
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Logs ({logs.length})
              </button>
            </nav>
          </div>

          {activeTab === 'archives' ? (
            <>
              {/* Barre d'actions */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                      />
                    </div>

                    <select
                      value={circuitFilter}
                      onChange={(e) => setCircuitFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">Tous les circuits</option>
                      {[541, 542, 543, 544, 545, 546, 547, 548, 549].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={exportArchives}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                    >
                      <Download className="w-5 h-5" />
                      Exporter ({filteredArchives.length})
                    </button>

                    <button
                      onClick={executeArchivage}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                    >
                      <Archive className="w-5 h-5" />
                      Archiver maintenant
                    </button>
                  </div>
                </div>
              </div>

              {/* Table des archives */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredArchives.length === 0 ? (
                  <div className="text-center p-12">
                    <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Aucune archive trouvée</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Num Colis</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Circuit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date clôture</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date archivage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredArchives.map((arc) => (
                        <tr key={arc.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {arc.num_colis}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {arc.ref_dossier}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {arc.circuit}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {arc.type_reclamation}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(arc.date_cloture).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(arc.date_archivage).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => alert(`Détails:\n\nColis: ${arc.num_colis}\nDossier: ${arc.ref_dossier}\nAdresse: ${arc.adresse_client}\nMotif: ${arc.motif}\nRemarque: ${arc.remarque || 'N/A'}`)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Voir détails"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="p-6">
              <div className="overflow-x-auto">
                {logs.length === 0 ? (
                  <div className="text-center p-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Aucun log disponible</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Num Colis</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Circuit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date clôture</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(log.created_at).toLocaleString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {log.num_colis}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {log.ref_dossier}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {log.circuit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(log.date_cloture).toLocaleDateString('fr-FR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
