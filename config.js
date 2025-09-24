// config.js
// ⚠️ Remplace par tes vraies valeurs
const SUPABASE_URL =https://qkobvzckgsijrimgsosq.supabase.co
const SUPABASE_ANON_KEY =eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrb2J2emNrZ3NpanJpbWdzb3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NTAyNjMsImV4cCI6MjA3NDMyNjI2M30.SrO6YXaOYo6siMa5Xgq4VewUf8EQRfHQF3eFjsYS-nk
  alert("La librairie Supabase n'est pas chargée.");
}
window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Utilitaires date/heure au format SQL
window.formatSQLDate = (d = new Date()) => d.toISOString().slice(0, 10); // YYYY-MM-DD
window.formatSQLTime = (d = new Date()) => d.toTimeString().slice(0, 8); // HH:MM:SS
