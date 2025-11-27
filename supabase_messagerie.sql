-- ============================================
-- SYSTÈME DE MESSAGERIE - Extension du schéma
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor pour ajouter la messagerie

-- Table des messages/commentaires sur les réclamations
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reclamation_id UUID REFERENCES reclamations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_messages_reclamation ON messages(reclamation_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir les messages des réclamations auxquelles ils ont accès
CREATE POLICY "Voir les messages des réclamations accessibles"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reclamations
      WHERE reclamations.id = messages.reclamation_id
      AND (
        reclamations.assigned_to = auth.uid() OR
        reclamations.created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
      )
    )
  );

-- Les utilisateurs authentifiés peuvent créer des messages
CREATE POLICY "Créer des messages"
  ON messages FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- FONCTION POUR NOTIFIER LES NOUVEAUX MESSAGES
-- ============================================

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Notifier l'admin si le message vient d'un chauffeur
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.user_id AND role = 'chauffeur') THEN
    INSERT INTO notifications (user_id, reclamation_id, type, message)
    SELECT
      p.id,
      NEW.reclamation_id,
      'modification',
      'Nouveau message sur la réclamation'
    FROM profiles p
    WHERE p.role = 'admin';
  END IF;

  -- Notifier le chauffeur assigné si le message vient d'un admin
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.user_id AND role = 'admin') THEN
    INSERT INTO notifications (user_id, reclamation_id, type, message)
    SELECT
      r.assigned_to,
      NEW.reclamation_id,
      'modification',
      'Nouveau message de l''admin'
    FROM reclamations r
    WHERE r.id = NEW.reclamation_id AND r.assigned_to IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- ============================================
-- VUE POUR LES MESSAGES AVEC INFOS UTILISATEUR
-- ============================================

CREATE OR REPLACE VIEW messages_with_user AS
SELECT
  m.id,
  m.reclamation_id,
  m.message,
  m.created_at,
  m.user_id,
  p.full_name,
  p.role,
  p.avatar_url
FROM messages m
JOIN profiles p ON m.user_id = p.id
ORDER BY m.created_at ASC;

-- ============================================
-- FONCTION POUR COMPTER LES MESSAGES NON LUS
-- ============================================

CREATE OR REPLACE FUNCTION count_unread_messages(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT m.reclamation_id)
  INTO unread_count
  FROM messages m
  JOIN reclamations r ON m.reclamation_id = r.id
  WHERE m.user_id != user_uuid
  AND (r.assigned_to = user_uuid OR r.created_by = user_uuid)
  AND m.created_at > COALESCE(
    (SELECT MAX(created_at) FROM messages WHERE user_id = user_uuid AND reclamation_id = m.reclamation_id),
    r.created_at
  );

  RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCCÈS !
-- ============================================
-- La messagerie est maintenant configurée.
-- Les utilisateurs peuvent échanger des messages sur chaque réclamation.
