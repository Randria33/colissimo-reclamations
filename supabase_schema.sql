-- ============================================
-- SCHEMA SUPABASE - GESTIONNAIRE DE RÉCLAMATIONS COLISSIMO
-- ============================================

-- Table des profils utilisateurs
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'chauffeur')),
  circuit INTEGER,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des réclamations
CREATE TABLE reclamations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  num_colis TEXT NOT NULL,
  ref_dossier TEXT NOT NULL,
  adresse_client TEXT,
  circuit INTEGER NOT NULL,
  type_reclamation TEXT NOT NULL,
  motif TEXT NOT NULL,
  date_remise_reclamation DATE NOT NULL,
  date_cloture_avant DATE NOT NULL,
  date_retour_chauffeur DATE,
  remarque TEXT,
  action_commentaire TEXT,
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'cloture', 'annule')),
  priorite TEXT DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
  created_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des fichiers (attestations, preuves, images)
CREATE TABLE fichiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reclamation_id UUID REFERENCES reclamations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table d'historique des modifications
CREATE TABLE historique (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reclamation_id UUID REFERENCES reclamations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  champ_modifie TEXT,
  ancienne_valeur TEXT,
  nouvelle_valeur TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reclamation_id UUID REFERENCES reclamations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('nouvelle', 'assignation', 'modification', 'echeance', 'cloture')),
  message TEXT NOT NULL,
  lu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEX POUR PERFORMANCE
-- ============================================

CREATE INDEX idx_reclamations_num_colis ON reclamations(num_colis);
CREATE INDEX idx_reclamations_ref_dossier ON reclamations(ref_dossier);
CREATE INDEX idx_reclamations_circuit ON reclamations(circuit);
CREATE INDEX idx_reclamations_statut ON reclamations(statut);
CREATE INDEX idx_reclamations_date_cloture ON reclamations(date_cloture_avant);
CREATE INDEX idx_reclamations_created_by ON reclamations(created_by);
CREATE INDEX idx_reclamations_assigned_to ON reclamations(assigned_to);
CREATE INDEX idx_fichiers_reclamation ON fichiers(reclamation_id);
CREATE INDEX idx_historique_reclamation ON historique(reclamation_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, lu);

-- ============================================
-- FONCTIONS AUTOMATIQUES
-- ============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reclamations_updated_at BEFORE UPDATE ON reclamations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer l'historique automatiquement
CREATE OR REPLACE FUNCTION log_reclamation_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    -- Log les changements de statut
    IF OLD.statut IS DISTINCT FROM NEW.statut THEN
      INSERT INTO historique (reclamation_id, user_id, action, champ_modifie, ancienne_valeur, nouvelle_valeur)
      VALUES (NEW.id, NEW.assigned_to, 'modification', 'statut', OLD.statut, NEW.statut);
    END IF;

    -- Log les changements de remarque
    IF OLD.remarque IS DISTINCT FROM NEW.remarque THEN
      INSERT INTO historique (reclamation_id, user_id, action, champ_modifie, ancienne_valeur, nouvelle_valeur)
      VALUES (NEW.id, NEW.assigned_to, 'modification', 'remarque', OLD.remarque, NEW.remarque);
    END IF;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO historique (reclamation_id, user_id, action)
    VALUES (NEW.id, NEW.created_by, 'creation');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_reclamation_changes
  AFTER INSERT OR UPDATE ON reclamations
  FOR EACH ROW EXECUTE FUNCTION log_reclamation_changes();

-- Fonction pour créer des notifications automatiques
CREATE OR REPLACE FUNCTION create_notification_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to)) THEN
    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO notifications (user_id, reclamation_id, type, message)
      VALUES (
        NEW.assigned_to,
        NEW.id,
        'assignation',
        'Nouvelle réclamation assignée: ' || NEW.ref_dossier
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_assignment
  AFTER INSERT OR UPDATE ON reclamations
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_assignment();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reclamations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Les admins peuvent voir tous les profils"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Policies pour reclamations
CREATE POLICY "Les admins peuvent tout voir"
  ON reclamations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Les chauffeurs voient leurs réclamations"
  ON reclamations FOR SELECT
  USING (
    assigned_to = auth.uid() OR created_by = auth.uid()
  );

CREATE POLICY "Les admins peuvent tout créer"
  ON reclamations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Les chauffeurs peuvent créer des réclamations"
  ON reclamations FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
  );

CREATE POLICY "Les admins peuvent tout modifier"
  ON reclamations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Les chauffeurs peuvent modifier leurs réclamations"
  ON reclamations FOR UPDATE
  USING (
    assigned_to = auth.uid() OR created_by = auth.uid()
  );

-- Policies pour fichiers
CREATE POLICY "Voir les fichiers des réclamations accessibles"
  ON fichiers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reclamations
      WHERE reclamations.id = fichiers.reclamation_id
      AND (
        reclamations.assigned_to = auth.uid() OR
        reclamations.created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
      )
    )
  );

CREATE POLICY "Uploader des fichiers"
  ON fichiers FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Policies pour historique
CREATE POLICY "Voir l'historique des réclamations accessibles"
  ON historique FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reclamations
      WHERE reclamations.id = historique.reclamation_id
      AND (
        reclamations.assigned_to = auth.uid() OR
        reclamations.created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
      )
    )
  );

-- Policies pour notifications
CREATE POLICY "Les utilisateurs voient leurs notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent marquer leurs notifications comme lues"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- VUES POUR STATISTIQUES
-- ============================================

CREATE OR REPLACE VIEW stats_reclamations AS
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE statut = 'en_attente') as en_attente,
  COUNT(*) FILTER (WHERE statut = 'en_cours') as en_cours,
  COUNT(*) FILTER (WHERE statut = 'cloture') as cloture,
  COUNT(*) FILTER (WHERE date_cloture_avant < CURRENT_DATE AND statut != 'cloture') as en_retard,
  COUNT(*) FILTER (WHERE date_cloture_avant BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND statut != 'cloture') as echeance_prochaine
FROM reclamations;

CREATE OR REPLACE VIEW stats_par_circuit AS
SELECT
  circuit,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE statut = 'en_attente') as en_attente,
  COUNT(*) FILTER (WHERE statut = 'en_cours') as en_cours,
  COUNT(*) FILTER (WHERE statut = 'cloture') as cloture
FROM reclamations
GROUP BY circuit
ORDER BY circuit;

-- ============================================
-- FONCTION DE RECHERCHE AVANCÉE
-- ============================================

CREATE OR REPLACE FUNCTION search_reclamations(
  search_query TEXT DEFAULT NULL,
  search_circuit INTEGER DEFAULT NULL,
  search_statut TEXT DEFAULT NULL,
  search_date_debut DATE DEFAULT NULL,
  search_date_fin DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  num_colis TEXT,
  ref_dossier TEXT,
  circuit INTEGER,
  statut TEXT,
  date_remise_reclamation DATE,
  date_cloture_avant DATE,
  priorite TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.num_colis,
    r.ref_dossier,
    r.circuit,
    r.statut,
    r.date_remise_reclamation,
    r.date_cloture_avant,
    r.priorite
  FROM reclamations r
  WHERE
    (search_query IS NULL OR
     r.num_colis ILIKE '%' || search_query || '%' OR
     r.ref_dossier ILIKE '%' || search_query || '%' OR
     r.adresse_client ILIKE '%' || search_query || '%')
    AND (search_circuit IS NULL OR r.circuit = search_circuit)
    AND (search_statut IS NULL OR r.statut = search_statut)
    AND (search_date_debut IS NULL OR r.date_remise_reclamation >= search_date_debut)
    AND (search_date_fin IS NULL OR r.date_remise_reclamation <= search_date_fin)
  ORDER BY r.date_remise_reclamation DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONNÉES DE TEST (OPTIONNEL)
-- ============================================

-- Créer un utilisateur admin de test
-- Note: Vous devrez créer l'utilisateur via l'interface Supabase Auth d'abord
-- Puis exécuter ceci avec l'UUID de l'utilisateur créé:
-- INSERT INTO profiles (id, email, full_name, role)
-- VALUES ('YOUR-UUID-HERE', 'admin@colissimo.fr', 'Admin Test', 'admin');
