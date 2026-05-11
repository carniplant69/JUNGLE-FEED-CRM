import { useState, useEffect, useMemo, useRef } from "react";

// ─── CONFIG SUPABASE ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://oemulphojkquayjvxcvb.supabase.co";
const SUPABASE_KEY = "sb_publishable_4S5c35xXkjgDjNb6JK93JA_00jYqzo5";

const sb = async (path, method = "GET", body = null) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "return=representation" : method === "PATCH" ? "return=representation" : "",
    },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

// ─── PRODUITS JUNGLE FEED ─────────────────────────────────────────────────────
const PRODUITS = [
  { id: "P1", nom: "Anti-Thrips Jungle", categorie: "Insecticide", prix: 18.9 },
  { id: "P2", nom: "Anti-Moucherons Pro", categorie: "Insecticide", prix: 15.5 },
  { id: "P3", nom: "Traitement Cochenille", categorie: "Insecticide", prix: 16.9 },
  { id: "P4", nom: "Purin d'Ortie Bio", categorie: "Engrais", prix: 12.5 },
  { id: "P5", nom: "Engrais Universel 500ml", categorie: "Engrais", prix: 14.9 },
  { id: "P6", nom: "Tonique Plantes Vertes", categorie: "Tonique", prix: 19.9 },
  { id: "P7", nom: "Kit Accessoires Pro", categorie: "Accessoires", prix: 29.9 },
  { id: "P8", nom: "Purin de Consoude", categorie: "Engrais", prix: 13.5 },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const today = new Date().toISOString().slice(0, 10);
const COLOR_STATUT = { "Livré": "#4ade80", "En cours": "#facc15", "En attente": "#fb923c", "Annulé": "#f87171", "Planifié": "#60a5fa", "À faire": "#fb923c", "Fait": "#4ade80" };

const BADGE = ({ label, color }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}55`, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</span>
);

const Icon = ({ name, size = 18 }) => {
  const icons = {
    dashboard: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    clients: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/></svg>,
    commandes: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    relances: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    produits: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
    leaf: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
    plus: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    search: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    upload: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
    check: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    refresh: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    trend: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  };
  return icons[name] || null;
};

// ─── SQL INIT (tables à créer dans Supabase) ──────────────────────────────────
const SQL_INIT = `
-- Copiez ce SQL dans Supabase > SQL Editor > New Query, puis cliquez Run

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  contact text,
  email text,
  tel text,
  ville text,
  segment text default 'Pro',
  notes text,
  ca_total numeric default 0,
  created_at timestamptz default now()
);

create table if not exists commandes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  date date default current_date,
  statut text default 'En attente',
  produits jsonb default '[]',
  total numeric default 0,
  notes text,
  created_at timestamptz default now()
);

create table if not exists relances (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  date date,
  objet text,
  statut text default 'À faire',
  priorite text default 'Normale',
  created_at timestamptz default now()
);

-- Désactiver RLS pour usage commercial simple
alter table clients disable row level security;
alter table commandes disable row level security;
alter table relances disable row level security;
`;

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function JungleFeedCRM() {
  const [page, setPage] = useState("dashboard");
  const [clients, setClients] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [relances, setRelances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [importProgress, setImportProgress] = useState(null);
  const fileRef = useRef();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Chargement données ──
  const loadAll = async () => {
    setLoading(true);
    try {
      const [c, cmd, r] = await Promise.all([
        sb("clients?order=nom.asc&limit=500"),
        sb("commandes?order=date.desc&limit=500"),
        sb("relances?order=date.asc&limit=500"),
      ]);
      setClients(c || []);
      setCommandes(cmd || []);
      setRelances(r || []);
      setDbReady(true);
    } catch (e) {
      setDbReady(false);
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // ── Analytics ──
  const caTotal = useMemo(() => commandes.filter(c => c.statut !== "Annulé").reduce((s, c) => s + (c.total || 0), 0), [commandes]);
  const caMois = useMemo(() => {
    const m = new Date().getMonth(), y = new Date().getFullYear();
    return commandes.filter(c => { const d = new Date(c.date); return d.getMonth() === m && d.getFullYear() === y && c.statut !== "Annulé"; }).reduce((s, c) => s + (c.total || 0), 0);
  }, [commandes]);
  const caJour = useMemo(() => commandes.filter(c => c.date?.slice(0, 10) === today && c.statut !== "Annulé").reduce((s, c) => s + (c.total || 0), 0), [commandes]);
  const relancesUrgentes = relances.filter(r => r.statut === "À faire" && new Date(r.date) <= new Date(Date.now() + 7 * 86400000));

  const topProduits = useMemo(() => {
    const agg = {};
    commandes.filter(c => c.statut !== "Annulé").forEach(cmd => (cmd.produits || []).forEach(({ prod_id, qte }) => { agg[prod_id] = (agg[prod_id] || 0) + qte; }));
    return Object.entries(agg).sort((a, b) => b[1] - a[1]).map(([id, qte]) => ({ prod: PRODUITS.find(p => p.id === id), qte })).filter(x => x.prod);
  }, [commandes]);

  // ── Import CSV Capsule ──
  const importCSV = async (file) => {
    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);
    const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());

    const getCol = (row, name) => {
      const parts = [];
      let inQuote = false, cur = "";
      for (const ch of row) {
        if (ch === '"') { inQuote = !inQuote; continue; }
        if (ch === "," && !inQuote) { parts.push(cur.trim()); cur = ""; continue; }
        cur += ch;
      }
      parts.push(cur.trim());
      const idx = headers.indexOf(name);
      return idx >= 0 ? (parts[idx] || "").trim() : "";
    };

    const rows = lines.slice(1).filter(l => l.trim());
    const total = rows.length;
    let done = 0;
    let imported = 0;
    const errors = [];

    setImportProgress({ done: 0, total, imported: 0 });

    const BATCH = 20;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const toInsert = [];

      for (const row of batch) {
        const type = getCol(row, "Type");
        if (type !== "Entreprise" && type !== "Personne") { done++; continue; }

        const nom = getCol(row, "Nom") || getCol(row, "Entreprise") || "Sans nom";
        if (!nom || nom === "Capsule" || nom === "JUNGLE FEED") { done++; continue; }

        const email = getCol(row, "E-mail") || getCol(row, "Adresse électronique") || "";
        const tel = getCol(row, "Numéro de téléphone") || getCol(row, "Mobile Téléphone") || getCol(row, "Work Téléphone") || "";
        const ville = getCol(row, "Ville") || getCol(row, "Ville de l'adresse professionnelle") || getCol(row, "Ville de l'entreprise") || "";
        const contact = type === "Personne" ? (getCol(row, "Prénom") + " " + getCol(row, "Nom de famille")).trim() : "";
        const fonction = getCol(row, "Fonction") || "";
        const etiquettes = getCol(row, "Étiquettes") || "";
        const segment = etiquettes.includes("Distributeur") ? "Distributeur" : etiquettes.includes("Revendeur") ? "Revendeur" : "Pro";

        toInsert.push({ nom, contact: contact || fonction || "", email, tel, ville, segment, notes: etiquettes, ca_total: 0 });
        done++;
        imported++;
      }

      if (toInsert.length > 0) {
        try {
          await sb("clients", "POST", toInsert);
        } catch (e) {
          errors.push(e.message);
        }
      }
      setImportProgress({ done, total, imported });
      await new Promise(r => setTimeout(r, 50));
    }

    await loadAll();
    setImportProgress(null);
    showToast(`✅ ${imported} contacts importés depuis Capsule !`);
    setModal(null);
  };

  // ── CRUD ──
  const saveClient = async (data) => {
    try {
      if (data.id) {
        await sb(`clients?id=eq.${data.id}`, "PATCH", data);
      } else {
        await sb("clients", "POST", { ...data, ca_total: 0 });
      }
      await loadAll();
      showToast("Client enregistré ✓");
      setModal(null);
    } catch (e) { showToast("Erreur : " + e.message, "error"); }
  };

  const saveCommande = async (data) => {
    try {
      const total = (data.produits || []).reduce((s, l) => { const p = PRODUITS.find(x => x.id === l.prod_id); return s + (p ? p.prix * l.qte : 0); }, 0);
      await sb("commandes", "POST", { ...data, total, date: today });
      // Mettre à jour ca_total client
      const cl = clients.find(c => c.id === data.client_id);
      if (cl) await sb(`clients?id=eq.${cl.id}`, "PATCH", { ca_total: (cl.ca_total || 0) + total });
      await loadAll();
      showToast("Commande enregistrée ✓");
      setModal(null);
    } catch (e) { showToast("Erreur : " + e.message, "error"); }
  };

  const saveRelance = async (data) => {
    try {
      await sb("relances", "POST", { ...data, statut: "À faire" });
      await loadAll();
      showToast("Relance créée ✓");
      setModal(null);
    } catch (e) { showToast("Erreur : " + e.message, "error"); }
  };

  const doneRelance = async (id) => {
    try {
      await sb(`relances?id=eq.${id}`, "PATCH", { statut: "Fait" });
      setRelances(prev => prev.map(r => r.id === id ? { ...r, statut: "Fait" } : r));
      showToast("Relance marquée comme faite ✓");
    } catch (e) { showToast("Erreur", "error"); }
  };

  const getClient = (id) => clients.find(c => c.id === id);

  // ─── STYLES ───────────────────────────────────────────────────────────────────
  const S = {
    wrap: { display: "flex", minHeight: "100vh", background: "#0d1a0f", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e8f5e9" },
    sidebar: { width: 224, background: "#0a1509", borderRight: "1px solid #1e3a1e", display: "flex", flexDirection: "column", padding: "0 0 24px", flexShrink: 0 },
    logo: { padding: "26px 22px 18px", borderBottom: "1px solid #1e3a1e" },
    logoText: { fontFamily: "'Playfair Display',Georgia,serif", fontSize: 21, fontWeight: 900, color: "#6fcf7a" },
    logoSub: { fontSize: 10, color: "#4a7a4e", textTransform: "uppercase", letterSpacing: 2, marginTop: 2 },
    nav: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "11px 22px", cursor: "pointer", borderRadius: "0 20px 20px 0", marginRight: 14, marginTop: 2, background: active ? "#1e3a1e" : "transparent", color: active ? "#6fcf7a" : "#7aad7e", fontWeight: active ? 700 : 400, fontSize: 14, transition: "all .15s", borderLeft: active ? "3px solid #6fcf7a" : "3px solid transparent" }),
    main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
    header: { padding: "18px 30px", borderBottom: "1px solid #1e3a1e", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0d1a0f", flexShrink: 0 },
    headerTitle: { fontSize: 22, fontWeight: 800, color: "#e8f5e9", fontFamily: "'Playfair Display',serif" },
    content: { padding: "26px 30px", overflowY: "auto", flex: 1 },
    card: { background: "#111f12", border: "1px solid #1e3a1e", borderRadius: 14, padding: "18px 22px", marginBottom: 18 },
    kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 },
    kpi: (color) => ({ background: "#111f12", border: "1px solid #1e3a1e", borderRadius: 14, padding: "18px 20px", borderTop: `3px solid ${color}` }),
    kpiL: { fontSize: 10, color: "#4a7a4e", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
    kpiV: (color) => ({ fontSize: 26, fontWeight: 800, color, fontFamily: "'Playfair Display',serif" }),
    kpiS: { fontSize: 11, color: "#5a8a5e", marginTop: 4 },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 },
    secTitle: { fontSize: 11, fontWeight: 700, color: "#4a7a4e", textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "7px 12px", fontSize: 10, color: "#4a7a4e", textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid #1e3a1e" },
    td: { padding: "10px 12px", fontSize: 13, borderBottom: "1px solid #1a2e1a", verticalAlign: "middle" },
    btn: (v = "primary") => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: v === "secondary" ? "1px solid #2e4a2e" : "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: v === "primary" ? "#3a7a40" : v === "ghost" ? "transparent" : v === "danger" ? "#7a2020" : "#1e3a1e", color: v === "primary" ? "#fff" : v === "ghost" ? "#5a8a5e" : "#6fcf7a", transition: "all .15s" }),
    input: { background: "#0a1509", border: "1px solid #2e4a2e", borderRadius: 8, padding: "9px 12px", color: "#e8f5e9", fontSize: 13, width: "100%", outline: "none", boxSizing: "border-box" },
    label: { fontSize: 10, color: "#4a7a4e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, display: "block" },
    overlay: { position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" },
    modal: { background: "#111f12", border: "1px solid #2e4a2e", borderRadius: 18, padding: "26px 30px", width: 540, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 24px 64px #00000099" },
  };

  // ─── PAGE SETUP DB ────────────────────────────────────────────────────────────
  if (!dbReady && !loading) {
    return (
      <div style={{ ...S.wrap, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20, padding: 40 }}>
        <div style={{ fontSize: 28, fontFamily: "'Playfair Display',serif", color: "#6fcf7a" }}>🌿 Jungle Feed CRM</div>
        <div style={{ ...S.card, maxWidth: 600, width: "100%" }}>
          <div style={S.secTitle}>⚠️ Configuration requise — Étape unique</div>
          <p style={{ fontSize: 13, color: "#a5d6a7", lineHeight: 1.7, marginBottom: 16 }}>
            Avant d'utiliser le CRM, vous devez créer les tables dans Supabase.<br />
            Copiez le SQL ci-dessous dans <strong style={{ color: "#6fcf7a" }}>Supabase → SQL Editor → New Query</strong> puis cliquez <strong style={{ color: "#6fcf7a" }}>Run</strong>.
          </p>
          <pre style={{ background: "#0a1509", border: "1px solid #2e4a2e", borderRadius: 10, padding: "14px 16px", fontSize: 11, color: "#a5d6a7", overflowX: "auto", whiteSpace: "pre-wrap", marginBottom: 16 }}>{SQL_INIT}</pre>
          <button style={S.btn("primary")} onClick={loadAll}><Icon name="refresh" size={14} /> J'ai exécuté le SQL, relancer</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ ...S.wrap, alignItems: "center", justifyContent: "center", gap: 16, flexDirection: "column" }}>
        <div style={{ fontSize: 22, fontFamily: "'Playfair Display',serif", color: "#6fcf7a" }}>🌿 Chargement...</div>
        <div style={{ fontSize: 13, color: "#4a7a4e" }}>Connexion à Supabase en cours</div>
      </div>
    );
  }

  // ─── PAGES ────────────────────────────────────────────────────────────────────
  const PageDashboard = () => {
    const cmdsRecentes = [...commandes].slice(0, 6);
    const maxQ = topProduits[0]?.qte || 1;
    return (
      <>
        <div style={S.kpiGrid}>
          {[
            { l: "CA Aujourd'hui", v: fmt(caJour), s: new Date().toLocaleDateString("fr-FR"), c: "#6fcf7a" },
            { l: "CA " + new Date().toLocaleString("fr-FR", { month: "long" }), v: fmt(caMois), s: "Mois en cours", c: "#60d9fa" },
            { l: "CA Total", v: fmt(caTotal), s: "Toutes périodes", c: "#f9c74f" },
            { l: "Relances urgentes", v: relancesUrgentes.length, s: "Dans les 7 jours", c: "#fb923c" },
          ].map(({ l, v, s, c }) => (
            <div key={l} style={S.kpi(c)}>
              <div style={S.kpiL}>{l}</div>
              <div style={S.kpiV(c)}>{v}</div>
              <div style={S.kpiS}>{s}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          <div style={{ background: "#111f12", border: "1px solid #1e3a1e", borderRadius: 10, padding: "10px 16px", fontSize: 12, color: "#a5d6a7" }}>
            👥 <strong style={{ color: "#6fcf7a" }}>{clients.length}</strong> clients
          </div>
          <div style={{ background: "#111f12", border: "1px solid #1e3a1e", borderRadius: 10, padding: "10px 16px", fontSize: 12, color: "#a5d6a7" }}>
            📦 <strong style={{ color: "#6fcf7a" }}>{commandes.length}</strong> commandes
          </div>
          <div style={{ background: "#111f12", border: "1px solid #1e3a1e", borderRadius: 10, padding: "10px 16px", fontSize: 12, color: "#a5d6a7" }}>
            ⏰ <strong style={{ color: "#6fcf7a" }}>{relances.filter(r => r.statut !== "Fait").length}</strong> relances actives
          </div>
        </div>

        <div style={S.grid2}>
          <div style={S.card}>
            <div style={S.secTitle}>🌿 Top Produits</div>
            {topProduits.length === 0 ? <div style={{ color: "#4a7a4e", fontSize: 13 }}>Aucune commande encore</div> :
              topProduits.slice(0, 6).map(({ prod, qte }) => (
                <div key={prod.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: "#c8e6c9" }}>{prod.nom}</span>
                    <span style={{ color: "#6fcf7a", fontWeight: 700 }}>{qte} unités</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "#1e3a1e" }}>
                    <div style={{ height: "100%", width: Math.round(qte / maxQ * 100) + "%", background: "#6fcf7a", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
          </div>
          <div style={S.card}>
            <div style={S.secTitle}>⏰ Relances urgentes</div>
            {relancesUrgentes.length === 0 ? <div style={{ color: "#4a7a4e", fontSize: 13 }}>✅ Aucune relance urgente</div> :
              relancesUrgentes.map(r => {
                const cl = getClient(r.client_id);
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #1a2e1a" }}>
                    <div>
                      <div style={{ fontSize: 13, color: "#c8e6c9", fontWeight: 600 }}>{cl?.nom || "—"}</div>
                      <div style={{ fontSize: 11, color: "#5a8a5e", marginTop: 1 }}>{r.objet}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#fb923c" }}>{fmtDate(r.date)}</span>
                      <button style={{ ...S.btn("ghost"), padding: "3px 7px" }} onClick={() => doneRelance(r.id)}><Icon name="check" size={13} /></button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.secTitle}>📦 Dernières commandes</div>
          {cmdsRecentes.length === 0 ? <div style={{ color: "#4a7a4e", fontSize: 13 }}>Aucune commande</div> :
            <table style={S.table}>
              <thead><tr>{["Client", "Date", "Total", "Statut"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {cmdsRecentes.map(cmd => (
                  <tr key={cmd.id}>
                    <td style={{ ...S.td, fontWeight: 600 }}>{getClient(cmd.client_id)?.nom || "—"}</td>
                    <td style={S.td}>{fmtDate(cmd.date)}</td>
                    <td style={{ ...S.td, fontWeight: 700, color: "#6fcf7a" }}>{fmt(cmd.total)}</td>
                    <td style={S.td}><BADGE label={cmd.statut} color={COLOR_STATUT[cmd.statut] || "#aaa"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>}
        </div>
      </>
    );
  };

  const PageClients = () => {
    const filtered = clients.filter(c =>
      !search || c.nom?.toLowerCase().includes(search.toLowerCase()) ||
      c.ville?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    );
    return (
      <div style={S.card}>
        <table style={S.table}>
          <thead><tr>{["Entreprise / Nom", "Contact", "Email", "Ville", "Segment", "CA Total", ""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setModal({ type: "client_detail", data: c })}>
                <td style={{ ...S.td, fontWeight: 700, color: "#c8e6c9" }}>{c.nom}</td>
                <td style={S.td}>{c.contact || "—"}</td>
                <td style={{ ...S.td, fontSize: 12, color: "#7aad7e" }}>{c.email || "—"}</td>
                <td style={S.td}>{c.ville || "—"}</td>
                <td style={S.td}><BADGE label={c.segment || "Pro"} color="#60d9fa" /></td>
                <td style={{ ...S.td, fontWeight: 700, color: "#6fcf7a" }}>{fmt(c.ca_total)}</td>
                <td style={S.td}>
                  <button style={{ ...S.btn("secondary"), padding: "3px 10px", fontSize: 11 }}
                    onClick={e => { e.stopPropagation(); setModal({ type: "relance_new", data: { client_id: c.id } }); }}>
                    Relancer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: "20px 0", textAlign: "center", color: "#4a7a4e", fontSize: 13 }}>Aucun client trouvé</div>}
      </div>
    );
  };

  const PageCommandes = () => {
    const filtered = commandes.filter(c => {
      if (!search) return true;
      const cl = getClient(c.client_id);
      return cl?.nom?.toLowerCase().includes(search.toLowerCase());
    });
    return (
      <div style={S.card}>
        <table style={S.table}>
          <thead><tr>{["Client", "Date", "Produits", "Total", "Statut"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(cmd => {
              const cl = getClient(cmd.client_id);
              const prods = (cmd.produits || []).map(p => { const pr = PRODUITS.find(x => x.id === p.prod_id); return pr ? `${pr.nom} ×${p.qte}` : ""; }).filter(Boolean).join(", ");
              return (
                <tr key={cmd.id}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{cl?.nom || "—"}</td>
                  <td style={S.td}>{fmtDate(cmd.date)}</td>
                  <td style={{ ...S.td, fontSize: 11, color: "#7aad7e" }}>{prods || "—"}</td>
                  <td style={{ ...S.td, fontWeight: 700, color: "#6fcf7a" }}>{fmt(cmd.total)}</td>
                  <td style={S.td}><BADGE label={cmd.statut} color={COLOR_STATUT[cmd.statut] || "#aaa"} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#4a7a4e", fontSize: 13 }}>Aucune commande</div>}
      </div>
    );
  };

  const PageRelances = () => {
    const todo = relances.filter(r => r.statut !== "Fait");
    const done = relances.filter(r => r.statut === "Fait");
    const Row = ({ r }) => {
      const cl = getClient(r.client_id);
      return (
        <tr key={r.id}>
          <td style={{ ...S.td, fontWeight: 600, color: "#c8e6c9" }}>{cl?.nom || "—"}</td>
          <td style={S.td}>{r.objet}</td>
          <td style={S.td}>{fmtDate(r.date)}</td>
          <td style={S.td}><BADGE label={r.priorite || "Normale"} color={r.priorite === "Haute" ? "#fb923c" : "#60d9fa"} /></td>
          <td style={S.td}><BADGE label={r.statut} color={COLOR_STATUT[r.statut] || "#aaa"} /></td>
          <td style={S.td}>
            {r.statut !== "Fait" && <button style={{ ...S.btn("secondary"), padding: "3px 10px", fontSize: 11 }} onClick={() => doneRelance(r.id)}><Icon name="check" size={12} /> Fait</button>}
          </td>
        </tr>
      );
    };
    return (
      <>
        <div style={S.card}>
          <div style={S.secTitle}>À traiter ({todo.length})</div>
          {todo.length === 0 ? <div style={{ color: "#4a7a4e", fontSize: 13 }}>✅ Tout est traité</div> :
            <table style={S.table}>
              <thead><tr>{["Client", "Objet", "Date", "Priorité", "Statut", ""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{todo.map(r => <Row key={r.id} r={r} />)}</tbody>
            </table>}
        </div>
        {done.length > 0 && (
          <div style={S.card}>
            <div style={S.secTitle}>Effectuées ({done.length})</div>
            <table style={S.table}>
              <thead><tr>{["Client", "Objet", "Date", "Priorité", "Statut", ""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{done.slice(0, 20).map(r => <Row key={r.id} r={r} />)}</tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  const PageProduits = () => {
    const maxQ = topProduits[0]?.qte || 1;
    const caP = useMemo(() => {
      const a = {};
      commandes.filter(c => c.statut !== "Annulé").forEach(cmd => (cmd.produits || []).forEach(({ prod_id, qte }) => {
        const p = PRODUITS.find(x => x.id === prod_id);
        a[prod_id] = (a[prod_id] || 0) + (p ? p.prix * qte : 0);
      }));
      return a;
    }, []);
    return (
      <div style={S.card}>
        <table style={S.table}>
          <thead><tr>{["Produit", "Catégorie", "Prix unit.", "Qté vendue", "CA généré", "Popularité"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {PRODUITS.map(p => {
              const qte = topProduits.find(x => x.prod?.id === p.id)?.qte || 0;
              return (
                <tr key={p.id}>
                  <td style={{ ...S.td, fontWeight: 700, color: "#c8e6c9" }}>{p.nom}</td>
                  <td style={S.td}><BADGE label={p.categorie} color="#a5d6a7" /></td>
                  <td style={{ ...S.td, fontFamily: "monospace" }}>{fmt(p.prix)}</td>
                  <td style={{ ...S.td, fontWeight: 700, color: "#6fcf7a" }}>{qte}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{fmt(caP[p.id] || 0)}</td>
                  <td style={{ ...S.td, width: 140 }}>
                    <div style={{ height: 6, borderRadius: 3, background: "#1e3a1e" }}>
                      <div style={{ height: "100%", width: Math.round(qte / maxQ * 100) + "%", background: "#6fcf7a", borderRadius: 3 }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ─── MODALES ──────────────────────────────────────────────────────────────────
  const ModalHeader = ({ title }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
      <span style={{ fontSize: 17, fontWeight: 800, fontFamily: "serif", color: "#c8e6c9" }}>{title}</span>
      <button style={S.btn("ghost")} onClick={() => setModal(null)}><Icon name="x" /></button>
    </div>
  );

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 13 }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );

  const ModalClientNew = () => {
    const [d, setD] = useState({ nom: "", contact: "", email: "", tel: "", ville: "", segment: "Pro", notes: "" });
    return (
      <div style={S.overlay} onClick={() => setModal(null)}>
        <div style={S.modal} onClick={e => e.stopPropagation()}>
          <ModalHeader title="Nouveau client" />
          {[["Entreprise / Nom", "nom"], ["Contact", "contact"], ["Email", "email"], ["Téléphone", "tel"], ["Ville", "ville"]].map(([l, k]) => (
            <Field key={k} label={l}><input style={S.input} value={d[k]} onChange={e => setD(p => ({ ...p, [k]: e.target.value }))} /></Field>
          ))}
          <Field label="Segment">
            <select style={S.input} value={d.segment} onChange={e => setD(p => ({ ...p, segment: e.target.value }))}>
              {["Pro", "Distributeur", "Revendeur"].map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea style={{ ...S.input, height: 60, resize: "vertical" }} value={d.notes} onChange={e => setD(p => ({ ...p, notes: e.target.value }))} /></Field>
          <button style={S.btn("primary")} onClick={() => saveClient(d)}>Créer le client</button>
        </div>
      </div>
    );
  };

  const ModalCommandeNew = () => {
    const [d, setD] = useState({ client_id: "", statut: "En attente", produits: [{ prod_id: "P1", qte: 1 }], notes: "" });
    const total = d.produits.reduce((s, l) => { const p = PRODUITS.find(x => x.id === l.prod_id); return s + (p ? p.prix * l.qte : 0); }, 0);
    return (
      <div style={S.overlay} onClick={() => setModal(null)}>
        <div style={S.modal} onClick={e => e.stopPropagation()}>
          <ModalHeader title="Nouvelle commande" />
          <Field label="Client">
            <select style={S.input} value={d.client_id} onChange={e => setD(p => ({ ...p, client_id: e.target.value }))}>
              <option value="">Choisir un client...</option>
              {clients.sort((a, b) => a.nom.localeCompare(b.nom)).map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </Field>
          <Field label="Statut">
            <select style={S.input} value={d.statut} onChange={e => setD(p => ({ ...p, statut: e.target.value }))}>
              {["En attente", "En cours", "Livré"].map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Produits">
            {d.produits.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <select style={{ ...S.input, flex: 2 }} value={l.prod_id} onChange={e => setD(p => { const ls = [...p.produits]; ls[i].prod_id = e.target.value; return { ...p, produits: ls }; })}>
                  {PRODUITS.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
                <input type="number" min={1} style={{ ...S.input, width: 65 }} value={l.qte} onChange={e => setD(p => { const ls = [...p.produits]; ls[i].qte = +e.target.value; return { ...p, produits: ls }; })} />
                {d.produits.length > 1 && <button style={S.btn("ghost")} onClick={() => setD(p => ({ ...p, produits: p.produits.filter((_, j) => j !== i) }))}><Icon name="x" size={13} /></button>}
              </div>
            ))}
            <button style={{ ...S.btn("secondary"), fontSize: 11 }} onClick={() => setD(p => ({ ...p, produits: [...p.produits, { prod_id: "P1", qte: 1 }] }))}><Icon name="plus" size={13} /> Ajouter</button>
          </Field>
          <div style={{ background: "#1e3a1e", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14 }}>
            Total : <strong style={{ color: "#6fcf7a" }}>{fmt(total)}</strong>
          </div>
          <button style={S.btn("primary")} onClick={() => saveCommande(d)}>Enregistrer la commande</button>
        </div>
      </div>
    );
  };

  const ModalRelanceNew = () => {
    const [d, setD] = useState({ client_id: modal?.data?.client_id || "", date: "", objet: "", priorite: "Normale" });
    return (
      <div style={S.overlay} onClick={() => setModal(null)}>
        <div style={S.modal} onClick={e => e.stopPropagation()}>
          <ModalHeader title="Nouvelle relance" />
          <Field label="Client">
            <select style={S.input} value={d.client_id} onChange={e => setD(p => ({ ...p, client_id: e.target.value }))}>
              <option value="">Choisir...</option>
              {clients.sort((a, b) => a.nom.localeCompare(b.nom)).map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </Field>
          <Field label="Objet"><input style={S.input} value={d.objet} onChange={e => setD(p => ({ ...p, objet: e.target.value }))} placeholder="Ex: Suivi commande, Proposition nouveauté..." /></Field>
          <Field label="Date"><input type="date" style={S.input} value={d.date} onChange={e => setD(p => ({ ...p, date: e.target.value }))} /></Field>
          <Field label="Priorité">
            <select style={S.input} value={d.priorite} onChange={e => setD(p => ({ ...p, priorite: e.target.value }))}>
              <option>Normale</option><option>Haute</option>
            </select>
          </Field>
          <button style={S.btn("primary")} onClick={() => saveRelance(d)}>Créer la relance</button>
        </div>
      </div>
    );
  };

  const ModalClientDetail = ({ data: c }) => {
    const cmds = commandes.filter(x => x.client_id === c.id);
    return (
      <div style={S.overlay} onClick={() => setModal(null)}>
        <div style={{ ...S.modal, width: 580 }} onClick={e => e.stopPropagation()}>
          <ModalHeader title={c.nom} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
            {[{ l: "CA Total", v: fmt(c.ca_total) }, { l: "Commandes", v: cmds.length }, { l: "Segment", v: c.segment || "Pro" }].map(({ l, v }) => (
              <div key={l} style={{ background: "#0d1a0f", borderRadius: 10, padding: "10px 14px" }}>
                <div style={S.kpiL}>{l}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#6fcf7a" }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "#7aad7e", marginBottom: 6 }}>📧 {c.email || "—"} &nbsp;|&nbsp; 📞 {c.tel || "—"} &nbsp;|&nbsp; 📍 {c.ville || "—"}</div>
          {c.notes && <div style={{ background: "#1e3a1e", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#a5d6a7", marginTop: 10, marginBottom: 14 }}>🏷️ {c.notes}</div>}
          {cmds.length > 0 && (
            <>
              <div style={{ ...S.secTitle, marginTop: 14 }}>Commandes</div>
              {cmds.slice(0, 5).map(cmd => (
                <div key={cmd.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #1a2e1a", fontSize: 13 }}>
                  <span>{fmtDate(cmd.date)}</span>
                  <span style={{ fontWeight: 700, color: "#6fcf7a" }}>{fmt(cmd.total)}</span>
                  <BADGE label={cmd.statut} color={COLOR_STATUT[cmd.statut] || "#aaa"} />
                </div>
              ))}
            </>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button style={S.btn("primary")} onClick={() => setModal({ type: "relance_new", data: { client_id: c.id } })}>+ Relance</button>
            <button style={S.btn("secondary")} onClick={() => setModal({ type: "commande_new" })}>+ Commande</button>
          </div>
        </div>
      </div>
    );
  };

  const ModalImportCSV = () => (
    <div style={S.overlay} onClick={() => setModal(null)}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <ModalHeader title="📥 Import Capsule CRM" />
        <p style={{ fontSize: 13, color: "#a5d6a7", lineHeight: 1.7, marginBottom: 18 }}>
          Importez votre export CSV de Capsule CRM.<br />
          <strong style={{ color: "#6fcf7a" }}>Capsule → Settings → Export → Contacts → CSV</strong><br />
          Les doublons éventuels seront ajoutés, pensez à vérifier après import.
        </p>
        {importProgress ? (
          <div>
            <div style={{ fontSize: 13, color: "#a5d6a7", marginBottom: 10 }}>
              Import en cours… {importProgress.done} / {importProgress.total} lignes traitées
            </div>
            <div style={{ height: 8, background: "#1e3a1e", borderRadius: 4 }}>
              <div style={{ height: "100%", width: Math.round(importProgress.done / importProgress.total * 100) + "%", background: "#6fcf7a", borderRadius: 4, transition: "width .2s" }} />
            </div>
            <div style={{ fontSize: 12, color: "#6fcf7a", marginTop: 8 }}>{importProgress.imported} contacts importés</div>
          </div>
        ) : (
          <>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => e.target.files[0] && importCSV(e.target.files[0])} />
            <button style={S.btn("primary")} onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={14} /> Choisir le fichier CSV
            </button>
          </>
        )}
      </div>
    </div>
  );

  // ─── NAV ──────────────────────────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard", label: "Tableau de bord", icon: "dashboard" },
    { id: "clients", label: "Clients", icon: "clients" },
    { id: "commandes", label: "Commandes", icon: "commandes" },
    { id: "relances", label: "Relances", icon: "relances" },
    { id: "produits", label: "Produits", icon: "produits" },
  ];

  const addBtns = {
    clients: [
      { label: "Importer CSV", action: () => setModal({ type: "import_csv" }), variant: "secondary", icon: "upload" },
      { label: "Nouveau client", action: () => setModal({ type: "client_new" }), variant: "primary", icon: "plus" },
    ],
    commandes: [{ label: "Nouvelle commande", action: () => setModal({ type: "commande_new" }), variant: "primary", icon: "plus" }],
    relances: [{ label: "Nouvelle relance", action: () => setModal({ type: "relance_new", data: {} }), variant: "primary", icon: "plus" }],
  };

  return (
    <div style={S.wrap}>
      {/* Sidebar */}
      <nav style={S.sidebar}>
        <div style={S.logo}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="leaf" size={20} />
            <div>
              <div style={S.logoText}>Jungle Feed</div>
              <div style={S.logoSub}>CRM Commercial</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          {navItems.map(n => (
            <div key={n.id} style={S.nav(page === n.id)} onClick={() => setPage(n.id)}>
              <Icon name={n.icon} size={15} />
              {n.label}
              {n.id === "relances" && relancesUrgentes.length > 0 && (
                <span style={{ marginLeft: "auto", background: "#fb923c", color: "#fff", borderRadius: "50%", width: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{relancesUrgentes.length}</span>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", padding: "0 16px" }}>
          <div style={{ background: "#1e3a1e", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
            <div style={S.kpiL}>CA du jour</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#6fcf7a", fontFamily: "serif" }}>{fmt(caJour)}</div>
          </div>
          <button style={{ ...S.btn("ghost"), width: "100%", justifyContent: "center", fontSize: 11 }} onClick={loadAll}>
            <Icon name="refresh" size={13} /> Actualiser
          </button>
        </div>
      </nav>

      {/* Main */}
      <div style={S.main}>
        <div style={S.header}>
          <div style={S.headerTitle}>{navItems.find(n => n.id === page)?.label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {(page === "clients" || page === "commandes") && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0a1509", border: "1px solid #2e4a2e", borderRadius: 9, padding: "7px 12px" }}>
                <Icon name="search" size={14} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{ background: "none", border: "none", outline: "none", color: "#e8f5e9", fontSize: 12, width: 180 }} />
              </div>
            )}
            {(addBtns[page] || []).map((b, i) => (
              <button key={i} style={S.btn(b.variant)} onClick={b.action}><Icon name={b.icon} size={13} /> {b.label}</button>
            ))}
          </div>
        </div>
        <div style={S.content}>
          {page === "dashboard" && <PageDashboard />}
          {page === "clients" && <PageClients />}
          {page === "commandes" && <PageCommandes />}
          {page === "relances" && <PageRelances />}
          {page === "produits" && <PageProduits />}
        </div>
      </div>

      {/* Modales */}
      {modal?.type === "client_new" && <ModalClientNew />}
      {modal?.type === "commande_new" && <ModalCommandeNew />}
      {modal?.type === "relance_new" && <ModalRelanceNew />}
      {modal?.type === "client_detail" && <ModalClientDetail data={modal.data} />}
      {modal?.type === "import_csv" && <ModalImportCSV />}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, background: toast.type === "error" ? "#7a2020" : "#1e4a24", border: `1px solid ${toast.type === "error" ? "#f87171" : "#4ade80"}`, borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, color: toast.type === "error" ? "#f87171" : "#4ade80", zIndex: 300, boxShadow: "0 8px 24px #00000066" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
