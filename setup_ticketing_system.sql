-- ============================================
-- SYSTÈME DE TICKETING COMPLET
-- ============================================

-- 1. AJOUTER DES COLONNES POUR LE TICKETING
ALTER TABLE reclamations
ADD COLUMN IF NOT EXISTS ticket_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS resolution_time INTERVAL,
ADD COLUMN IF NOT EXISTS first_response_time INTERVAL,
ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Générer automatiquement les numéros de ticket pour les enregistrements existants
UPDATE reclamations
SET ticket_number = 'RZ-' || LPAD(circuit::TEXT, 3, '0') || '-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || LPAD(SUBSTRING(id::TEXT, 1, 4), 4, '0')
WHERE ticket_number IS NULL;

-- 2. TABLE DES PIÈCES JOINTES (fichiers)
-- Note: La table 'fichiers' existe déjà dans le schéma principal
-- On ajoute juste les index si nécessaire
CREATE INDEX IF NOT EXISTS idx_fichiers_reclamation ON fichiers(reclamation_id);

-- 3. VUE DES STATISTIQUES PAR CHAUFFEUR
CREATE OR REPLACE VIEW stats_chauffeurs AS
SELECT
  p.id as chauffeur_id,
  p.full_name,
  p.circuit,
  p.email,

  -- Statistiques générales
  COUNT(r.id) as total_reclamations,
  COUNT(r.id) FILTER (WHERE r.statut = 'cloture') as reclamations_cloturees,
  COUNT(r.id) FILTER (WHERE r.statut = 'en_cours') as reclamations_en_cours,
  COUNT(r.id) FILTER (WHERE r.statut = 'en_attente') as reclamations_en_attente,

  -- Taux de résolution
  ROUND(
    100.0 * COUNT(r.id) FILTER (WHERE r.statut = 'cloture') /
    NULLIF(COUNT(r.id), 0),
    2
  ) as taux_resolution,

  -- Temps moyen de résolution (en heures)
  ROUND(
    EXTRACT(EPOCH FROM AVG(r.updated_at - r.created_at) FILTER (WHERE r.statut = 'cloture')) / 3600,
    2
  ) as temps_moyen_resolution_heures,

  -- Réclamations urgentes
  COUNT(r.id) FILTER (WHERE r.priorite = 'urgente') as reclamations_urgentes,
  COUNT(r.id) FILTER (WHERE r.priorite = 'urgente' AND r.statut = 'cloture') as urgentes_resolues,

  -- Respect des délais
  COUNT(r.id) FILTER (WHERE r.statut = 'cloture' AND r.updated_at <= r.date_cloture_avant) as dans_les_delais,
  COUNT(r.id) FILTER (WHERE r.statut = 'cloture' AND r.updated_at > r.date_cloture_avant) as hors_delais,

  -- Score de performance (0-100)
  ROUND(
    (
      -- 40% = taux de résolution
      (40.0 * COUNT(r.id) FILTER (WHERE r.statut = 'cloture') / NULLIF(COUNT(r.id), 0)) +
      -- 30% = respect des délais
      (30.0 * COUNT(r.id) FILTER (WHERE r.statut = 'cloture' AND r.updated_at <= r.date_cloture_avant) /
       NULLIF(COUNT(r.id) FILTER (WHERE r.statut = 'cloture'), 0)) +
      -- 30% = gestion des urgences
      (30.0 * COUNT(r.id) FILTER (WHERE r.priorite = 'urgente' AND r.statut = 'cloture') /
       NULLIF(COUNT(r.id) FILTER (WHERE r.priorite = 'urgente'), 0))
    ),
    2
  ) as score_performance,

  -- Dernière activité
  MAX(r.updated_at) as derniere_activite

FROM profiles p
LEFT JOIN reclamations r ON r.circuit = p.circuit
WHERE p.role = 'chauffeur'
GROUP BY p.id, p.full_name, p.circuit, p.email
ORDER BY score_performance DESC NULLS LAST;

-- 4. VUE STATISTIQUES GLOBALES PAR CIRCUIT
CREATE OR REPLACE VIEW stats_par_circuit AS
SELECT
  circuit,
  COUNT(*) as total_reclamations,
  COUNT(*) FILTER (WHERE statut = 'cloture') as cloturees,
  COUNT(*) FILTER (WHERE statut = 'en_cours') as en_cours,
  COUNT(*) FILTER (WHERE statut = 'en_attente') as en_attente,
  ROUND(100.0 * COUNT(*) FILTER (WHERE statut = 'cloture') / COUNT(*), 2) as taux_cloture,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) FILTER (WHERE statut = 'cloture'), 2) as temps_moyen_heures,
  COUNT(*) FILTER (WHERE priorite = 'urgente') as urgentes,
  COUNT(*) FILTER (WHERE updated_at > date_cloture_avant AND statut != 'cloture') as en_retard
FROM reclamations
GROUP BY circuit
ORDER BY circuit;

-- 5. VUE TENDANCES JOURNALIÈRES
CREATE OR REPLACE VIEW tendances_quotidiennes AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as nouvelles_reclamations,
  COUNT(*) FILTER (WHERE statut = 'cloture') as cloturees_jour,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) FILTER (WHERE statut = 'cloture') as temps_moyen_resolution
FROM reclamations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 6. VUE TOP MOTIFS DE RÉCLAMATION
CREATE OR REPLACE VIEW top_motifs AS
SELECT
  motif,
  COUNT(*) as occurrences,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM reclamations), 2) as pourcentage,
  COUNT(*) FILTER (WHERE statut = 'cloture') as resolues,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) FILTER (WHERE statut = 'cloture'), 2) as temps_moyen_resolution
FROM reclamations
WHERE motif IS NOT NULL AND motif != ''
GROUP BY motif
ORDER BY occurrences DESC
LIMIT 10;

-- 7. FONCTION POUR CALCULER LE SLA
CREATE OR REPLACE FUNCTION calculer_sla_deadline(
  date_remise DATE,
  priorite_niveau TEXT,
  type_recla TEXT
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  delai_heures INTEGER;
BEGIN
  -- Délais en heures ouvrables selon la priorité
  delai_heures := CASE
    WHEN priorite_niveau = 'urgente' THEN 24    -- 1 jour
    WHEN priorite_niveau = 'haute' THEN 48      -- 2 jours
    WHEN priorite_niveau = 'normale' THEN 72    -- 3 jours
    WHEN priorite_niveau = 'basse' THEN 120     -- 5 jours
    ELSE 72
  END;

  -- Ajouter le délai à la date de remise
  RETURN date_remise::TIMESTAMPTZ + (delai_heures || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Mettre à jour les SLA existants
UPDATE reclamations
SET sla_deadline = calculer_sla_deadline(date_remise_reclamation, priorite, type_reclamation)
WHERE sla_deadline IS NULL;

-- 8. TRIGGER POUR AUTO-ASSIGNER AU CHAUFFEUR DU CIRCUIT
CREATE OR REPLACE FUNCTION auto_assign_to_driver()
RETURNS TRIGGER AS $$
BEGIN
  -- Générer le numéro de ticket
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := 'RZ-' || LPAD(NEW.circuit::TEXT, 3, '0') || '-' ||
                         TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' ||
                         LPAD(SUBSTRING(NEW.id::TEXT, 1, 4), 4, '0');
  END IF;

  -- Calculer le SLA
  IF NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline := calculer_sla_deadline(NEW.date_remise_reclamation, NEW.priorite, NEW.type_reclamation);
  END IF;

  -- Auto-assigner au chauffeur du circuit
  IF NEW.assignee_id IS NULL THEN
    SELECT id INTO NEW.assignee_id
    FROM profiles
    WHERE role = 'chauffeur' AND circuit = NEW.circuit
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign
  BEFORE INSERT ON reclamations
  FOR EACH ROW EXECUTE FUNCTION auto_assign_to_driver();

-- 9. RLS POUR LES DOCUMENTS
-- Note: Les RLS pour la table 'fichiers' sont déjà définis dans le schéma principal
-- On peut ajouter des politiques supplémentaires si nécessaire

-- 10. FONCTION POUR RÉCUPÉRER LES DOCUMENTS
CREATE OR REPLACE FUNCTION get_reclamation_documents(reclamation_uuid UUID)
RETURNS TABLE (
  id UUID,
  file_name TEXT,
  file_path TEXT,
  file_type TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ,
  uploader_name TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.file_name,
    f.file_path,
    f.file_type,
    f.file_size,
    f.created_at as uploaded_at,
    p.full_name as uploader_name,
    f.description
  FROM fichiers f
  JOIN profiles p ON f.uploaded_by = p.id
  WHERE f.reclamation_id = reclamation_uuid
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TERMINÉ !
-- ============================================
-- Le système de ticketing est maintenant configuré avec :
-- - Numéros de ticket automatiques
-- - Statistiques par chauffeur
-- - Gestion des documents
-- - Calcul de SLA
-- - Auto-assignation
