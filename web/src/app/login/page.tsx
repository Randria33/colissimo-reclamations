'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogIn, ShieldCheck, Truck } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginType, setLoginType] = useState<'admin' | 'chauffeur' | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!loginType) {
      setError('Veuillez sélectionner votre type de compte (Admin ou Chauffeur)')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (signInError.message.includes('Invalid API key')) {
          setError('Erreur de configuration. Vérifiez les clés Supabase')
        } else if (signInError.message.includes('Invalid login credentials')) {
          setError('Email ou mot de passe incorrect')
        } else {
          setError(signInError.message)
        }
        return
      }

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          setError('Profil utilisateur introuvable. Contactez un administrateur.')
          return
        }

        if (profile?.role !== loginType) {
          await supabase.auth.signOut()
          setError(`Ce compte n'est pas un compte ${loginType === 'admin' ? 'administrateur' : 'chauffeur'}`)
          return
        }

        if (profile.role === 'admin') {
          router.push('/dashboard')
        } else {
          router.push('/chauffeur')
        }
        router.refresh()
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Une erreur est survenue')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="relative w-48 h-48">
                <Image
                  src="/logo-rz.png"
                  alt="RoadZenith Logo"
                  width={192}
                  height={192}
                  className="rounded-2xl"
                  priority
                  onError={(e) => {
                    // Fallback si le logo ne charge pas
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
                <noscript>
                  <div className="w-48 h-48 bg-gray-900 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-6xl font-bold">RZ</span>
                  </div>
                </noscript>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestion des Réclamations
            </h1>
            <p className="text-gray-600">
              Colissimo - RoadZenith
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Sélection du type de compte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Je suis :
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setLoginType('admin')}
                  className={`p-4 border-2 rounded-lg transition ${
                    loginType === 'admin'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <ShieldCheck className={`w-8 h-8 ${loginType === 'admin' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`font-medium ${loginType === 'admin' ? 'text-blue-600' : 'text-gray-700'}`}>
                      Admin
                    </span>
                    <span className="text-xs text-gray-500">Gestion complète</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLoginType('chauffeur')}
                  className={`p-4 border-2 rounded-lg transition ${
                    loginType === 'chauffeur'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Truck className={`w-8 h-8 ${loginType === 'chauffeur' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`font-medium ${loginType === 'chauffeur' ? 'text-green-600' : 'text-gray-700'}`}>
                      Chauffeur
                    </span>
                    <span className="text-xs text-gray-500">Suivi terrain</span>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="loginEmail"
                name="loginEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition [color:black]"
                placeholder="votre.email@example.com"
                required
                autoComplete="email"
                spellCheck="false"
              />
            </div>

            <div>
              <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                id="loginPassword"
                name="loginPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition [color:black]"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                spellCheck="false"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !loginType}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Se connecter
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          Besoin d&apos;aide ? Contactez votre administrateur
        </div>
      </div>
    </div>
  )
}
