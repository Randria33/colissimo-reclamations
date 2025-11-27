'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Users, UserPlus, Shield, Truck, Mail, Phone, Edit, Trash2 } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function UtilisateursPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'admin' | 'chauffeur'>('all')

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProfiles = profiles.filter(p => {
    if (filter === 'all') return true
    return p.role === filter
  })

  const stats = {
    total: profiles.length,
    admins: profiles.filter(p => p.role === 'admin').length,
    chauffeurs: profiles.filter(p => p.role === 'chauffeur').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total utilisateurs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Administrateurs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.admins}</p>
              </div>
              <Shield className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chauffeurs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.chauffeurs}</p>
              </div>
              <Truck className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilter('admin')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'admin'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Admins
                </button>
                <button
                  onClick={() => setFilter('chauffeur')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === 'chauffeur'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Chauffeurs
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  Pour créer un nouvel utilisateur:
                </p>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Allez sur Supabase &gt; Authentication &gt; Users</li>
                  <li>Créez un nouvel utilisateur</li>
                  <li>Ajoutez son profil dans SQL Editor avec son UUID</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Circuit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Créé le
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProfiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            profile.role === 'admin' ? 'bg-green-100' : 'bg-orange-100'
                          }`}>
                            {profile.role === 'admin' ? (
                              <Shield className="w-5 h-5 text-green-600" />
                            ) : (
                              <Truck className="w-5 h-5 text-orange-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{profile.full_name}</p>
                            <p className="text-sm text-gray-500">ID: {profile.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-900">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {profile.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          profile.role === 'admin'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {profile.role === 'admin' ? 'Administrateur' : 'Chauffeur'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {profile.circuit || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {profile.phone ? (
                          <div className="flex items-center gap-2 text-gray-900">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {profile.phone}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Instructions pour créer un utilisateur */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Comment créer un nouvel utilisateur
          </h3>
          <div className="space-y-4 text-blue-800">
            <div>
              <p className="font-medium mb-2">1. Créer l'utilisateur dans Supabase:</p>
              <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                <li>Allez sur https://app.supabase.com</li>
                <li>Sélectionnez votre projet</li>
                <li>Allez dans Authentication &gt; Users</li>
                <li>Cliquez sur "Add user" &gt; "Create new user"</li>
                <li>Entrez l'email et le mot de passe</li>
                <li>Cochez "Auto Confirm User"</li>
                <li>Cliquez sur "Create user"</li>
                <li>Copiez l'UUID de l'utilisateur</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">2. Créer le profil dans la base de données:</p>
              <div className="bg-white rounded p-4 text-sm font-mono">
                <p className="text-gray-600 mb-2">-- Pour un admin:</p>
                <code className="text-blue-600">
                  INSERT INTO profiles (id, email, full_name, role)<br/>
                  VALUES ('UUID-ICI', 'email@example.com', 'Nom Complet', 'admin');
                </code>
                <p className="text-gray-600 mt-4 mb-2">-- Pour un chauffeur:</p>
                <code className="text-blue-600">
                  INSERT INTO profiles (id, email, full_name, role, circuit)<br/>
                  VALUES ('UUID-ICI', 'email@example.com', 'Nom Complet', 'chauffeur', 541);
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
