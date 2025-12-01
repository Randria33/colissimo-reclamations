'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Activity,
  FileText,
  MessageSquare,
  Upload,
  Edit,
  Clock,
  User,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plus,
  Phone,
  Mail
} from 'lucide-react'

type ActivityLog = {
  id: string
  action_type: string
  action_description: string
  user_name: string
  user_role: string
  old_value: any
  new_value: any
  created_at: string
}

type ActivityTimelineProps = {
  reclamationId: string
}

export default function ActivityTimeline({ reclamationId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [reclamationId])

  const loadActivities = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_reclamation_history', {
        reclamation_uuid: reclamationId
      })

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Erreur chargement historique:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (actionType: string) => {
    const iconClass = "w-5 h-5"
    switch (actionType) {
      case 'created':
        return <Plus className={iconClass} />
      case 'status_changed':
        return <TrendingUp className={iconClass} />
      case 'priority_changed':
        return <AlertCircle className={iconClass} />
      case 'message_sent':
        return <MessageSquare className={iconClass} />
      case 'document_uploaded':
        return <Upload className={iconClass} />
      case 'comment_updated':
      case 'remark_updated':
        return <Edit className={iconClass} />
      case 'circuit_changed':
        return <Activity className={iconClass} />
      case 'return_date_updated':
        return <Clock className={iconClass} />
      case 'phone_call':
        return <Phone className={iconClass} />
      case 'email_sent':
        return <Mail className={iconClass} />
      case 'closed':
        return <CheckCircle className={iconClass} />
      default:
        return <FileText className={iconClass} />
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'status_changed':
        return 'bg-green-100 text-green-600 border-green-200'
      case 'priority_changed':
        return 'bg-orange-100 text-orange-600 border-orange-200'
      case 'message_sent':
        return 'bg-purple-100 text-purple-600 border-purple-200'
      case 'document_uploaded':
        return 'bg-indigo-100 text-indigo-600 border-indigo-200'
      case 'closed':
        return 'bg-emerald-100 text-emerald-600 border-emerald-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      chauffeur: 'bg-blue-100 text-blue-700 border-blue-200',
    }
    const labels = {
      admin: 'Admin',
      chauffeur: 'Chauffeur',
    }
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[role as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
        {labels[role as keyof typeof labels] || role}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center p-8">
        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Aucune activité enregistrée</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Historique d'activité
        </h3>
        <span className="text-sm text-gray-500">
          {activities.length} action{activities.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Ligne verticale */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Items */}
        <div className="space-y-6">
          {activities.map((activity, index) => (
            <div key={activity.id} className="relative pl-16">
              {/* Icône */}
              <div className={`absolute left-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getActionColor(activity.action_type)}`}>
                {getActionIcon(activity.action_type)}
              </div>

              {/* Contenu */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action_description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{activity.user_name}</span>
                      {getRoleBadge(activity.user_role)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(activity.created_at)}
                  </div>
                </div>

                {/* Détails des changements */}
                {(activity.old_value || activity.new_value) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {activity.old_value && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Avant :</p>
                          <div className="bg-red-50 border border-red-200 rounded px-2 py-1">
                            <code className="text-xs text-red-700">
                              {JSON.stringify(activity.old_value, null, 2)}
                            </code>
                          </div>
                        </div>
                      )}
                      {activity.new_value && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Après :</p>
                          <div className="bg-green-50 border border-green-200 rounded px-2 py-1">
                            <code className="text-xs text-green-700">
                              {JSON.stringify(activity.new_value, null, 2)}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistiques */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
            <p className="text-xs text-gray-600">Total actions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {activities.filter(a => a.action_type === 'message_sent').length}
            </p>
            <p className="text-xs text-gray-600">Messages</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {activities.filter(a => a.action_type === 'status_changed').length}
            </p>
            <p className="text-xs text-gray-600">Changements</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {activities.filter(a => a.action_type === 'document_uploaded').length}
            </p>
            <p className="text-xs text-gray-600">Documents</p>
          </div>
        </div>
      </div>
    </div>
  )
}
