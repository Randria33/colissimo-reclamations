-- ============================================
-- SYSTÈME DE LOGS D'ACTIVITÉ ET HISTORIQUE
-- ============================================
-- Traçabilité complète de toutes les actions sur chaque réclamation

-- 1. TABLE DES LOGS D'ACTIVITÉ
CREATE TABLE IF NOT EXISTS reclamation_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reclamation_id UUID REFERENCES reclamations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  action_type TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'assigned', 'comment', 'document_uploaded', 'closed', etc.
  action_description TEXT NOT NULL,
  old_value JSONB, -- Anciennes valeurs pour les modifications
  new_value JSONB, -- Nouvelles valeurs
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_reclamation ON reclamation_activity_logs(reclamation_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON reclamation_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON reclamation_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON reclamation_activity_logs(action_type);

-- 2. FONCTION POUR LOGGER LES CRÉATIONS
CREATE OR REPLACE FUNCTION log_reclamation_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO reclamation_activity_logs (
    reclamation_id,
    user_id,
    action_type,
    action_description,
    new_value
  ) VALUES (
    NEW.id,
    NEW.created_by,
    'created',
    'Réclamation créée',
    jsonb_build_object(
      'num_colis', NEW.num_colis,
      'ref_dossier', NEW.ref_dossier,
      'circuit', NEW.circuit,
      'type_reclamation', NEW.type_reclamation,
      'priorite', NEW.priorite,
      'statut', NEW.statut
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_reclamation_creation ON reclamations;
CREATE TRIGGER trigger_log_reclamation_creation
  AFTER INSERT ON reclamations
  FOR EACH ROW EXECUTE FUNCTION log_reclamation_creation();

-- 3. FONCTION POUR LOGGER LES MODIFICATIONS
CREATE OR REPLACE FUNCTION log_reclamation_update()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB := '{}'::JSONB;
  old_values JSONB := '{}'::JSONB;
  new_values JSONB := '{}'::JSONB;
  action_desc TEXT;
  current_user_id UUID;
BEGIN
  -- Récupérer l'utilisateur actuel (vous devrez peut-être adapter selon votre contexte)
  current_user_id := auth.uid();

  -- Si pas d'utilisateur connecté, utiliser created_by
  IF current_user_id IS NULL THEN
    current_user_id := OLD.created_by;
  END IF;

  -- Détecter les changements de statut
  IF OLD.statut != NEW.statut THEN
    action_desc := 'Statut changé de "' || OLD.statut || '" à "' || NEW.statut || '"';
    old_values := jsonb_build_object('statut', OLD.statut);
    new_values := jsonb_build_object('statut', NEW.statut);

    INSERT INTO reclamation_activity_logs (
      reclamation_id, user_id, action_type, action_description, old_value, new_value
    ) VALUES (
      NEW.id, current_user_id, 'status_changed', action_desc, old_values, new_values
    );
  END IF;

  -- Détecter les changements de priorité
  IF OLD.priorite != NEW.priorite THEN
    action_desc := 'Priorité changée de "' || OLD.priorite || '" à "' || NEW.priorite || '"';
    old_values := jsonb_build_object('priorite', OLD.priorite);
    new_values := jsonb_build_object('priorite', NEW.priorite);

    INSERT INTO reclamation_activity_logs (
      reclamation_id, user_id, action_type, action_description, old_value, new_value
    ) VALUES (
      NEW.id, current_user_id, 'priority_changed', action_desc, old_values, new_values
    );
  END IF;

  -- Détecter les changements de circuit
  IF OLD.circuit != NEW.circuit THEN
    action_desc := 'Circuit changé de ' || OLD.circuit || ' à ' || NEW.circuit;
    old_values := jsonb_build_object('circuit', OLD.circuit);
    new_values := jsonb_build_object('circuit', NEW.circuit);

    INSERT INTO reclamation_activity_logs (
      reclamation_id, user_id, action_type, action_description, old_value, new_value
    ) VALUES (
      NEW.id, current_user_id, 'circuit_changed', action_desc, old_values, new_values
    );
  END IF;

  -- Détecter les changements de remarque
  IF OLD.remarque IS DISTINCT FROM NEW.remarque THEN
    action_desc := 'Remarque modifiée';
    old_values := jsonb_build_object('remarque', OLD.remarque);
    new_values := jsonb_build_object('remarque', NEW.remarque);

    INSERT INTO reclamation_activity_logs (
      reclamation_id, user_id, action_type, action_description, old_value, new_value
    ) VALUES (
      NEW.id, current_user_id, 'remark_updated', action_desc, old_values, new_values
    );
  END IF;

  -- Détecter les changements d'action/commentaire
  IF OLD.action_commentaire IS DISTINCT FROM NEW.action_commentaire THEN
    action_desc := 'Action/Commentaire modifié';
    old_values := jsonb_build_object('action_commentaire', OLD.action_commentaire);
    new_values := jsonb_build_object('action_commentaire', NEW.action_commentaire);

    INSERT INTO reclamation_activity_logs (
      reclamation_id, user_id, action_type, action_description, old_value, new_value
    ) VALUES (
      NEW.id, current_user_id, 'comment_updated', action_desc, old_values, new_values
    );
  END IF;

  -- Détecter la date de retour chauffeur
  IF OLD.date_retour_chauffeur IS DISTINCT FROM NEW.date_retour_chauffeur THEN
    action_desc := 'Date retour chauffeur mise à jour';
    old_values := jsonb_build_object('date_retour_chauffeur', OLD.date_retour_chauffeur);
    new_values := jsonb_build_object('date_retour_chauffeur', NEW.date_retour_chauffeur);

    INSERT INTO reclamation_activity_logs (
      reclamation_id, user_id, action_type, action_description, old_value, new_value
    ) VALUES (
      NEW.id, current_user_id, 'return_date_updated', action_desc, old_values, new_values
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_reclamation_update ON reclamations;
CREATE TRIGGER trigger_log_reclamation_update
  AFTER UPDATE ON reclamations
  FOR EACH ROW EXECUTE FUNCTION log_reclamation_update();

-- 4. FONCTION POUR LOGGER LES UPLOADS DE DOCUMENTS
CREATE OR REPLACE FUNCTION log_document_upload()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO reclamation_activity_logs (
    reclamation_id,
    user_id,
    action_type,
    action_description,
    new_value
  ) VALUES (
    NEW.reclamation_id,
    NEW.uploaded_by,
    'document_uploaded',
    'Document uploadé : ' || NEW.file_name,
    jsonb_build_object(
      'file_name', NEW.file_name,
      'file_type', NEW.file_type,
      'file_size', NEW.file_size
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_document_upload ON fichiers;
CREATE TRIGGER trigger_log_document_upload
  AFTER INSERT ON fichiers
  FOR EACH ROW EXECUTE FUNCTION log_document_upload();

-- 5. FONCTION POUR LOGGER LES MESSAGES
CREATE OR REPLACE FUNCTION log_message_creation()
RETURNS TRIGGER AS $$
DECLARE
  sender_role TEXT;
BEGIN
  -- Récupérer le rôle de l'expéditeur
  SELECT role INTO sender_role FROM profiles WHERE id = NEW.user_id;

  INSERT INTO reclamation_activity_logs (
    reclamation_id,
    user_id,
    action_type,
    action_description,
    new_value
  ) VALUES (
    NEW.reclamation_id,
    NEW.user_id,
    'message_sent',
    'Message envoyé par ' || CASE
      WHEN sender_role = 'admin' THEN 'administrateur'
      WHEN sender_role = 'chauffeur' THEN 'chauffeur'
      ELSE sender_role
    END,
    jsonb_build_object('message', LEFT(NEW.message, 100))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_message_creation ON messages;
CREATE TRIGGER trigger_log_message_creation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION log_message_creation();

-- 6. VUE AVEC DÉTAILS UTILISATEUR
CREATE OR REPLACE VIEW activity_logs_with_user AS
SELECT
  al.id,
  al.reclamation_id,
  al.action_type,
  al.action_description,
  al.old_value,
  al.new_value,
  al.created_at,
  al.user_id,
  p.full_name as user_name,
  p.email as user_email,
  p.role as user_role,
  r.num_colis,
  r.ref_dossier
FROM reclamation_activity_logs al
JOIN profiles p ON al.user_id = p.id
JOIN reclamations r ON al.reclamation_id = r.id
ORDER BY al.created_at DESC;

-- 7. FONCTION POUR RÉCUPÉRER L'HISTORIQUE D'UNE RÉCLAMATION
CREATE OR REPLACE FUNCTION get_reclamation_history(reclamation_uuid UUID)
RETURNS TABLE (
  id UUID,
  action_type TEXT,
  action_description TEXT,
  user_name TEXT,
  user_role TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.action_type,
    al.action_description,
    p.full_name as user_name,
    p.role as user_role,
    al.old_value,
    al.new_value,
    al.created_at
  FROM reclamation_activity_logs al
  JOIN profiles p ON al.user_id = p.id
  WHERE al.reclamation_id = reclamation_uuid
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. STATISTIQUES D'ACTIVITÉ
CREATE OR REPLACE VIEW activity_stats AS
SELECT
  action_type,
  COUNT(*) as count,
  COUNT(DISTINCT reclamation_id) as reclamations_affected,
  COUNT(DISTINCT user_id) as users_involved,
  MAX(created_at) as last_occurrence
FROM reclamation_activity_logs
GROUP BY action_type
ORDER BY count DESC;

-- 9. RLS POUR LES LOGS
ALTER TABLE reclamation_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voir logs des réclamations accessibles"
  ON reclamation_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reclamations r
      WHERE r.id = reclamation_activity_logs.reclamation_id
      AND (
        r.circuit IN (SELECT circuit FROM profiles WHERE id = auth.uid() AND role = 'chauffeur') OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "Créer des logs"
  ON reclamation_activity_logs FOR INSERT
  WITH CHECK (true); -- Les triggers peuvent créer des logs

-- 10. FONCTION POUR AJOUTER UN LOG MANUEL
CREATE OR REPLACE FUNCTION add_manual_log(
  reclamation_uuid UUID,
  description TEXT,
  action_type_param TEXT DEFAULT 'manual_action'
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO reclamation_activity_logs (
    reclamation_id,
    user_id,
    action_type,
    action_description
  ) VALUES (
    reclamation_uuid,
    auth.uid(),
    action_type_param,
    description
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RÉSUMÉ D'ACTIVITÉ PAR RÉCLAMATION
-- ============================================
CREATE OR REPLACE VIEW reclamation_activity_summary AS
SELECT
  r.id as reclamation_id,
  r.num_colis,
  r.ref_dossier,
  r.statut,
  COUNT(al.id) as total_activities,
  COUNT(DISTINCT al.user_id) as users_involved,
  COUNT(al.id) FILTER (WHERE al.action_type = 'message_sent') as messages_count,
  COUNT(al.id) FILTER (WHERE al.action_type = 'document_uploaded') as documents_count,
  COUNT(al.id) FILTER (WHERE al.action_type = 'status_changed') as status_changes,
  MIN(al.created_at) as first_activity,
  MAX(al.created_at) as last_activity,
  EXTRACT(EPOCH FROM (MAX(al.created_at) - MIN(al.created_at))) / 3600 as duration_hours
FROM reclamations r
LEFT JOIN reclamation_activity_logs al ON r.id = al.reclamation_id
GROUP BY r.id, r.num_colis, r.ref_dossier, r.statut;

-- ============================================
-- TERMINÉ !
-- ============================================
-- Le système de logs est maintenant configuré.
-- Tous les changements seront automatiquement tracés.

-- COMMANDES UTILES :
-- Voir l'historique d'une réclamation :
-- SELECT * FROM get_reclamation_history('uuid-de-la-reclamation');

-- Voir toutes les activités récentes :
-- SELECT * FROM activity_logs_with_user LIMIT 50;

-- Voir les statistiques d'activité :
-- SELECT * FROM activity_stats;

-- Ajouter un log manuel :
-- SELECT add_manual_log('uuid-reclamation', 'Appel téléphonique avec le client', 'phone_call');
