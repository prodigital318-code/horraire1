// config.js
// ⚠️ Remplace par tes vraies valeurs
const SUPABASE_URL = "https://VOTRE-PROJET.supabase.co";
const SUPABASE_ANON_KEY = "VOTRE_CLE_ANON";

if (!window.supabase) {
  alert("La librairie Supabase n'est pas chargée.");
}
window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Utilitaires date/heure au format SQL
window.formatSQLDate = (d = new Date()) => d.toISOString().slice(0, 10); // YYYY-MM-DD
window.formatSQLTime = (d = new Date()) => d.toTimeString().slice(0, 8); // HH:MM:SS
