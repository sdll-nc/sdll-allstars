import { useState, useEffect } from "react";

// ─── Supabase ────────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://obrihfpfiahedkvxtnl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmxoZnBmaWFoZWRrdnh0bnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwOTAyMTYsImV4cCI6MjA5NTY2NjIxNn0.RqghH_xfvWPpHRWtrqiT2ObF_OH13SFOgWUDlftPg7E";

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Prefer": "return=representation",
};

async function sbGet(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbUpsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers, "Prefer": "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbDelete(table, match) {
  const params = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join("&");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
}

// ─── Data ────────────────────────────────────────────────────────────────────

const TEAMS = {
  baseball: [
    { id: "bb-juniors", name: "Juniors" },
    { id: "bb-12g", name: "12U Green" },
    { id: "bb-11g", name: "11U Green" },
    { id: "bb-11o", name: "11U Orange" },
    { id: "bb-10g", name: "10U Green" },
    { id: "bb-10o", name: "10U Orange" },
    { id: "bb-9g", name: "9U Green" },
    { id: "bb-9o", name: "9U Orange" },
    { id: "bb-8g", name: "8U Green" },
    { id: "bb-8o", name: "8U Orange" },
  ],
  softball: [
    { id: "sb-12g", name: "12U Green" },
    { id: "sb-10g", name: "10U Green" },
    { id: "sb-10o", name: "10U Orange" },
    { id: "sb-8g", name: "8U Green" },
  ],
};

const ALL_TEAMS = [...TEAMS.baseball, ...TEAMS.softball];
const ADMIN_PASSWORD = "allstars2026";

// ─── Colors ──────────────────────────────────────────────────────────────────

const C = {
  green: "#2D6A2D", greenDark: "#1e4d1e", greenBg: "#f0f7f0", greenBorder: "#bbf7d0",
  orange: "#E85D04", orangeBg: "#fff4ee", orangeBorder: "#fed7aa",
  white: "#FFFFFF", offWhite: "#FAFAFA",
  silver: "#E5E7EB", lightGray: "#F3F4F6",
  gray: "#6B7280", darkGray: "#374151", black: "#111827",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(w, l) {
  const total = w + l;
  if (total === 0) return "—";
  const p = w / total;
  return p === 1 ? "1.000" : p.toFixed(3).replace(/^0/, "");
}

function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m)-1]} ${parseInt(day)}`;
}

function formatDateTime(d, t) {
  const ds = formatDate(d);
  if (!t) return ds;
  const [h, min] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${ds} · ${hour % 12 || 12}:${min} ${ampm}`;
}

const defaultRecords = () => {
  const r = {};
  ALL_TEAMS.forEach(t => { r[t.id] = { w: 0, l: 0 }; });
  return r;
};

// ─── Small Components ────────────────────────────────────────────────────────

function Pill({ children, color = C.green }) {
  return <span style={{ background: color, color: C.white, borderRadius: 3, padding: "1px 7px", fontSize: 10, fontWeight: "bold" }}>{children}</span>;
}

function ResultBadge({ result }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 22, borderRadius: 4, background: result === "W" ? C.green : C.orange, color: C.white, fontWeight: "bold", fontSize: 11 }}>
      {result}
    </span>
  );
}

function FormCard({ title, children }) {
  return (
    <div style={{ background: C.white, borderRadius: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.08)", overflow: "hidden", border: `1px solid ${C.silver}` }}>
      <div style={{ background: C.green, borderBottom: `4px solid ${C.orange}`, padding: "12px 20px" }}>
        <span style={{ color: C.white, fontWeight: "bold", fontSize: 14 }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ color: C.green, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 10px", fontWeight: "bold" }}>{children}</div>;
}

function TeamSelect({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
      <optgroup label="⚾ Baseball">{TEAMS.baseball.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>
      <optgroup label="🥎 Softball">{TEAMS.softball.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>
    </select>
  );
}

function FormField({ label, children }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>;
}

// ─── Bracket Components ──────────────────────────────────────────────────────

function BracketGame({ game, roundIndex, gameIndex, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");

  const team1 = game.team1 || "TBD";
  const team2 = game.team2 || "TBD";
  const hasResult = game.score1 !== undefined && game.score2 !== undefined;
  const winner = hasResult ? (game.score1 > game.score2 ? team1 : team2) : null;

  function handleSave() {
    if (s1 === "" || s2 === "") return;
    onUpdate(roundIndex, gameIndex, parseInt(s1), parseInt(s2));
    setEditing(false); setS1(""); setS2("");
  }

  return (
    <div style={{ background: C.white, border: `1px solid ${C.silver}`, borderRadius: 6, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      {[{ team: team1, score: game.score1 }, { team: team2, score: game.score2 }].map((row, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", padding: "8px 10px", borderBottom: i === 0 ? `1px solid ${C.silver}` : "none", background: winner === row.team ? C.greenBg : C.white }}>
          <span style={{ flex: 1, fontSize: 12, fontWeight: winner === row.team ? "bold" : "normal", color: winner === row.team ? C.green : C.darkGray, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.team}</span>
          {hasResult && <span style={{ fontSize: 14, fontWeight: "bold", color: winner === row.team ? C.green : C.gray, marginLeft: 8, minWidth: 20, textAlign: "right" }}>{row.score}</span>}
        </div>
      ))}
      {(game.date || game.location) && (
        <div style={{ padding: "4px 10px 6px", background: C.lightGray, fontSize: 10, color: C.gray }}>
          {game.date && <span>{formatDateTime(game.date, game.time)}</span>}
          {game.date && game.location && <span> · </span>}
          {game.location && <span>{game.location}</span>}
        </div>
      )}
      {onUpdate && !hasResult && team1 !== "TBD" && team2 !== "TBD" && (
        !editing ? (
          <button onClick={() => setEditing(true)} style={{ width: "100%", background: C.lightGray, border: "none", borderTop: `1px solid ${C.silver}`, color: C.green, fontSize: 11, padding: "5px", cursor: "pointer", fontFamily: "Georgia, serif", fontWeight: "bold" }}>+ Enter Result</button>
        ) : (
          <div style={{ padding: "8px 10px", borderTop: `1px solid ${C.silver}`, background: C.lightGray }}>
            <div style={{ fontSize: 10, color: C.gray, marginBottom: 4 }}>Scores:</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="number" min="0" value={s1} onChange={e => setS1(e.target.value)} style={{ width: "38%", padding: "4px 6px", borderRadius: 4, border: `1px solid ${C.silver}`, fontSize: 13, fontWeight: "bold", textAlign: "center", fontFamily: "Georgia, serif" }} />
              <span style={{ color: C.gray, fontSize: 11 }}>–</span>
              <input type="number" min="0" value={s2} onChange={e => setS2(e.target.value)} style={{ width: "38%", padding: "4px 6px", borderRadius: 4, border: `1px solid ${C.silver}`, fontSize: 13, fontWeight: "bold", textAlign: "center", fontFamily: "Georgia, serif" }} />
              <button onClick={handleSave} style={{ flex: 1, background: C.green, border: "none", color: C.white, borderRadius: 4, padding: "5px 4px", cursor: "pointer", fontSize: 11, fontWeight: "bold", fontFamily: "Georgia, serif" }}>✓</button>
              <button onClick={() => setEditing(false)} style={{ background: "transparent", border: `1px solid ${C.silver}`, color: C.gray, borderRadius: 4, padding: "5px 6px", cursor: "pointer", fontSize: 11, fontFamily: "Georgia, serif" }}>✕</button>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function BracketView({ bracket, onUpdateGame, isAdmin }) {
  if (!bracket) return null;
  const { rounds = [] } = bracket;
  return (
    <div style={{ overflowX: "auto", paddingBottom: 16 }}>
      <div style={{ display: "flex", gap: 0, minWidth: rounds.length * 200 }}>
        {rounds.map((round, ri) => (
          <div key={ri} style={{ flex: 1, minWidth: 190 }}>
            <div style={{ background: ri === rounds.length - 1 ? C.orange : C.green, color: C.white, padding: "8px 12px", fontSize: 11, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase", textAlign: "center", margin: "0 4px 12px", borderRadius: 4 }}>
              {round.name}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 4px" }}>
              {round.games.map((game, gi) => (
                <BracketGame key={gi} game={game} gameIndex={gi} roundIndex={ri} onUpdate={isAdmin && onUpdateGame ? onUpdateGame : null} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("baseball");
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState("result");
  const [activeBracket, setActiveBracket] = useState(0);

  const [records, setRecords] = useState(defaultRecords());
  const [games, setGames] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [brackets, setBrackets] = useState([]);

  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [error, setError] = useState("");

  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [buildingBracket, setBuildingBracket] = useState(false);

  const [resultForm, setResultForm] = useState({
    teamId: ALL_TEAMS[0].id, opponent: "", teamScore: "", oppScore: "",
    date: new Date().toISOString().slice(0, 10), result: "W", round: "",
  });
  const [schedForm, setSchedForm] = useState({
    teamId: ALL_TEAMS[0].id, opponent: "",
    date: new Date().toISOString().slice(0, 10), time: "", location: "",
  });
  const [bracketForm, setBracketForm] = useState({
    title: "", type: "double-elim", teamCount: 8, teamNames: [],
  });

  // ── Load data ──
  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [g, r, s, b] = await Promise.all([
        sbGet("games", "order=date.desc"),
        sbGet("records"),
        sbGet("schedule", "order=date.asc"),
        sbGet("brackets"),
      ]);

      // Build records map
      const recMap = defaultRecords();
      r.forEach(row => { recMap[row.team_id] = { w: row.w, l: row.l }; });
      setRecords(recMap);

      // Games
      setGames(g.map(row => ({
        id: row.id, teamId: row.team_id, opponent: row.opponent,
        teamScore: row.team_score, oppScore: row.opp_score,
        result: row.result, date: row.date, round: row.round || "",
      })));

      // Schedule — group by team
      const schedMap = {};
      s.forEach(row => {
        if (!schedMap[row.team_id]) schedMap[row.team_id] = [];
        schedMap[row.team_id].push({
          id: row.id, teamId: row.team_id, opponent: row.opponent,
          date: row.date, time: row.time || "", location: row.location || "",
        });
      });
      setSchedule(schedMap);

      // Brackets
      setBrackets(b.map(row => ({
        id: row.id, title: row.title, type: row.type,
        teamNames: row.team_names, rounds: row.rounds,
      })));

    } catch (e) {
      setError("Could not connect to database. Check your connection.");
    }
    setLoaded(true);
  }

  function flash(msg) {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(""), 2500);
  }

  // ── Auth ──
  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true); setView("admin"); setAuthError(false); setPassword("");
    } else { setAuthError(true); }
  }

  // ── Result ──
  async function handleAddResult() {
    const { teamId, opponent, teamScore, oppScore, date, result, round } = resultForm;
    if (!opponent || teamScore === "" || oppScore === "") return;
    setSaving(true);
    try {
      const id = Date.now();
      await sbUpsert("games", [{
        id, team_id: teamId, opponent,
        team_score: parseInt(teamScore), opp_score: parseInt(oppScore),
        date, result, round: round || null,
      }]);
      const newRec = { ...records[teamId] };
      if (result === "W") newRec.w += 1; else newRec.l += 1;
      await sbUpsert("records", [{ team_id: teamId, w: newRec.w, l: newRec.l }]);
      const nr = { ...records, [teamId]: newRec };
      setRecords(nr);
      setGames(prev => [{ id, teamId, opponent, teamScore: parseInt(teamScore), oppScore: parseInt(oppScore), date, result, round }, ...prev]);
      setResultForm(f => ({ ...f, opponent: "", teamScore: "", oppScore: "", round: "" }));
      flash("✓ Saved");
    } catch (e) { flash("Error saving"); }
    setSaving(false);
  }

  async function handleDeleteResult(game) {
    try {
      await sbDelete("games", { id: game.id });
      const rec = { ...records[game.teamId] };
      if (game.result === "W") rec.w = Math.max(0, rec.w - 1);
      else rec.l = Math.max(0, rec.l - 1);
      await sbUpsert("records", [{ team_id: game.teamId, w: rec.w, l: rec.l }]);
      setRecords(prev => ({ ...prev, [game.teamId]: rec }));
      setGames(prev => prev.filter(g => g.id !== game.id));
    } catch (e) { flash("Error deleting"); }
  }

  // ── Schedule ──
  async function handleAddSchedule() {
    const { teamId, opponent, date, time, location } = schedForm;
    if (!opponent || !date) return;
    setSaving(true);
    try {
      const id = Date.now();
      await sbUpsert("schedule", [{ id, team_id: teamId, opponent, date, time: time || null, location: location || null }]);
      const newEntry = { id, teamId, opponent, date, time, location };
      setSchedule(prev => ({
        ...prev,
        [teamId]: [...(prev[teamId] || []), newEntry].sort((a, b) => a.date.localeCompare(b.date)),
      }));
      setSchedForm(f => ({ ...f, opponent: "", time: "", location: "" }));
      flash("✓ Saved");
    } catch (e) { flash("Error saving"); }
    setSaving(false);
  }

  async function handleDeleteScheduled(teamId, gameId) {
    try {
      await sbDelete("schedule", { id: gameId });
      setSchedule(prev => ({ ...prev, [teamId]: (prev[teamId] || []).filter(g => g.id !== gameId) }));
    } catch (e) { flash("Error deleting"); }
  }

  // ── Brackets ──
  function buildRounds(teamNames, type) {
    const teams = [...teamNames];
    let size = 4;
    while (size < teams.length) size *= 2;
    while (teams.length < size) teams.push("BYE");

    if (type === "single-elim") {
      const rounds = [];
      let current = teams;
      let rn = 1;
      while (current.length > 1) {
        const gs = [];
        for (let i = 0; i < current.length; i += 2) gs.push({ team1: current[i], team2: current[i+1] });
        rounds.push({ name: current.length === 2 ? "Championship" : rn === 1 ? "Round 1" : `Round ${rn}`, games: gs });
        current = gs.map(() => "TBD");
        rn++;
      }
      return rounds;
    }

    // Double elim
    const winRounds = [], loseRounds = [];
    let wTeams = [...teams], lTeams = [], rn = 1;
    while (wTeams.length > 1) {
      const wGs = [];
      for (let i = 0; i < wTeams.length; i += 2) wGs.push({ team1: wTeams[i], team2: wTeams[i+1] });
      winRounds.push({ name: rn === 1 ? "Winners R1" : `Winners R${rn}`, games: wGs, bracket: "W" });
      const newLosers = wGs.map(() => "TBD");
      if (lTeams.length > 0) {
        const lGs = [];
        for (let i = 0; i < Math.min(lTeams.length, newLosers.length); i++) lGs.push({ team1: lTeams[i] || "TBD", team2: newLosers[i] || "TBD" });
        loseRounds.push({ name: `Losers R${rn}`, games: lGs, bracket: "L" });
        lTeams = lGs.map(() => "TBD");
      } else { lTeams = newLosers; }
      wTeams = wGs.map(() => "TBD");
      rn++;
    }
    if (lTeams.length > 1) {
      const lFGs = [];
      for (let i = 0; i < lTeams.length; i += 2) lFGs.push({ team1: lTeams[i], team2: lTeams[i+1] });
      loseRounds.push({ name: "Losers Final", games: lFGs, bracket: "L" });
    }
    const allRounds = [];
    const maxLen = Math.max(winRounds.length, loseRounds.length);
    for (let i = 0; i < maxLen; i++) {
      if (winRounds[i]) allRounds.push(winRounds[i]);
      if (loseRounds[i]) allRounds.push(loseRounds[i]);
    }
    allRounds.push({ name: "Championship", games: [{ team1: "W Bracket Winner", team2: "L Bracket Winner" }], bracket: "C" });
    return allRounds;
  }

  async function handleCreateBracket() {
    const { title, type, teamNames } = bracketForm;
    if (!title || teamNames.some(n => !n.trim())) return;
    setSaving(true);
    try {
      const id = Date.now();
      const rounds = buildRounds(teamNames.map(n => n.trim()), type);
      await sbUpsert("brackets", [{ id, title, type, team_names: teamNames, rounds }]);
      const nb = [...brackets, { id, title, type, teamNames, rounds }];
      setBrackets(nb);
      setActiveBracket(nb.length - 1);
      setBuildingBracket(false);
      setBracketForm({ title: "", type: "double-elim", teamCount: 8, teamNames: [] });
      flash("✓ Bracket created");
    } catch (e) { flash("Error creating bracket"); }
    setSaving(false);
  }

  async function handleUpdateBracketGame(bracketId, roundIndex, gameIndex, score1, score2) {
    const bracket = brackets.find(b => b.id === bracketId);
    if (!bracket) return;
    const rounds = bracket.rounds.map((r, ri) => {
      if (ri !== roundIndex) return r;
      const games = r.games.map((g, gi) => {
        if (gi !== gameIndex) return g;
        const winner = score1 > score2 ? g.team1 : g.team2;
        return { ...g, score1, score2, winner };
      });
      return { ...r, games };
    });
    try {
      await sbUpsert("brackets", [{ id: bracketId, title: bracket.title, type: bracket.type, team_names: bracket.teamNames, rounds }]);
      setBrackets(prev => prev.map(b => b.id === bracketId ? { ...b, rounds } : b));
    } catch (e) { flash("Error saving result"); }
  }

  async function handleDeleteBracket(id) {
    try {
      await sbDelete("brackets", { id });
      setBrackets(prev => prev.filter(b => b.id !== id));
      setActiveBracket(0);
    } catch (e) { flash("Error deleting"); }
  }

  const teamName = id => ALL_TEAMS.find(t => t.id === id)?.name || id;
  const teamDiv = id => TEAMS.baseball.find(t => t.id === id) ? "Baseball" : "Softball";

  // ── Loading / Error ──
  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: C.green, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 40, height: 40, border: `3px solid rgba(255,255,255,0.3)`, borderTop: `3px solid ${C.white}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ color: C.white, fontFamily: "Georgia, serif" }}>Loading scoreboard…</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: C.lightGray, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.white, borderRadius: 8, padding: 32, textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ color: C.darkGray, fontFamily: "Georgia, serif" }}>{error}</div>
        <button onClick={loadAll} style={{ ...primaryBtn, marginTop: 20, width: "auto", padding: "10px 24px" }}>Retry</button>
      </div>
    </div>
  );

  // ── Main render ──
  return (
    <div style={{ minHeight: "100vh", background: C.lightGray, fontFamily: "Georgia, 'Times New Roman', serif", color: C.black }}>

      {/* Header */}
      <div style={{ background: C.green, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "repeating-linear-gradient(-45deg, #fff 0, #fff 1px, transparent 0, transparent 6px)" }} />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: C.white, border: `3px solid ${C.orange}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 10px rgba(0,0,0,0.25)", lineHeight: 1 }}>
                <span style={{ fontSize: 10, fontWeight: "bold", color: C.green, letterSpacing: 0.5 }}>SDLL</span>
                <span style={{ fontSize: 18 }}>⚾</span>
              </div>
              <div>
                <div style={{ color: C.orange, fontSize: 10, letterSpacing: 3, fontWeight: "bold", textTransform: "uppercase", marginBottom: 3 }}>South Durham Little League</div>
                <h1 style={{ margin: 0, color: C.white, fontSize: "clamp(18px, 5vw, 28px)", fontWeight: "bold", lineHeight: 1.1 }}>2026 All Star Scoreboard</h1>
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 4 }}>NC District 6</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexShrink: 0 }}>
              {isAdmin
                ? <button onClick={() => setView(view === "admin" ? "baseball" : "admin")} style={{ ...headerBtn, background: view === "admin" ? C.orange : "transparent" }}>{view === "admin" ? "← Scoreboard" : "Admin"}</button>
                : <button onClick={() => setView("login")} style={headerBtn}>Board Login</button>
              }
            </div>
          </div>

          <div style={{ height: 4, background: C.orange, margin: "16px -16px 0" }} />

          {view !== "admin" && view !== "login" && (
            <div style={{ display: "flex", gap: 2 }}>
              {[
                { key: "baseball", label: "⚾ Baseball", count: TEAMS.baseball.length },
                { key: "softball", label: "🥎 Softball", count: TEAMS.softball.length },
                { key: "brackets", label: "🏆 Brackets", count: brackets.length },
              ].map(tab => (
                <button key={tab.key} onClick={() => { setView(tab.key); setExpandedTeam(null); }}
                  style={{ background: view === tab.key ? C.white : "transparent", border: "none", color: view === tab.key ? C.green : "rgba(255,255,255,0.75)", padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: "bold", fontFamily: "Georgia, serif", borderRadius: "4px 4px 0 0", marginTop: 8 }}>
                  {tab.label}
                  {tab.count > 0 && <span style={{ marginLeft: 5, background: view === tab.key ? C.orange : "rgba(255,255,255,0.2)", color: C.white, borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: "bold" }}>{tab.count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 48px" }}>

        {/* LOGIN */}
        {view === "login" && (
          <div style={{ maxWidth: 380, margin: "40px auto" }}>
            <div style={{ background: C.white, borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", overflow: "hidden" }}>
              <div style={{ background: C.green, padding: "22px 24px 18px", textAlign: "center", borderBottom: `4px solid ${C.orange}` }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🔒</div>
                <div style={{ color: C.white, fontWeight: "bold", fontSize: 16 }}>Board Member Access</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 3 }}>Manage results, schedules & brackets</div>
              </div>
              <div style={{ padding: 24 }}>
                <label style={labelStyle}>Password</label>
                <input type="password" placeholder="Enter password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  style={{ ...inputStyle, borderColor: authError ? C.orange : "#ddd", marginBottom: authError ? 6 : 16 }} />
                {authError && <div style={{ color: C.orange, fontSize: 12, marginBottom: 14 }}>Incorrect password.</div>}
                <button onClick={handleLogin} style={primaryBtn}>Sign In</button>
              </div>
            </div>
          </div>
        )}

        {/* SCOREBOARD */}
        {(view === "baseball" || view === "softball") && (() => {
          const teams = view === "baseball" ? TEAMS.baseball : TEAMS.softball;
          return (
            <div>
              <div style={{ display: "flex", alignItems: "center", padding: "0 16px 8px", borderBottom: `2px solid ${C.green}`, marginBottom: 6 }}>
                <span style={{ flex: 1, ...colHeaderStyle }}>Team</span>
                <span style={{ width: 52, textAlign: "center", ...colHeaderStyle }}>W</span>
                <span style={{ width: 52, textAlign: "center", ...colHeaderStyle }}>L</span>
                <span style={{ width: 68, textAlign: "center", ...colHeaderStyle }}>PCT</span>
                <span style={{ width: 32 }} />
              </div>
              {teams.map(team => {
                const rec = records[team.id] || { w: 0, l: 0 };
                const teamGames = games.filter(g => g.teamId === team.id);
                const today = new Date().toISOString().slice(0, 10);
                const upcoming = (schedule[team.id] || []).filter(s => s.date >= today);
                const isExpanded = expandedTeam === team.id;
                return (
                  <div key={team.id} style={{ background: C.white, borderRadius: 6, marginBottom: 5, overflow: "hidden", boxShadow: isExpanded ? "0 3px 12px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.07)", border: `1px solid ${isExpanded ? C.green : C.silver}`, transition: "all 0.15s" }}>
                    <div onClick={() => setExpandedTeam(p => p === team.id ? null : team.id)}
                      style={{ display: "flex", alignItems: "center", padding: "13px 16px", cursor: "pointer", background: isExpanded ? C.greenBg : C.white, borderLeft: `4px solid ${isExpanded ? C.green : C.silver}`, transition: "background 0.12s" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "bold", fontSize: 15, color: isExpanded ? C.green : C.black }}>{team.name}</div>
                        <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>
                          {teamGames.length > 0 ? `${teamGames.length} result${teamGames.length !== 1 ? "s" : ""}` : "No results yet"}
                          {upcoming.length > 0 && ` · ${upcoming.length} upcoming`}
                        </div>
                      </div>
                      <div style={{ width: 52, textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 28, borderRadius: 4, background: rec.w > 0 ? C.green : C.lightGray, color: rec.w > 0 ? C.white : C.gray, fontWeight: "bold", fontSize: 16 }}>{rec.w}</span>
                      </div>
                      <div style={{ width: 52, textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 28, borderRadius: 4, background: rec.l > 0 ? C.orange : C.lightGray, color: rec.l > 0 ? C.white : C.gray, fontWeight: "bold", fontSize: 16 }}>{rec.l}</span>
                      </div>
                      <div style={{ width: 68, textAlign: "center", fontWeight: "bold", fontSize: 15, color: C.darkGray }}>{pct(rec.w, rec.l)}</div>
                      <div style={{ width: 32, textAlign: "center", color: C.gray, fontSize: 12, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</div>
                    </div>

                    {isExpanded && (
                      <div style={{ borderTop: `1px solid ${C.silver}` }}>
                        {upcoming.length > 0 && (
                          <div>
                            <div style={{ padding: "8px 16px 6px 20px", background: "#fffbeb", borderBottom: `1px solid #fde68a` }}>
                              <span style={{ fontSize: 11, fontWeight: "bold", color: "#92400e", letterSpacing: 1, textTransform: "uppercase" }}>📅 Upcoming</span>
                            </div>
                            {upcoming.map(g => (
                              <div key={g.id} style={{ display: "flex", alignItems: "center", padding: "9px 16px 9px 20px", borderBottom: `1px solid ${C.silver}`, background: "#fffbeb", fontSize: 12 }}>
                                <span style={{ width: 110, color: "#92400e", fontWeight: "bold" }}>{formatDateTime(g.date, g.time)}</span>
                                <span style={{ flex: 1, color: C.darkGray }}>vs. {g.opponent}</span>
                                {g.location && <span style={{ color: C.gray, fontSize: 11 }}>📍 {g.location}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                        {teamGames.length > 0 ? (
                          <div>
                            <div style={{ display: "flex", padding: "8px 16px 6px 20px", background: C.lightGray, borderBottom: `1px solid ${C.silver}` }}>
                              <span style={{ width: 80, ...colHeaderStyle }}>Date</span>
                              <span style={{ flex: 1, ...colHeaderStyle }}>Opponent</span>
                              <span style={{ width: 60, textAlign: "center", ...colHeaderStyle }}>Score</span>
                              <span style={{ width: 50, textAlign: "center", ...colHeaderStyle }}>W/L</span>
                              <span style={{ flex: 0.7, textAlign: "right", ...colHeaderStyle }}>Round</span>
                            </div>
                            {teamGames.map((g, gi) => (
                              <div key={g.id} style={{ display: "flex", alignItems: "center", padding: "10px 16px 10px 20px", borderBottom: gi < teamGames.length - 1 ? `1px solid ${C.silver}` : "none", background: gi % 2 === 0 ? C.white : C.offWhite }}>
                                <span style={{ width: 80, fontSize: 12, color: C.gray, fontWeight: "bold" }}>{formatDate(g.date)}</span>
                                <span style={{ flex: 1, fontSize: 13, color: C.darkGray }}>vs. {g.opponent}</span>
                                <span style={{ width: 60, textAlign: "center", fontSize: 13, fontWeight: "bold" }}>{g.teamScore}–{g.oppScore}</span>
                                <div style={{ width: 50, textAlign: "center" }}><ResultBadge result={g.result} /></div>
                                <span style={{ flex: 0.7, textAlign: "right", fontSize: 11, color: g.round ? C.green : "#ccc" }}>{g.round || "—"}</span>
                              </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 20px", background: C.greenBg, borderTop: `2px solid ${C.silver}` }}>
                              <span style={{ fontSize: 12, color: C.green, fontWeight: "bold" }}>Season Record</span>
                              <span style={{ fontSize: 14, fontWeight: "bold", color: C.green }}>{rec.w}–{rec.l} <span style={{ color: C.gray, fontWeight: "normal", fontSize: 12 }}>{pct(rec.w, rec.l)} PCT</span></span>
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: "24px 20px", textAlign: "center", color: C.gray, fontSize: 13, fontStyle: "italic", background: C.offWhite }}>
                            No results yet. {upcoming.length === 0 && "Check back after their first game!"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ marginTop: 12, fontSize: 11, color: C.gray, textAlign: "center" }}>Tap any team to see their schedule & results</div>
            </div>
          );
        })()}

        {/* BRACKETS */}
        {view === "brackets" && (
          <div>
            {brackets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: C.gray }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🏆</div>
                <div style={{ fontSize: 16, fontWeight: "bold", color: C.darkGray, marginBottom: 8 }}>No brackets yet</div>
                <div style={{ fontSize: 13 }}>Brackets will appear here once a board member sets them up.</div>
              </div>
            ) : (
              <div>
                {brackets.length > 1 && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                    {brackets.map((b, i) => (
                      <button key={b.id} onClick={() => setActiveBracket(i)}
                        style={{ background: activeBracket === i ? C.green : C.white, border: `1px solid ${activeBracket === i ? C.green : C.silver}`, color: activeBracket === i ? C.white : C.darkGray, padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: "bold", fontFamily: "Georgia, serif" }}>
                        {b.title}
                      </button>
                    ))}
                  </div>
                )}
                {brackets[activeBracket] && (
                  <div style={{ background: C.white, borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", border: `1px solid ${C.silver}` }}>
                    <div style={{ background: C.green, borderBottom: `4px solid ${C.orange}`, padding: "14px 20px" }}>
                      <div style={{ color: C.white, fontWeight: "bold", fontSize: 16 }}>🏆 {brackets[activeBracket].title}</div>
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 }}>
                        {brackets[activeBracket].type === "double-elim" ? "Double Elimination" : "Single Elimination"} · {brackets[activeBracket].teamNames.length} teams
                      </div>
                    </div>
                    <div style={{ padding: 16 }}>
                      <BracketView bracket={brackets[activeBracket]} isAdmin={isAdmin}
                        onUpdateGame={isAdmin ? (ri, gi, s1, s2) => handleUpdateBracketGame(brackets[activeBracket].id, ri, gi, s1, s2) : null} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ADMIN */}
        {view === "admin" && isAdmin && (
          <div>
            <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `2px solid ${C.silver}` }}>
              {[{ key: "result", label: "📋 Enter Result" }, { key: "schedule", label: "📅 Add Game" }, { key: "bracket", label: "🏆 Brackets" }].map(t => (
                <button key={t.key} onClick={() => setAdminTab(t.key)}
                  style={{ background: adminTab === t.key ? C.green : "transparent", border: "none", borderBottom: adminTab === t.key ? `3px solid ${C.orange}` : "3px solid transparent", color: adminTab === t.key ? C.white : C.gray, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontWeight: "bold", fontFamily: "Georgia, serif", borderRadius: "4px 4px 0 0" }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Enter Result */}
            {adminTab === "result" && (
              <div>
                <FormCard title="Game Result">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 4 }}>
                    <div style={{ gridColumn: "1 / -1" }}><FormField label="Team"><TeamSelect value={resultForm.teamId} onChange={v => setResultForm(f => ({ ...f, teamId: v }))} /></FormField></div>
                    <div style={{ gridColumn: "1 / -1" }}><FormField label="Opponent"><input type="text" placeholder="e.g. Bull City Little League" value={resultForm.opponent} onChange={e => setResultForm(f => ({ ...f, opponent: e.target.value }))} style={inputStyle} /></FormField></div>
                    <FormField label="SDLL Score"><input type="number" min="0" value={resultForm.teamScore} onChange={e => { const ts = e.target.value; const result = ts !== "" && resultForm.oppScore !== "" ? (parseInt(ts) >= parseInt(resultForm.oppScore) ? "W" : "L") : resultForm.result; setResultForm(f => ({ ...f, teamScore: ts, result })); }} style={{ ...inputStyle, fontSize: 24, fontWeight: "bold", textAlign: "center", color: C.green }} /></FormField>
                    <FormField label="Opponent Score"><input type="number" min="0" value={resultForm.oppScore} onChange={e => { const os = e.target.value; const result = resultForm.teamScore !== "" && os !== "" ? (parseInt(resultForm.teamScore) >= parseInt(os) ? "W" : "L") : resultForm.result; setResultForm(f => ({ ...f, oppScore: os, result })); }} style={{ ...inputStyle, fontSize: 24, fontWeight: "bold", textAlign: "center", color: C.orange }} /></FormField>
                    <FormField label="Date"><input type="date" value={resultForm.date} onChange={e => setResultForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} /></FormField>
                    <FormField label="Round (optional)"><input type="text" placeholder="e.g. District Semis" value={resultForm.round} onChange={e => setResultForm(f => ({ ...f, round: e.target.value }))} style={inputStyle} /></FormField>
                  </div>
                  {resultForm.teamScore !== "" && resultForm.oppScore !== "" && (
                    <div style={{ margin: "16px 0", padding: "10px 16px", background: resultForm.result === "W" ? C.greenBg : C.orangeBg, border: `1px solid ${resultForm.result === "W" ? C.greenBorder : C.orangeBorder}`, borderRadius: 6, fontSize: 14, fontWeight: "bold", color: resultForm.result === "W" ? C.green : C.orange }}>
                      {resultForm.result === "W" ? "✓ Win" : "✗ Loss"} — {teamName(resultForm.teamId)} {resultForm.teamScore}, {resultForm.opponent || "Opponent"} {resultForm.oppScore}
                    </div>
                  )}
                  <button onClick={handleAddResult} disabled={!resultForm.opponent || resultForm.teamScore === "" || resultForm.oppScore === ""} style={{ ...primaryBtn, opacity: (!resultForm.opponent || resultForm.teamScore === "" || resultForm.oppScore === "") ? 0.4 : 1 }}>
                    {saving ? "Saving…" : `Save Result${saveMsg ? "  " + saveMsg : ""}`}
                  </button>
                </FormCard>
                {games.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <SectionLabel>Recent Entries</SectionLabel>
                    {games.slice(0, 12).map(g => (
                      <div key={g.id} style={{ background: C.white, border: `1px solid ${C.silver}`, borderLeft: `4px solid ${g.result === "W" ? C.green : C.orange}`, borderRadius: 6, marginBottom: 6, padding: "9px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                        <span style={{ fontWeight: "bold", color: g.result === "W" ? C.green : C.orange, width: 14 }}>{g.result}</span>
                        <span style={{ color: C.green, fontWeight: "bold", minWidth: 110 }}>{teamDiv(g.teamId)} {teamName(g.teamId)}</span>
                        <span style={{ flex: 1, color: C.gray }}>vs. {g.opponent}</span>
                        <span style={{ fontWeight: "bold", color: C.darkGray }}>{g.teamScore}–{g.oppScore}</span>
                        <span style={{ color: C.gray, fontSize: 11 }}>{formatDate(g.date)}</span>
                        {g.round && <Pill>{g.round}</Pill>}
                        <button onClick={() => handleDeleteResult(g)} style={deleteBtn}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Schedule */}
            {adminTab === "schedule" && (
              <div>
                <FormCard title="Add Upcoming Game">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 4 }}>
                    <div style={{ gridColumn: "1 / -1" }}><FormField label="Team"><TeamSelect value={schedForm.teamId} onChange={v => setSchedForm(f => ({ ...f, teamId: v }))} /></FormField></div>
                    <div style={{ gridColumn: "1 / -1" }}><FormField label="Opponent"><input type="text" placeholder="e.g. East Chapel Hill LL" value={schedForm.opponent} onChange={e => setSchedForm(f => ({ ...f, opponent: e.target.value }))} style={inputStyle} /></FormField></div>
                    <FormField label="Date"><input type="date" value={schedForm.date} onChange={e => setSchedForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} /></FormField>
                    <FormField label="Time (optional)"><input type="time" value={schedForm.time} onChange={e => setSchedForm(f => ({ ...f, time: e.target.value }))} style={inputStyle} /></FormField>
                    <div style={{ gridColumn: "1 / -1" }}><FormField label="Location (optional)"><input type="text" placeholder="e.g. Herndon Park Field 1" value={schedForm.location} onChange={e => setSchedForm(f => ({ ...f, location: e.target.value }))} style={inputStyle} /></FormField></div>
                  </div>
                  <button onClick={handleAddSchedule} disabled={!schedForm.opponent || !schedForm.date} style={{ ...primaryBtn, opacity: (!schedForm.opponent || !schedForm.date) ? 0.4 : 1 }}>
                    {saving ? "Saving…" : "Add to Schedule"}
                  </button>
                </FormCard>
                {Object.keys(schedule).length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <SectionLabel>Scheduled Games</SectionLabel>
                    {ALL_TEAMS.filter(t => schedule[t.id]?.length > 0).map(team => (
                      <div key={team.id} style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: "bold", color: C.green, fontSize: 13, marginBottom: 6 }}>{teamDiv(team.id)} — {team.name}</div>
                        {(schedule[team.id] || []).map(g => (
                          <div key={g.id} style={{ background: C.white, border: `1px solid ${C.silver}`, borderLeft: `4px solid ${C.orange}`, borderRadius: 6, marginBottom: 5, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                            <span style={{ color: "#92400e", fontWeight: "bold", minWidth: 100 }}>{formatDateTime(g.date, g.time)}</span>
                            <span style={{ flex: 1, color: C.darkGray }}>vs. {g.opponent}</span>
                            {g.location && <span style={{ color: C.gray }}>📍 {g.location}</span>}
                            <button onClick={() => handleDeleteScheduled(team.id, g.id)} style={deleteBtn}>✕</button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Brackets */}
            {adminTab === "bracket" && (
              <div>
                {brackets.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <SectionLabel>Active Brackets</SectionLabel>
                    {brackets.map(b => (
                      <div key={b.id} style={{ background: C.white, border: `1px solid ${C.silver}`, borderLeft: `4px solid ${C.green}`, borderRadius: 6, padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontWeight: "bold", color: C.green, fontSize: 14 }}>🏆 {b.title}</div>
                          <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>{b.type === "double-elim" ? "Double Elimination" : "Single Elimination"} · {b.teamNames.length} teams</div>
                        </div>
                        <button onClick={() => handleDeleteBracket(b.id)} style={{ ...deleteBtn, padding: "4px 10px", fontSize: 12 }}>Delete</button>
                      </div>
                    ))}
                  </div>
                )}
                {!buildingBracket ? (
                  <button onClick={() => setBuildingBracket(true)} style={{ ...primaryBtn, width: "auto", padding: "12px 24px" }}>+ Create New Bracket</button>
                ) : (
                  <FormCard title="New Bracket">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 4 }}>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <FormField label="Bracket Name"><input type="text" placeholder="e.g. 10U Baseball — District 6" value={bracketForm.title} onChange={e => setBracketForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} /></FormField>
                      </div>
                      <FormField label="Format">
                        <select value={bracketForm.type} onChange={e => setBracketForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                          <option value="double-elim">Double Elimination</option>
                          <option value="single-elim">Single Elimination</option>
                        </select>
                      </FormField>
                      <FormField label="Number of Teams">
                        <select value={bracketForm.teamCount}
                          onChange={e => {
                            const count = parseInt(e.target.value);
                            setBracketForm(f => ({ ...f, teamCount: count, teamNames: Array(count).fill("") }));
                          }} style={inputStyle}>
                          {[4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n} teams</option>)}
                        </select>
                      </FormField>
                    </div>
                    {bracketForm.teamCount > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ ...colHeaderStyle, marginBottom: 10 }}>Enter Team Names</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {Array(bracketForm.teamCount).fill(0).map((_, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 11, color: C.gray, width: 20, textAlign: "right", flexShrink: 0 }}>{i+1}.</span>
                              <input type="text" placeholder={`Team ${i+1}`}
                                value={(bracketForm.teamNames || [])[i] || ""}
                                onChange={e => {
                                  const names = [...(bracketForm.teamNames || Array(bracketForm.teamCount).fill(""))];
                                  names[i] = e.target.value;
                                  setBracketForm(f => ({ ...f, teamNames: names }));
                                }}
                                style={{ ...inputStyle, padding: "7px 10px", fontSize: 13 }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                      <button onClick={handleCreateBracket}
                        disabled={!bracketForm.title || (bracketForm.teamNames || []).some(n => !n?.trim())}
                        style={{ ...primaryBtn, flex: 1, opacity: (!bracketForm.title || (bracketForm.teamNames || []).some(n => !n?.trim())) ? 0.4 : 1 }}>
                        {saving ? "Creating…" : "Create Bracket"}
                      </button>
                      <button onClick={() => setBuildingBracket(false)} style={{ background: "transparent", border: `1px solid ${C.silver}`, color: C.gray, padding: "13px 20px", borderRadius: 6, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 14 }}>Cancel</button>
                    </div>
                  </FormCard>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: C.green, borderTop: `4px solid ${C.orange}`, padding: "16px 24px", textAlign: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: 1.5 }}>
          SOUTH DURHAM LITTLE LEAGUE · NC DISTRICT 6 · 2026 ALL STARS
        </div>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const colHeaderStyle = { fontSize: 11, fontWeight: "bold", letterSpacing: 1.5, color: "#6B7280", textTransform: "uppercase" };
const labelStyle = { display: "block", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#6B7280", marginBottom: 5, fontWeight: "bold" };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#111", fontSize: 14, boxSizing: "border-box", fontFamily: "Georgia, serif", outline: "none" };
const primaryBtn = { width: "100%", background: C.green, border: `2px solid ${C.orange}`, color: "#fff", padding: "13px", borderRadius: 6, fontSize: 15, fontWeight: "bold", cursor: "pointer", fontFamily: "Georgia, serif", letterSpacing: 0.5 };
const headerBtn = { background: "transparent", border: "1px solid rgba(255,255,255,0.35)", color: "rgba(255,255,255,0.75)", padding: "6px 14px", borderRadius: 4, cursor: "pointer", fontSize: 11, letterSpacing: 1, fontFamily: "Georgia, serif" };
const deleteBtn = { background: "transparent", border: "1px solid #ddd", color: C.orange, borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: 11, fontFamily: "Georgia, serif" };
