'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, MessageCircle, User } from 'lucide-react'

interface Message {
  id: string
  message: string
  created_at: string
  user_id: string
  full_name: string
  role: string
}

interface MessageThreadProps {
  reclamationId: string
}

export default function MessageThread({ reclamationId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    loadMessages()
    getCurrentUser()

    // Subscribe to new messages in real-time
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${reclamationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `reclamation_id=eq.${reclamationId}`,
        },
        () => {
          loadMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [reclamationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getCurrentUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
    }
  }

  const loadMessages = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('messages_with_user')
        .select('*')
        .eq('reclamation_id', reclamationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Erreur chargement messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('messages')
        .insert([{
          reclamation_id: reclamationId,
          user_id: user.id,
          message: newMessage.trim()
        }])

      if (error) throw error

      setNewMessage('')
      await loadMessages()
    } catch (error) {
      console.error('Erreur envoi message:', error)
      alert('Erreur lors de l\'envoi du message')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Communication</h3>
        <span className="text-sm text-gray-500">({messages.length} messages)</span>
      </div>

      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun message pour le moment</p>
            <p className="text-sm">Commencez la conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.user_id === currentUserId
            const isAdmin = msg.role === 'admin'

            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isCurrentUser
                      ? 'bg-blue-600 text-white'
                      : isAdmin
                      ? 'bg-green-100 text-gray-900'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isCurrentUser
                          ? 'bg-blue-800 text-white'
                          : isAdmin
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-600 text-white'
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-medium ${isCurrentUser ? 'text-blue-100' : 'text-gray-600'}`}>
                      {msg.full_name}
                      {isAdmin && ' (Admin)'}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
                    {formatDate(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            {loading ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </form>
    </div>
  )
}
