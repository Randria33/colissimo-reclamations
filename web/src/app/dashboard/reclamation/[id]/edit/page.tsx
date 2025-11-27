'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Save, Upload, X, FileImage, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditReclamationPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    num_colis: '',
    ref_dossier: '',
    adresse_client: '',
    circuit: '',
    type_reclamation: 'Réclamation Locale',
    motif: '',
    date_remise_reclamation: '',
    date_cloture_avant: '',
    date_retour_chauffeur: '',
    remarque: '',
    action_commentaire: '',
    priorite: 'normale',
    statut: 'en_attente',
  })

  useEffect(() => {
    loadReclamation()
  }, [params.id])

  const loadReclamation = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('reclamations')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Erreur:', error)
        alert('Réclamation introuvable')
        router.push('/dashboard')
        return
      }

      setFormData({
        num_colis: data.num_colis || '',
        ref_dossier: data.ref_dossier || '',
        adresse_client: data.adresse_client || '',
        circuit: data.circuit?.toString() || '',
        type_reclamation: data.type_reclamation || 'Réclamation Locale',
        motif: data.motif || '',
        date_remise_reclamation: data.date_remise_reclamation || '',
        date_cloture_avant: data.date_cloture_avant || '',
        date_retour_chauffeur: data.date_retour_chauffeur || '',
        remarque: data.remarque || '',
        action_commentaire: data.action_commentaire || '',
        priorite: data.priorite || 'normale',
        statut: data.statut || 'en_attente',
      })
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)])
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const updateData: any = {
        ...formData,
        circuit: parseInt(formData.circuit),
        updated_at: new Date().toISOString()
      }

      // Ne pas envoyer date_retour_chauffeur si vide
      if (!formData.date_retour_chauffeur) {
        delete updateData.date_retour_chauffeur
      }

      const { error: updateError } = await supabase
        .from('reclamations')
        .update(updateData)
        .eq('id', params.id)

      if (updateError) throw updateError

      // Upload des nouveaux fichiers
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${params.id}/${Date.now()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('reclamations')
            .upload(fileName, file)

          if (uploadError) {
            console.error('Erreur upload:', uploadError)
            continue
          }

          const { data: { publicUrl } } = supabase.storage
            .from('reclamations')
            .getPublicUrl(fileName)

          await supabase.from('fichiers').insert([{
            reclamation_id: params.id,
            nom_fichier: file.name,
            url_fichier: publicUrl,
            type_fichier: file.type,
            uploaded_by: user.id
          }])
        }
      }

      alert('Réclamation mise à jour avec succès')
      router.push(`/dashboard/reclamation/${params.id}`)
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour de la réclamation')
    } finally {
      setSaving(false)
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/dashboard/reclamation/${params.id}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à la réclamation
        </Link>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Modifier la Réclamation
            </h2>
            <p className="text-gray-600 mt-1">
              Modifiez les informations de la réclamation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de colis *
                </label>
                <input
                  type="text"
                  name="num_colis"
                  value={formData.num_colis}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [color:black]"
                  placeholder="6A04563232564"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Référence dossier *
                </label>
                <input
                  type="text"
                  name="ref_dossier"
                  value={formData.ref_dossier}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [color:black]"
                  placeholder="COL-81524694"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Circuit *
                </label>
                <select
                  name="circuit"
                  value={formData.circuit}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [color:black]"
                >
                  <option value="">Sélectionner un circuit</option>
                  <option value="541">541</option>
                  <option value="542">542</option>
                  <option value="543">543</option>
                  <option value="544">544</option>
                  <option value="545">545</option>
                  <option value="546">546</option>
                  <option value="547">547</option>
                  <option value="548">548</option>
                  <option value="549">549</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de réclamation *
                </label>
                <select
                  name="type_reclamation"
                  value={formData.type_reclamation}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [color:black]"
                >
                  <option>Réclamation Locale</option>
                  <option>Demande client</option>
                  <option>Avis de prise en charge</option>
                  <option>Attestation de livraison</option>
                  <option>Litige</option>
                  <option>Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut *
                </label>
                <select
                  name="statut"
                  value={formData.statut}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [color:black]"
                >
                  <option value="en_attente">En attente</option>
                  <option value="en_cours">En cours</option>
                  <option value="cloture">Clôturé</option>
                  <option value="annule">Annulé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  name="priorite"
                  value={formData.priorite}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [color:black]"
                >
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de remise *
                </label>
                <input
                  type="date"
                  name="date_remise_reclamation"
                  value={formData.date_remise_reclamation}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [color:black]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  À clôturer avant *
                </label>
                <input
                  type="date"
                  name="date_cloture_avant"
                  value={formData.date_cloture_avant}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [color:black]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date retour chauffeur
                </label>
                <input
                  type="date"
                  name="date_retour_chauffeur"
                  value={formData.date_retour_chauffeur}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [color:black]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse du client
              </label>
              <input
                type="text"
                name="adresse_client"
                value={formData.adresse_client}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [color:black]"
                placeholder="123 Rue Example, 75001 Paris"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif *
              </label>
              <textarea
                name="motif"
                value={formData.motif}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [color:black]"
                placeholder="Livraison contesté-Contest remise main propre"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarque
              </label>
              <textarea
                name="remarque"
                value={formData.remarque}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [color:black]"
                placeholder="Livré conforme"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action attendue / Commentaire
              </label>
              <textarea
                name="action_commentaire"
                value={formData.action_commentaire}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent [color:black]"
                placeholder="Prise en charge"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ajouter des fichiers
              </label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    Cliquez pour ajouter des fichiers
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Images, PDF, Documents (max 5MB par fichier)
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileImage className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer les modifications
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
