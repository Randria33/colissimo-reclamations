'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import {
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Users
} from 'lucide-react'

type StatsChauffeur = {
  chauffeur_id: string
  full_name: string
  circuit: number
  email: string
  total_reclamations: number
  reclamations_cloturees: number
  reclamations_en_cours: number
  reclamations_en_attente: number
  taux_resolution: number
  temps_moyen_resolution_heures: number
  reclamations_urgentes: number
  urgentes_resolues: number
  dans_les_delais: number
  hors_delais: number
  score_performance: number
  derniere_activite: string
}

type StatsCircuit = {
  circuit: number
  total_reclamations: number
  cloturees: number
  en_cours: number
  en_attente: number
  taux_cloture: number
  temps_moyen_heures: number
  urgentes: number
  en_retard: number
}

type TopMotif = {
  motif: string
  occurrences: number
  pourcentage: number
  resolues: number
  temps_moyen_resolution: number
}

export default function StatistiquesPage() {
  const [statsChauffeurs, setStatsChauffeurs] = useState<StatsChauffeur[]>([])
  const [statsCircuits, setStatsCircuits] = useState<StatsCircuit[]>([])
  const [topMotifs, setTopMotifs] = useState<TopMotif[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistiques()
  }, [])

  const loadStatistiques = async () => {
    try {
      const supabase = createClient()

      // Charger stats chauffeurs
      const { data: chauffeurs } = await supabase
        .from('stats_chauffeurs')
        .select('*')
        .order('score_performance', { ascending: false })

      // Charger stats circuits
      const { data: circuits } = await supabase
        .from('stats_par_circuit')
        .select('*')

      // Charger top motifs
      const { data: motifs } = await supabase
        .from('top_motifs')
        .select('*')

      setStatsChauffeurs(chauffeurs || [])
      setStatsCircuits(circuits || [])
      setTopMotifs(motifs || [])
    } catch (error) {
      console.error('Erreur chargement statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return { text: 'Excellent', icon: Award, color: 'text-green-600' }
    if (score >= 60) return { text: 'Bon', icon: CheckCircle, color: 'text-blue-600' }
    if (score >= 40) return { text: 'Moyen', icon: Clock, color: 'text-orange-600' }
    return { text: 'À améliorer', icon: AlertTriangle, color: 'text-red-600' }
  }

  // Statistiques globales
  const statsGlobales = {
    totalChauffeurs: statsChauffeurs.length,
    totalReclamations: statsChauffeurs.reduce((sum, c) => sum + c.total_reclamations, 0),
    tauxResolutionMoyen: statsChauffeurs.length > 0
      ? (statsChauffeurs.reduce((sum, c) => sum + (c.taux_resolution || 0), 0) / statsChauffeurs.length).toFixed(2)
      : 0,
    scorePerformanceMoyen: statsChauffeurs.length > 0
      ? (statsChauffeurs.reduce((sum, c) => sum + (c.score_performance || 0), 0) / statsChauffeurs.length).toFixed(2)
      : 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Tableau de Bord & Statistiques
          </h1>
          <p className="text-gray-600 mt-2">
            Vue d'ensemble des performances et indicateurs clés
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Statistiques Globales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Chauffeurs Actifs</p>
                    <p className="text-3xl font-bold text-gray-900">{statsGlobales.totalChauffeurs}</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Réclamations Totales</p>
                    <p className="text-3xl font-bold text-gray-900">{statsGlobales.totalReclamations}</p>
                  </div>
                  <Target className="w-10 h-10 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taux Résolution Moyen</p>
                    <p className="text-3xl font-bold text-gray-900">{statsGlobales.tauxResolutionMoyen}%</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-purple-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Performance Moyenne</p>
                    <p className="text-3xl font-bold text-gray-900">{statsGlobales.scorePerformanceMoyen}/100</p>
                  </div>
                  <Award className="w-10 h-10 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Performance par Chauffeur */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Performance par Chauffeur
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rang</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chauffeur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Circuit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clôturées</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taux</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temps Moy.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgentes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Délais</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Badge</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statsChauffeurs.map((chauffeur, index) => {
                      const badge = getPerformanceBadge(chauffeur.score_performance || 0)
                      const BadgeIcon = badge.icon
                      return (
                        <tr key={chauffeur.chauffeur_id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {index === 0 && <Award className="w-5 h-5 text-yellow-500 mr-2" />}
                              {index === 1 && <Award className="w-5 h-5 text-gray-400 mr-2" />}
                              {index === 2 && <Award className="w-5 h-5 text-orange-400 mr-2" />}
                              <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{chauffeur.full_name}</div>
                            <div className="text-xs text-gray-500">{chauffeur.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {chauffeur.circuit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {chauffeur.total_reclamations}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            {chauffeur.reclamations_cloturees}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">{chauffeur.taux_resolution?.toFixed(1)}%</span>
                              {chauffeur.taux_resolution >= 80 ? (
                                <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
                              ) : chauffeur.taux_resolution < 50 ? (
                                <TrendingDown className="w-4 h-4 text-red-500 ml-1" />
                              ) : null}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {chauffeur.temps_moyen_resolution_heures?.toFixed(1)}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {chauffeur.urgentes_resolues}/{chauffeur.reclamations_urgentes}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                ✓ {chauffeur.dans_les_delais}
                              </span>
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                                ⚠ {chauffeur.hors_delais}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${getPerformanceColor(chauffeur.score_performance || 0)}`}>
                              {chauffeur.score_performance?.toFixed(0)}/100
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <BadgeIcon className={`w-5 h-5 ${badge.color}`} />
                              <span className={`text-sm font-medium ${badge.color}`}>
                                {badge.text}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance par Circuit */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Target className="w-6 h-6 text-blue-600" />
                    Statistiques par Circuit
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {statsCircuits.map((circuit) => (
                      <div key={circuit.circuit} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">Circuit {circuit.circuit}</h3>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                            {circuit.total_reclamations} total
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Clôturées</p>
                            <p className="text-green-600 font-bold">{circuit.cloturees}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">En cours</p>
                            <p className="text-blue-600 font-bold">{circuit.en_cours}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">En attente</p>
                            <p className="text-yellow-600 font-bold">{circuit.en_attente}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Taux de clôture</span>
                            <span className="text-sm font-bold text-gray-900">{circuit.taux_cloture}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${circuit.taux_cloture}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Motifs */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <PieChart className="w-6 h-6 text-blue-600" />
                    Top Motifs de Réclamation
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {topMotifs.map((motif, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{motif.motif}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {motif.occurrences} cas • {motif.pourcentage}% du total
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-3 text-sm">
                          <div>
                            <span className="text-gray-500">Résolues: </span>
                            <span className="text-green-600 font-medium">{motif.resolues}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Temps moy: </span>
                            <span className="text-blue-600 font-medium">{motif.temps_moyen_resolution?.toFixed(1)}h</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
