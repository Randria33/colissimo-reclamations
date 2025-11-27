-- ================================================
-- CONFIGURATION COMPLÈTE - À EXÉCUTER EN UNE FOIS
-- ================================================

-- ============================
-- ÉTAPE 1: Nettoyer les RLS policies existantes
-- ============================

ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reclamations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fichiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS historique DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;

-- ============================
-- ÉTAPE 2: Créer/Mettre à jour les profils
-- ============================

-- Supprimer les profils existants
DELETE FROM profiles;

-- Insérer admin
INSERT INTO profiles (id, email, full_name, role, circuit, created_at, updated_at)
VALUES (
  '444bf528-3022-48ca-8188-307ca0ac7b22',
  'admin@rz.com',
  'Administrateur RZ',
  'admin',
  NULL,
  NOW(),
  NOW()
);

-- Insérer chauffeur
INSERT INTO profiles (id, email, full_name, role, circuit, created_at, updated_at)
VALUES (
  '350f92af-eefd-4555-bdfb-712280abb934',
  'driver1@rz.com',
  'Chauffeur Circuit 541',
  'chauffeur',
  541,
  NOW(),
  NOW()
);

-- ============================
-- ÉTAPE 3: RLS ULTRA-SIMPLIFIÉ (sans récursion)
-- ============================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture profils" ON profiles FOR SELECT
USING (true);

CREATE POLICY "Modification profil" ON profiles FOR UPDATE
USING (auth.uid() = id);

-- RECLAMATIONS
ALTER TABLE reclamations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture réclamations" ON reclamations FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Création réclamations" ON reclamations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Modification réclamations" ON reclamations FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Suppression réclamations" ON reclamations FOR DELETE
USING (auth.uid() IS NOT NULL);

-- FICHIERS
ALTER TABLE fichiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture fichiers" ON fichiers FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Upload fichiers" ON fichiers FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Suppression fichiers" ON fichiers FOR DELETE
USING (auth.uid() IS NOT NULL);

-- HISTORIQUE
ALTER TABLE historique ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture historique" ON historique FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Création historique" ON historique FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture notifications" ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Modification notifications" ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- MESSAGES
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture messages" ON messages FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Création messages" ON messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================
-- ÉTAPE 4: Vérifications
-- ============================

-- Compter les profils
SELECT
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
  COUNT(CASE WHEN role = 'chauffeur' THEN 1 END) as chauffeurs
FROM profiles;

-- Lister les profils
SELECT id, email, full_name, role, circuit FROM profiles ORDER BY role, email;

-- Lister les policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- Message de confirmation
SELECT '✅ Configuration complète terminée avec succès!' AS status;
