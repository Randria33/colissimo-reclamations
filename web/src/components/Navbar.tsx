'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Bell, User, Truck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function Navbar() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notifications, setNotifications] = useState(0)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          setProfile(data)
        }

        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('lu', false)

        setNotifications(count || 0)
      }
    }

    loadProfile()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">RZ</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                RZ Réclamations
              </h1>
              {profile && (
                <p className="text-xs text-gray-500">
                  {profile.role === 'admin' ? 'Administrateur' : `Chauffeur - Circuit ${profile.circuit}`}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {profile?.role === 'admin' && (
              <Link
                href="/dashboard/utilisateurs"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                title="Gestion des utilisateurs"
              >
                <Users className="w-5 h-5" />
              </Link>
            )}

            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.full_name}
                </p>
                <p className="text-xs text-gray-500">
                  {profile?.email}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                <User className="w-5 h-5" />
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
