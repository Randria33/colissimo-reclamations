-- ============================================
-- SYSTÈME D'ARCHIVAGE AUTOMATIQUE
-- ============================================
-- Archivage des réclamations clôturées après 3 mois
-- avec suppression automatique et journalisation

-- ============================================
-- 1. TABLE D'ARCHIVES
-- ============================================

CREATE TABLE IF NOT EXISTS reclamations_archives (
  id UUID PRIMARY KEY,
  -- Toutes les données de la réclamation originale
  num_colis TEXT NOT NULL,
  ref_dossier TEXT NOT NULL,
  adresse_client TEXT,
  circuit INTEGER NOT NULL,
  type_reclamation TEXT NOT NULL,
  motif TEXT,
  date_remise_reclamation DATE NOT NULL,
  date_cloture_avant DATE NOT NULL,
  date_retour_chauffeur DATE,
  remarque TEXT,
  action_commentaire TEXT,
  statut TEXT NOT NULL,
  priorite TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  -- Métadonnées d'archivage
  date_cloture TIMESTAMPTZ NOT NULL, -- Date de clôture effective
  date_archivage TIMESTAMPTZ DEFAULT NOW(), -- Date d'archivage
  archived_by TEXT DEFAULT 'system' -- Qui a archivé (system = auto)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_archives_circuit ON reclamations_archives(circuit);
CREATE INDEX IF NOT EXISTS idx_archives_date_cloture ON reclamations_archives(date_cloture);
CREATE INDEX IF NOT EXISTS idx_archives_date_archivage ON reclamations_archives(date_archivage);

-- ============================================
-- 2. TABLE DE LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS archivage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL, -- 'archive' ou 'delete'
  reclamation_id UUID NOT NULL,
  num_colis TEXT NOT NULL,
  ref_dossier TEXT NOT NULL,
  circuit INTEGER NOT NULL,
  date_cloture TIMESTAMPTZ NOT NULL,
  details JSONB, -- Toutes les données en JSON
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_action ON archivage_logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_date ON archivage_logs(created_at);

-- ============================================
-- 3. FONCTION D'ARCHIVAGE AUTOMATIQUE
-- ============================================

CREATE OR REPLACE FUNCTION archiver_reclamations_cloturees()
RETURNS TABLE(
  archives_count INTEGER,
  message TEXT
) AS $$
DECLARE
  rec RECORD;
  archive_count INTEGER := 0;
BEGIN
  -- Trouver toutes les réclamations clôturées depuis plus de 3 mois
  FOR rec IN
    SELECT *
    FROM reclamations
    WHERE statut = 'cloture'
    AND updated_at < NOW() - INTERVAL '3 months'
  LOOP
    -- Logger l'archivage
    INSERT INTO archivage_logs (
      action,
      reclamation_id,
      num_colis,
      ref_dossier,
      circuit,
      date_cloture,
      details
    ) VALUES (
      'archive',
      rec.id,
      rec.num_colis,
      rec.ref_dossier,
      rec.circuit,
      rec.updated_at,
      to_jsonb(rec)
    );

    -- Archiver la réclamation
    INSERT INTO reclamations_archives (
      id,
      num_colis,
      ref_dossier,
      adresse_client,
      circuit,
      type_reclamation,
      motif,
      date_remise_reclamation,
      date_cloture_avant,
      date_retour_chauffeur,
      remarque,
      action_commentaire,
      statut,
      priorite,
      created_by,
      created_at,
      updated_at,
      date_cloture,
      date_archivage,
      archived_by
    ) VALUES (
      rec.id,
      rec.num_colis,
      rec.ref_dossier,
      rec.adresse_client,
      rec.circuit,
      rec.type_reclamation,
      rec.motif,
      rec.date_remise_reclamation,
      rec.date_cloture_avant,
      rec.date_retour_chauffeur,
      rec.remarque,
      rec.action_commentaire,
      rec.statut,
      rec.priorite,
      rec.created_by,
      rec.created_at,
      rec.updated_at,
      rec.updated_at, -- Date de clôture = updated_at
      NOW(),
      'system'
    );

    -- Supprimer de la table principale
    DELETE FROM reclamations WHERE id = rec.id;

    archive_count := archive_count + 1;
  END LOOP;

  -- Retourner le résultat
  RETURN QUERY SELECT
    archive_count,
    'Archivage terminé: ' || archive_count || ' réclamation(s) archivée(s) et supprimée(s)';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. FONCTION POUR CONSULTATION DES ARCHIVES
-- ============================================

CREATE OR REPLACE VIEW reclamations_avec_archives AS
SELECT
  r.*,
  'active' as source
FROM reclamations r
UNION ALL
SELECT
  a.id,
  a.num_colis,
  a.ref_dossier,
  a.adresse_client,
  a.circuit,
  a.type_reclamation,
  a.motif,
  a.date_remise_reclamation,
  a.date_cloture_avant,
  a.date_retour_chauffeur,
  a.remarque,
  a.action_commentaire,
  a.statut,
  a.priorite,
  a.created_by,
  a.created_at,
  a.updated_at,
  'archive' as source
FROM reclamations_archives a;

-- ============================================
-- 5. STATISTIQUES D'ARCHIVAGE
-- ============================================

CREATE OR REPLACE VIEW stats_archivage AS
SELECT
  COUNT(*) FILTER (WHERE action = 'archive') as total_archives,
  COUNT(DISTINCT circuit) as circuits_concernes,
  MIN(created_at) as premier_archivage,
  MAX(created_at) as dernier_archivage,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as archives_30_derniers_jours
FROM archivage_logs
WHERE action = 'archive';

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Archives accessibles uniquement aux admins
ALTER TABLE reclamations_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins peuvent voir les archives"
  ON reclamations_archives FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Logs accessibles uniquement aux admins
ALTER TABLE archivage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins peuvent voir les logs"
  ON archivage_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 7. PROGRAMMATION DE L'EXÉCUTION AUTOMATIQUE
-- ============================================
-- IMPORTANT: Pour exécuter automatiquement cette fonction,
-- vous devez configurer pg_cron dans Supabase:
--
-- 1. Allez dans Database > Extensions
-- 2. Activez l'extension "pg_cron"
-- 3. Puis exécutez cette commande pour programmer l'archivage quotidien à 2h du matin:

/*
SELECT cron.schedule(
  'archivage-automatique-reclamations',  -- nom du job
  '0 2 * * *',                           -- tous les jours à 2h du matin
  $$ SELECT archiver_reclamations_cloturees(); $$
);
*/

-- ============================================
-- 8. COMMANDES UTILES
-- ============================================

-- Exécuter manuellement l'archivage:
-- SELECT * FROM archiver_reclamations_cloturees();

-- Voir les statistiques:
-- SELECT * FROM stats_archivage;

-- Voir les logs d'archivage:
-- SELECT * FROM archivage_logs ORDER BY created_at DESC LIMIT 50;

-- Voir toutes les réclamations (actives + archives):
-- SELECT * FROM reclamations_avec_archives WHERE num_colis = 'XXX';

-- Rechercher dans les archives:
-- SELECT * FROM reclamations_archives WHERE circuit = 541;

-- Voir les réclamations qui seront archivées bientôt:
-- SELECT
--   num_colis,
--   ref_dossier,
--   circuit,
--   updated_at as date_cloture,
--   NOW() - updated_at as temps_ecoule,
--   INTERVAL '3 months' - (NOW() - updated_at) as temps_restant
-- FROM reclamations
-- WHERE statut = 'cloture'
-- AND updated_at < NOW() - INTERVAL '2 months'
-- ORDER BY updated_at;

-- ============================================
-- TERMINÉ !
-- ============================================
-- Le système d'archivage est maintenant configuré.
-- N'oubliez pas d'activer pg_cron pour l'exécution automatique.
