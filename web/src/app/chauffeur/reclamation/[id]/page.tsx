'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { ArrowLeft, Send, MapPin, Calendar, Package, AlertCircle, User, CheckCircle2, Upload, FileText, X, CheckCircle, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database.types'

type Reclamation = Database['public']['Tables']['reclamations']['Row']
type Fichier = {
  id: string
  nom_fichier: string
  url_fichier: string
  type_fichier: string
  uploaded_at: string
}
type Message = {
  id: string
  message: string
  created_at: string
  user_id: string
  user_name: string
  user_role: 'admin' | 'chauffeur'
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [reclamation, setReclamation] = useState<Reclamation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [fichiers, setFichiers] = useState<Fichier[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadTicket()
    loadFichiers()

    let cleanup: (() => void) | undefined

    loadMessages().then((cleanupFn) => {
      cleanup = cleanupFn
    })

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [params.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadTicket = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setCurrentUserId(user.id)

      const { data, error } = await supabase
        .from('reclamations')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Erreur:', error.message)
      } else {
        setReclamation(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          message,
          created_at,
          user_id,
          profiles!messages_user_id_fkey (
            full_name,
            role
          )
        `)
        .eq('reclamation_id', params.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erreur messages:', error.message)
      } else {
        const formattedMessages = data?.map((msg: any) => ({
          id: msg.id,
          message: msg.message,
          created_at: msg.created_at,
          user_id: msg.user_id,
          user_name: msg.profiles?.full_name || 'Utilisateur',
          user_role: msg.profiles?.role || 'chauffeur'
        })) || []

        console.log('Messages chargés:', formattedMessages.length, formattedMessages)
        setMessages(formattedMessages)
      }

      // S'abonner aux nouveaux messages en temps réel
      const channel = supabase
        .channel(`messages:${params.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `reclamation_id=eq.${params.id}`
          },
          async (payload) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, role')
              .eq('id', payload.new.user_id)
              .single()

            const newMsg: Message = {
              id: payload.new.id,
              message: payload.new.message,
              created_at: payload.new.created_at,
              user_id: payload.new.user_id,
              user_name: profile?.full_name || 'Utilisateur',
              user_role: profile?.role || 'chauffeur'
            }

            setMessages(prev => [...prev, newMsg])
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const loadFichiers = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('fichiers')
        .select('*')
        .eq('reclamation_id', params.id)
        .order('uploaded_at', { ascending: false })

      if (error) {
        console.error('Erreur fichiers:', error.message)
      } else {
        setFichiers(data || [])
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || sending) return

    setSending(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from('messages')
        .insert({
          reclamation_id: params.id,
          user_id: user.id,
          message: newMessage.trim()
        })

      if (error) {
        console.error('Erreur envoi:', error.message)
        alert('Erreur lors de l\'envoi du message')
      } else {
        console.log('Message envoyé avec succès')
        setNewMessage('')
        // Recharger les messages pour être sûr
        await loadMessages()
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${params.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('reclamations')
          .upload(fileName, file)

        if (uploadError) {
          console.error('Erreur upload:', uploadError.message)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('reclamations')
          .getPublicUrl(fileName)

        await supabase.from('fichiers').insert({
          reclamation_id: params.id,
          nom_fichier: file.name,
          url_fichier: publicUrl,
          type_fichier: file.type,
          uploaded_by: user.id
        })
      }

      await loadFichiers()
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'envoi du fichier')
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateStatus = async (newStatus: 'cloture' | 'en_cours') => {
    if (!confirm(`Voulez-vous marquer ce ticket comme ${newStatus === 'cloture' ? 'résolu' : 'non résolu'} ?`)) {
      return
    }

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('reclamations')
        .update({ statut: newStatus })
        .eq('id', params.id)

      if (error) {
        console.error('Erreur:', error.message)
        alert('Erreur lors de la mise à jour du statut')
      } else {
        await loadTicket()
        alert(`Ticket marqué comme ${newStatus === 'cloture' ? 'résolu' : 'non résolu'}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const getStatusInfo = (statut: string) => {
    const info = {
      en_attente: { color: 'yellow', label: 'En attente', icon: AlertCircle },
      en_cours: { color: 'blue', label: 'En traitement', icon: Package },
      cloture: { color: 'green', label: 'Résolu', icon: CheckCircle2 },
      annule: { color: 'gray', label: 'Annulé', icon: AlertCircle },
    }
    return info[statut as keyof typeof info] || info.en_attente
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center p-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!reclamation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket introuvable</h2>
            <Link href="/chauffeur" className="text-blue-600 hover:text-blue-800">
              Retour aux tickets
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(reclamation.statut)
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Retour */}
        <Link
          href="/chauffeur"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux tickets
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne 1: Informations du ticket */}
          <div className="lg:col-span-1 space-y-6">
            {/* Informations principales */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <StatusIcon className={`w-6 h-6 text-${statusInfo.color}-600`} />
                <h2 className="text-lg font-bold text-gray-900">Informations</h2>
              </div>

              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800 mb-4`}>
                {statusInfo.label}
              </div>

              <div className="space-y-3">
                <div className="pb-3 border-b">
                  <p className="text-xs text-gray-500 mb-1">Numéro de colis</p>
                  <p className="text-lg font-bold text-gray-900">{reclamation.num_colis}</p>
                </div>

                <div className="pb-3 border-b">
                  <p className="text-xs text-gray-500 mb-1">Référence dossier</p>
                  <p className="text-base font-medium text-gray-900">{reclamation.ref_dossier}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Type de réclamation</p>
                  <p className="text-sm text-gray-900">{reclamation.type_reclamation}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Circuit</p>
                  <p className="text-sm font-medium text-gray-900">Circuit {reclamation.circuit}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Date de remise</p>
                  <p className="text-sm text-gray-900">
                    {new Date(reclamation.date_remise_reclamation).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">À clôturer avant</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <p className="text-sm font-bold text-orange-600">
                      {new Date(reclamation.date_cloture_avant).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                {reclamation.date_retour_chauffeur && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date retour chauffeur</p>
                    <p className="text-sm text-gray-900">
                      {new Date(reclamation.date_retour_chauffeur).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Adresse client */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <h3 className="text-lg font-bold text-gray-900">Adresse client</h3>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-base text-gray-900 leading-relaxed font-medium">
                  {reclamation.adresse_client}
                </p>
              </div>
            </div>

            {/* Action attendue */}
            {reclamation.action_commentaire && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Action à réaliser</h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <p className="text-base font-bold text-gray-900">
                    {reclamation.action_commentaire}
                  </p>
                </div>
              </div>
            )}

            {/* Motif et remarque */}
            {(reclamation.motif || reclamation.remarque) && (
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                {reclamation.motif && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Motif</p>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{reclamation.motif}</p>
                  </div>
                )}
                {reclamation.remarque && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Remarque</p>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{reclamation.remarque}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions rapides */}
            <div className="bg-white rounded-lg shadow p-6 space-y-3">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Actions</h3>

              <button
                onClick={() => handleUpdateStatus('cloture')}
                disabled={reclamation.statut === 'cloture'}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                Marquer comme résolu
              </button>

              <button
                onClick={() => handleUpdateStatus('en_cours')}
                disabled={reclamation.statut === 'en_cours'}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AlertCircle className="w-5 h-5" />
                Marquer comme non résolu
              </button>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Documents</h3>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 mb-4"
              >
                <Upload className="w-5 h-5" />
                {uploading ? 'Envoi...' : 'Envoyer un document'}
              </button>

              {fichiers.length > 0 && (
                <div className="space-y-2">
                  {fichiers.map((fichier) => (
                    <a
                      key={fichier.id}
                      href={fichier.url_fichier}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                    >
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {fichier.nom_fichier}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(fichier.uploaded_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Colonne 2-3: Chat */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow flex flex-col h-[calc(100vh-200px)]">
              {/* En-tête du chat */}
              <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-blue-600">
                <h2 className="text-xl font-bold text-white">Discussion avec l'administration</h2>
                <p className="text-sm text-blue-100 mt-1">
                  Posez vos questions et recevez de l'aide pour ce ticket
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-gray-600 font-medium">Aucun message pour le moment</p>
                    <p className="text-sm text-gray-500 mt-2">Commencez la discussion ci-dessous</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.user_id === currentUserId
                    const isAdmin = msg.user_role === 'admin'

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-3 max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isAdmin ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            <User className={`w-5 h-5 ${isAdmin ? 'text-red-600' : 'text-blue-600'}`} />
                          </div>

                          {/* Message */}
                          <div>
                            <div className={`rounded-2xl p-4 ${
                              isMe
                                ? 'bg-blue-600 text-white'
                                : isAdmin
                                ? 'bg-white border-2 border-red-200 text-gray-900'
                                : 'bg-white border border-gray-200 text-gray-900'
                            }`}>
                              <p className={`text-xs font-bold mb-2 ${
                                isMe ? 'text-blue-100' : isAdmin ? 'text-red-600' : 'text-blue-600'
                              }`}>
                                {isAdmin ? '👨‍💼 Administrateur' : '🚚 ' + msg.user_name}
                              </p>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            </div>
                            <p className={`text-xs text-gray-500 mt-1 px-2 ${isMe ? 'text-right' : 'text-left'}`}>
                              {new Date(msg.created_at).toLocaleString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Formulaire d'envoi */}
              <div className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [color:black]"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                    Envoyer
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
