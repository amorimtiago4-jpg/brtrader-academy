import { useState, useEffect } from "react";

// ─── SUPABASE CONFIG ─────────────────────────────────────────────────────────
const SUPA_URL = "https://vuhgcsraditjquklwoor.supabase.co";
const SUPA_KEY = process.env.REACT_APP_SUPA_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aGdjc3JhZGl0anF1a2x3b29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NDYzNjYsImV4cCI6MjEwMzMyMjM2Nn0.e-iW0KBTbSErJXHb0X6gDw-ZDrnV5ymE3Fui0QhUtSE";

const supaFetch = async (path, options = {}) => {
  const k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aGdjc3JhZGl0anF1a2x3b29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NDYzNjYsImV4cCI6MjEwMzMyMjM2Nn0.e-iW0KBTbSErJXHb0X6gDw-ZDrnV5ymE3Fui0QhUtSE";
  const sep = path.includes("?") ? "&" : "?";
  const url = SUPA_URL + "/rest/v1" + path + sep + "apikey=" + k;
  const { prefer, headers: extraHeaders, ...restOptions } = options;
  const res = await fetch(url, {
    ...restOptions,
    headers: {
      "apikey": k,
      "Authorization": "Bearer " + k,
      "Content-Type": "application/json",
      "Prefer": prefer || "return=representation",
      ...(extraHeaders || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

// Buscar todos os usuários como objeto {id: user}
const getUsers = async () => {
  try {
    const rows = await supaFetch("/users?select=*");
    const obj = {};
    (rows || []).forEach(u => {
      obj[u.id] = {
        id: u.id, name: u.name, email: u.email, password: u.password,
        code: u.code, levelIndice: u.level_indice, levelForex: u.level_forex,
        createdAt: u.created_at,
      };
    });
    return obj;
  } catch(e) { console.error("getUsers:", e); return {}; }
};

// Salvar/atualizar usuário
const setUsers = async (usersObj) => {
  // Não usado diretamente — usar saveUser
};

const saveUser = async (user) => {
  try {
    await supaFetch("/users", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      headers: { "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({
        id: user.id, name: user.name, email: user.email,
        password: user.password, code: user.code,
        level_indice: user.levelIndice || 1,
        level_forex: user.levelForex || 1,
        created_at: user.createdAt,
      }),
    });
  } catch(e) { console.error("saveUser:", e); throw e; }
};

const updateUserLevel = async (userId, levelKey, newLevel) => {
  const col = levelKey === "levelIndice" ? "level_indice" : "level_forex";
  try {
    await supaFetch("/users?id=eq." + userId, {
      method: "PATCH",
      body: JSON.stringify({ [col]: newLevel }),
    });
  } catch(e) { console.error("updateUserLevel:", e); throw e; }
};

// Buscar todos os logs como array
const getLogs = async () => {
  try {
    const rows = await supaFetch("/logs?select=*&order=date.desc");
    return (rows || []).map(l => ({
      id: l.id, userId: l.user_id, date: l.date,
      result: Number(l.result), followed: l.followed,
      status: l.status, level: l.level, session: l.session,
    }));
  } catch(e) { console.error("getLogs:", e); return []; }
};

// Salvar um novo log
const saveLog = async (log) => {
  try {
    await supaFetch("/logs", {
      method: "POST",
      body: JSON.stringify({
        id: log.id, user_id: log.userId, date: log.date,
        result: log.result, followed: log.followed,
        status: log.status, level: log.level, session: log.session,
      }),
    });
  } catch(e) { console.error("saveLog:", e); throw e; }
};

const setLogs = async () => {}; // não usado diretamente

const SESSIONS = {
  indice: { id: "indice", label: "Mini Índice", time: "Manhã", professor: "Elias Júnior", icon: "🇧🇷", color: "#00F1A5", unit: "contrato", currency: "BRL" },
  forex:  { id: "forex",  label: "Forex",       time: "Noite", professor: "Diego",        icon: "🌐", color: "#D2FFF1", unit: "tic",      currency: "USD" },
};

// Níveis Mini Índice — contratos, metas em R$, projeção salarial (22 dias úteis)
const LEVELS_INDICE = [
  { id:1, name:"Aprendiz",      size:1,  minBank:500,  minGoal:70,  maxGoal:100, color:"#89BAAA", icon:"🌱", salMin:1540, salMax:2200,  salLabel:"R$ 1.540 – R$ 2.200/mês", dias:"10 a 14 dias úteis", diasDesc:"Meta da promoção: 10 dias seguidos com disciplina e resultado" },
  { id:2, name:"Iniciante",     size:2,  minBank:1000, minGoal:140, maxGoal:200, color:"#00F1A5", icon:"📈", salMin:3080, salMax:4400,  salLabel:"R$ 3.080 – R$ 4.400/mês", dias:"10 a 14 dias úteis", diasDesc:"Mantenha 2 semanas consistentes para avançar" },
  { id:3, name:"Intermediário", size:3,  minBank:1500, minGoal:210, maxGoal:300, color:"#D2FFF1", icon:"⚡", salMin:4620, salMax:6600,  salLabel:"R$ 4.620 – R$ 6.600/mês", dias:"10 a 14 dias úteis", diasDesc:"Consistência é a chave — 2 semanas sólidas" },
  { id:4, name:"Avançado",      size:5,  minBank:2500, minGoal:350, maxGoal:500, color:"#00F1A5", icon:"🏆", salMin:7700, salMax:11000, salLabel:"R$ 7.700 – R$ 11.000/mês", dias:"10 a 14 dias úteis", diasDesc:"Você está perto do topo — 2 semanas finais" },
  { id:5, name:"Profissional",  size:10, minBank:5000, minGoal:500, maxGoal:700, color:"#E05C5C", icon:"🎯", salMin:11000,salMax:15400, salLabel:"R$ 11.000 – R$ 15.400/mês", dias:"Nível final",        diasDesc:"Você chegou — agora é consistência e crescimento" },
];

// Níveis Forex — tics (lote 0.01), metas em USD, projeção salarial (22 dias úteis)
const LEVELS_FOREX = [
  { id:1, name:"Aprendiz",      size:0.01, minBank:100,  minGoal:15,  maxGoal:20,  color:"#89BAAA", icon:"🌱", salMin:330,  salMax:440,  salLabel:"$ 330 – $ 440/mês",       dias:"10 a 14 dias úteis", diasDesc:"Meta da promoção: 10 dias seguidos com disciplina e resultado" },
  { id:2, name:"Iniciante",     size:0.02, minBank:200,  minGoal:30,  maxGoal:40,  color:"#00F1A5", icon:"📈", salMin:660,  salMax:880,  salLabel:"$ 660 – $ 880/mês",       dias:"10 a 14 dias úteis", diasDesc:"Mantenha 2 semanas consistentes para avançar" },
  { id:3, name:"Intermediário", size:0.05, minBank:500,  minGoal:75,  maxGoal:100, color:"#D2FFF1", icon:"⚡", salMin:1650, salMax:2200, salLabel:"$ 1.650 – $ 2.200/mês",   dias:"10 a 14 dias úteis", diasDesc:"Consistência é a chave — 2 semanas sólidas" },
  { id:4, name:"Avançado",      size:0.10, minBank:1000, minGoal:150, maxGoal:200, color:"#00F1A5", icon:"🏆", salMin:3300, salMax:4400, salLabel:"$ 3.300 – $ 4.400/mês",   dias:"10 a 14 dias úteis", diasDesc:"Você está perto do topo — 2 semanas finais" },
  { id:5, name:"Profissional",  size:0.20, minBank:2000, minGoal:300, maxGoal:400, color:"#E05C5C", icon:"🎯", salMin:6600, salMax:8800, salLabel:"$ 6.600 – $ 8.800/mês",   dias:"Nível final",        diasDesc:"Você chegou — agora é consistência e crescimento" },
];

// Helper para pegar nível correto por sessão
const getLevels  = (sessionId) => sessionId === "forex" ? LEVELS_FOREX  : LEVELS_INDICE;
const getLevel   = (sessionId, levelId) => getLevels(sessionId)[(levelId||1)-1];
const LEVELS     = LEVELS_INDICE; // fallback para componentes genéricos

const ADMINS = {
  "elias@brtrader.com":   { pass:"elias2024",   name:"Elias Júnior", session:"indice", role:"admin" },
  "diego@brtrader.com":   { pass:"diego2024",   name:"Diego",        session:"forex",  role:"admin" },
  "diretor@brtrader.com": { pass:"diretor2024", name:"Diretor",      session:"all",    role:"diretor" },
};

const today = () => new Date().toISOString().slice(0,10);
const fmtBRL = (v) => "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits:2 });
const fmtUSD = (v) => "$ " + Number(v).toLocaleString("en-US", { minimumFractionDigits:2 });
const fmtVal = (v, sessionId) => sessionId === "forex" ? fmtUSD(v) : fmtBRL(v);
const genCode = () => "BRT" + Math.random().toString(36).slice(2,7).toUpperCase();

const computeStatus = (result, level, sessionId) => {
  const lv = getLevel(sessionId || "indice", level);
  if (result < 0) return "loss";
  if (result >= lv.maxGoal) return "green";
  if (result >= lv.minGoal) return "yellow";
  return "red";
};

const computeStreak = (logs, userId, session) => {
  const ul = logs
    .filter(l => l.userId === userId && l.followed && (!session || l.session === session))
    .sort((a,b) => b.date.localeCompare(a.date));
  let streak = 0, prev = null;
  for (const log of ul) {
    if (!prev) { streak = 1; prev = log.date; continue; }
    const diff = (new Date(prev) - new Date(log.date)) / 86400000;
    if (diff === 1) { streak++; prev = log.date; } else break;
  }
  return streak;
};

const computePoints = (logs, userId, session) => {
  return logs
    .filter(l => l.userId === userId && (!session || l.session === session))
    .reduce((sum, l) => {
      let pts = 0;
      if (l.followed) pts += 10;
      if (l.status === "green") pts += 20;
      if (l.status === "yellow") pts += 10;
      return sum + pts;
    }, 0);
};

const checkPromotion = (logs, userId, currentLevel, session) => {
  if (currentLevel >= 5) return false;
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const recent = logs.filter(l =>
    l.userId === userId &&
    (!session || l.session === session) &&
    new Date(l.date) >= twoWeeksAgo
  );
  if (recent.length < 10) return false;
  return recent.every(l => l.followed && (l.status === "green" || l.status === "yellow"));
};

const C = {
  bg:     "#000000",
  card:   "#0D1A0D",
  border: "#003D28",
  green:  "#00F1A5",
  greenL: "#D2FFF1",
  sage:   "#89BAAA",
  white:  "#FFFFFF",
  muted:  "#00593D",
  red:    "#E05C5C",
  darkG:  "#071410",
};

const inp = { width:"100%", background:"#000000", border:"1px solid #003D28", borderRadius:8, color:"#FFFFFF", padding:"10px 12px", fontSize:14, marginBottom:14, marginTop:4, outline:"none", boxSizing:"border-box" };
const lbl = { fontSize:11, color:"#89BAAA", letterSpacing:".1em", textTransform:"uppercase" };
const btnG = { width:"100%", background:"#00F1A5", color:"#000000", border:"none", borderRadius:8, padding:"12px", fontSize:14, fontWeight:700, cursor:"pointer", marginTop:4 };

function Medal({ rank }) {
  const m = ["🥇","🥈","🥉"];
  return rank <= 3
    ? <span style={{fontSize:18}}>{m[rank-1]}</span>
    : <span style={{color:"#00593D",fontWeight:700}}>#{rank}</span>;
}

function LvBadge({ levelId }) {
  const lv = LEVELS[(levelId||1)-1];
  return (
    <span style={{background:lv.color+"22",border:"1px solid "+lv.color,color:lv.color,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>
      {lv.icon} {lv.name}
    </span>
  );
}

function SesBadge({ sessionId }) {
  const s = SESSIONS[sessionId];
  if (!s) return null;
  return (
    <span style={{background:s.color+"22",border:"1px solid "+s.color,color:s.color,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>
      {s.icon} {s.label}
    </span>
  );
}

function StatusPill({ status }) {
  const m = {
    green:  { label:"✓ Meta atingida",  bg:"#001A0F", border:"#00F1A5", color:"#00F1A5" },
    yellow: { label:"⚡ Meta parcial",   bg:"#1C1800", border:"#C9A84C", color:"#C9A84C" },
    red:    { label:"✕ Abaixo da meta", bg:"#1A0808", border:"#E05C5C", color:"#E05C5C" },
    loss:   { label:"💸 Prejuízo",       bg:"#1A0808", border:"#E05C5C", color:"#E05C5C" },
  };
  const s = m[status] || m.red;
  return <span style={{background:s.bg,border:"1px solid "+s.border,color:s.color,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>{s.label}</span>;
}

function DiscPill({ followed }) {
  return (
    <span style={{background:followed?"#001A0F":"#1A0808",border:"1px solid "+(followed?"#00F1A5":"#E05C5C"),color:followed?"#00F1A5":"#E05C5C",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>
      {followed ? "✓ Seguiu o professor" : "✕ Operou por conta"}
    </span>
  );
}

export default function App() {
  const [screen, setScreen]     = useState("login");
  const [curUser, setCurUser]   = useState(null);
  const [adminCtx, setAdminCtx] = useState(null);
  const [users, setUsersS]      = useState({});
  const [logs, setLogsS]        = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [u, l] = await Promise.all([getUsers(), getLogs()]);
        setUsersS(u);
        setLogsS(l);
      } catch(e) {
        console.error("Erro ao carregar dados:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const refresh = async () => {
    try {
      const [u, l] = await Promise.all([getUsers(), getLogs()]);
      setUsersS(u);
      setLogsS(l);
    } catch(e) { console.error("refresh:", e); }
  };

  if (loading) {
    return (
      <div style={{background:"#000000",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{color:"#00F1A5",fontSize:14}}>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={{background:"#000000",minHeight:"100vh",fontFamily:"'Plus Jakarta Sans','Inter',sans-serif",color:"#FFFFFF"}}>
      {toast && (
        <div style={{position:"fixed",top:16,right:16,zIndex:9999,background:toast.type==="success"?"#001A0F":"#1A0808",border:"1px solid "+(toast.type==="success"?"#00F1A5":"#E05C5C"),color:toast.type==="success"?"#00F1A5":"#E05C5C",padding:"12px 20px",borderRadius:8,fontSize:14,fontWeight:600}}>
          {toast.msg}
        </div>
      )}
      {screen === "login"     && <LoginScreen     setScreen={setScreen} setCurUser={setCurUser} setAdminCtx={setAdminCtx} users={users} showToast={showToast} />}
      {screen === "register"  && <RegisterScreen  setScreen={setScreen} users={users} setUsersS={setUsersS} showToast={showToast} />}
      {screen === "dashboard" && <Dashboard       curUser={curUser} users={users} logs={logs} setLogsS={setLogsS} setUsersS={setUsersS} setScreen={setScreen} showToast={showToast} refresh={refresh} />}
      {screen === "admin"     && <AdminPanel      adminCtx={adminCtx} users={users} logs={logs} setUsersS={setUsersS} setLogsS={setLogsS} setScreen={setScreen} showToast={showToast} refresh={refresh} />}
    </div>
  );
}

function LoginScreen({ setScreen, setCurUser, setAdminCtx, users, showToast }) {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");

  const login = () => {
    const admin = ADMINS[email.toLowerCase()];
    if (admin && admin.pass === pass) { setAdminCtx({ ...admin, email }); setScreen("admin"); return; }
    const user = Object.values(users).find(u => u.email === email && u.password === pass);
    if (!user) { showToast("E-mail ou senha incorretos.", "error"); return; }
    setCurUser(user);
    setScreen("dashboard");
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:"#000000"}}>
      <div style={{marginBottom:32,textAlign:"center"}}>
        <div style={{fontSize:26,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>
          Trader<span style={{color:"#00F1A5",fontWeight:300}}>Academy</span>
        </div>
        <div style={{fontSize:11,color:"#89BAAA",letterSpacing:".1em",textTransform:"uppercase"}}>Sistema de Traders · Maringá/PR</div>
      </div>
      <div style={{background:"#0D1A0D",border:"1px solid #003D28",borderRadius:12,padding:32,width:"100%",maxWidth:380}}>
        <h2 style={{margin:"0 0 20px",fontSize:18,fontWeight:700}}>Entrar na plataforma</h2>
        <label style={lbl}>E-mail</label>
        <input value={email} onChange={e => setEmail(e.target.value)} style={inp} placeholder="seu@email.com" type="email" />
        <label style={lbl}>Senha</label>
        <input value={pass} onChange={e => setPass(e.target.value)} style={inp} placeholder="••••••••" type="password" onKeyDown={e => e.key === "Enter" && login()} />
        <button onClick={login} style={btnG}>Entrar</button>
        <div style={{textAlign:"center",marginTop:14}}>
          <span style={{color:"#89BAAA",fontSize:13}}>Sem conta? </span>
          <span onClick={() => setScreen("register")} style={{color:"#00F1A5",fontSize:13,cursor:"pointer",fontWeight:600}}>Cadastre-se</span>
        </div>
      </div>
    </div>
  );
}

function RegisterScreen({ setScreen, users, setUsersS, showToast }) {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(null);

  const register = async () => {
    if (!name.trim() || !email.trim() || !pass || !confirm) { showToast("Preencha todos os campos.", "error"); return; }
    if (pass !== confirm) { showToast("As senhas não conferem.", "error"); return; }
    if (pass.length < 6) { showToast("Senha deve ter ao menos 6 caracteres.", "error"); return; }
    const emailLower = email.toLowerCase().trim();
    // Verificar se email já existe
    const existingUsers = await getUsers();
    if (Object.values(existingUsers).find(u => u.email === emailLower)) { showToast("E-mail já cadastrado.", "error"); return; }
    setLoading(true);
    try {
      const id = Date.now().toString();
      const code = genCode();
      const newUser = { id, name: name.trim(), email: emailLower, password: pass, code, levelIndice:1, levelForex:1, createdAt: today() };
      await saveUser(newUser);
      const updated = { ...existingUsers, [id]: newUser };
      setUsersS(updated);
      setDone({ name: name.trim(), code });
    } catch(e) {
      showToast("Erro ao salvar. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"#000000"}}>
        <div style={{background:"#0D1A0D",border:"1px solid #00F1A5",borderRadius:16,padding:36,width:"100%",maxWidth:380,textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:16}}>🎉</div>
          <div style={{fontSize:20,fontWeight:800,color:"#00F1A5",marginBottom:8}}>Cadastro realizado!</div>
          <div style={{fontSize:14,color:"#89BAAA",marginBottom:24}}>Bem-vindo, <strong style={{color:"#FFFFFF"}}>{done.name}</strong>!</div>
          <div style={{background:"#000000",border:"1px solid #003D28",borderRadius:10,padding:"14px 20px",marginBottom:20}}>
            <div style={{fontSize:11,color:"#89BAAA",marginBottom:6,letterSpacing:".1em",textTransform:"uppercase"}}>Seu código de aluno</div>
            <div style={{fontSize:24,fontWeight:800,color:"#00F1A5",fontFamily:"monospace",letterSpacing:4}}>{done.code}</div>
            <div style={{fontSize:11,color:"#00593D",marginTop:6}}>Guarde este código</div>
          </div>
          <button onClick={() => setScreen("login")} style={btnG}>Entrar na plataforma →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:"#000000"}}>
      <div style={{marginBottom:28,textAlign:"center"}}>
        <div style={{fontSize:24,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>
          Trader<span style={{color:"#00F1A5",fontWeight:300}}>Academy</span>
        </div>
        <div style={{fontSize:11,color:"#89BAAA"}}>Novo Aluno</div>
      </div>
      <div style={{background:"#0D1A0D",border:"1px solid #003D28",borderRadius:12,padding:32,width:"100%",maxWidth:380}}>
        <h2 style={{margin:"0 0 20px",fontSize:18,fontWeight:700}}>Criar sua conta</h2>
        <label style={lbl}>Nome completo</label>
        <input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="Seu nome completo" />
        <label style={lbl}>E-mail</label>
        <input value={email} onChange={e => setEmail(e.target.value)} style={inp} placeholder="seu@email.com" type="email" />
        <label style={lbl}>Senha (mín. 6 caracteres)</label>
        <input value={pass} onChange={e => setPass(e.target.value)} style={inp} placeholder="Crie uma senha" type="password" />
        <label style={lbl}>Confirmar senha</label>
        <input value={confirm} onChange={e => setConfirm(e.target.value)} style={inp} placeholder="Repita a senha" type="password" onKeyDown={e => e.key === "Enter" && !loading && register()} />
        <button onClick={register} disabled={loading} style={{...btnG, opacity: loading ? 0.7 : 1}}>
          {loading ? "⏳ Cadastrando..." : "Criar conta"}
        </button>
        <div style={{textAlign:"center",marginTop:14}}>
          <span onClick={() => setScreen("login")} style={{color:"#00F1A5",fontSize:13,cursor:"pointer",fontWeight:600}}>← Voltar ao login</span>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ curUser, users, logs, setLogsS, setUsersS, setScreen, showToast, refresh }) {
  const user = users[curUser.id] || curUser;
  const [tab, setTab]         = useState("register");
  const [session, setSession] = useState("indice");
  const [result, setResult]   = useState("");
  const [followed, setFollowed] = useState(true);

  const ses        = SESSIONS[session];
  const levelKey   = session === "indice" ? "levelIndice" : "levelForex";
  const curLevel   = user[levelKey] || 1;
  const lv         = getLevel(session, curLevel);
  const todayLog   = logs.find(l => l.userId === user.id && l.date === today() && l.session === session);
  const ptsI       = computePoints(logs, user.id, "indice");
  const ptsF       = computePoints(logs, user.id, "forex");
  const strkI      = computeStreak(logs, user.id, "indice");
  const strkF      = computeStreak(logs, user.id, "forex");
  const eligible   = checkPromotion(logs, user.id, curLevel, session);
  const myLogs     = logs.filter(l => l.userId === user.id).sort((a,b) => b.date.localeCompare(a.date));
  const allUsers   = Object.values(users);
  const rankSes    = (sid) => allUsers.map(u => ({ ...u, pts: computePoints(logs, u.id, sid), strk: computeStreak(logs, u.id, sid) })).sort((a,b) => b.pts - a.pts);

  const submitLog = async () => {
    if (todayLog) { showToast("Resultado já registrado para esta sessão.", "error"); return; }
    const val = parseFloat(result.replace(",", "."));
    if (isNaN(val)) { showToast("Digite um valor válido.", "error"); return; }
    const status = computeStatus(val, curLevel, session);
    const newLog = { id: Date.now().toString(), userId: user.id, date: today(), result: val, followed, status, level: curLevel, session };
    await saveLog(newLog);
    const updated = [...logs, newLog];
    setLogsS(updated);
    setResult("");
    showToast(status === "green" ? "✓ Meta atingida! +20 pontos" : "Resultado registrado!");
    refresh();
  };

  const promote = async () => {
    if (!eligible || curLevel >= 5) return;
    const newLevel = curLevel + 1;
    await updateUserLevel(user.id, levelKey, newLevel);
    const updatedUser = { ...user, [levelKey]: newLevel };
    const updatedUsers = { ...users, [user.id]: updatedUser };
    setUsersS(updatedUsers);
    showToast("🎉 Promovido para " + LEVELS[newLevel-1].name + " no " + ses.label + "!");
    refresh();
  };

  const hdr = { background:"#0D1A0D", borderBottom:"1px solid #003D28", padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" };

  return (
    <div style={{maxWidth:480,margin:"0 auto",paddingBottom:40}}>
      <div style={hdr}>
        <div>
          <div style={{fontSize:11,color:"#89BAAA",letterSpacing:".1em",textTransform:"uppercase"}}>BR Trader Academy</div>
          <div style={{fontSize:15,fontWeight:700}}>{user.name}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{background:"#000000",border:"1px solid #003D28",borderRadius:6,padding:"4px 8px",fontSize:11,color:"#89BAAA",fontFamily:"monospace"}}>{user.code}</span>
          <button onClick={() => setScreen("login")} style={{background:"none",border:"1px solid #003D28",color:"#89BAAA",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12}}>Sair</button>
        </div>
      </div>

      {/* Session selector */}
      <div style={{margin:"14px 16px 0",background:"#071410",borderRadius:10,padding:4,display:"flex",gap:4}}>
        {Object.values(SESSIONS).map(s => (
          <button key={s.id} onClick={() => setSession(s.id)} style={{flex:1,background:session===s.id?s.color:"none",color:session===s.id?"#000000":s.color,border:"none",borderRadius:8,padding:"10px 6px",fontWeight:700,cursor:"pointer",fontSize:13}}>
            {s.icon} {s.label}<br/><span style={{fontSize:10,fontWeight:400,opacity:.85}}>{s.time} · {s.professor}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,padding:"12px 16px 0"}}>
        {[
          { label: "Nível " + ses.label,    value: lv.icon + " " + lv.name,    color: lv.color },
          { label: "Pontos " + ses.label,   value: session==="indice" ? ptsI : ptsF, color: ses.color },
          { label: "🔥 Seq. Índice",        value: strkI + " dias",            color: strkI>=5?"#00F1A5":"#89BAAA" },
          { label: "🔥 Seq. Forex",         value: strkF + " dias",            color: strkF>=5?"#00F1A5":"#89BAAA" },
        ].map((s,i) => (
          <div key={i} style={{background:"#071410",border:"1px solid #003D28",borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
            <div style={{fontSize:11,color:"#00593D",marginBottom:3}}>{s.label}</div>
            <div style={{fontSize:14,fontWeight:700,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Level info */}
      <div style={{margin:"10px 16px 0",background:"#071410",border:"1px solid "+ses.color+"33",borderLeft:"3px solid "+ses.color,borderRadius:10,padding:"12px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:11,color:"#89BAAA",marginBottom:4}}>{ses.icon} {ses.label} com {ses.professor}</div>
            <LvBadge levelId={curLevel} />
            <div style={{fontSize:11,color:"#00593D",marginTop:4}}>
              {session==="forex" ? lv.size+" tic (lote)" : lv.size+(lv.size>1?" contratos":" contrato")} · Mín. {fmtVal(lv.minBank, session)} · Meta {fmtVal(lv.minGoal, session)}–{fmtVal(lv.maxGoal, session)}/dia
            </div>
            <div style={{marginTop:8,background:"#000000",border:"1px solid #00F1A533",borderRadius:6,padding:"10px 12px"}}>
              <div style={{fontSize:10,color:"#00593D",marginBottom:4,letterSpacing:".06em",textTransform:"uppercase"}}>💰 Projeção salarial neste nível</div>
              <div style={{fontSize:15,fontWeight:800,color:"#00F1A5"}}>{lv.salLabel}</div>
              <div style={{fontSize:10,color:"#00593D",marginTop:2}}>seguindo a metodologia · 22 dias úteis/mês</div>
              <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #003D28",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:10,color:"#00593D",marginBottom:2,textTransform:"uppercase",letterSpacing:".06em"}}>⏱ Tempo estimado para subir</div>
                  <div style={{fontSize:13,fontWeight:700,color:"#D2FFF1"}}>{lv.dias}</div>
                  <div style={{fontSize:10,color:"#00593D",marginTop:2}}>{lv.diasDesc}</div>
                </div>
              </div>
            </div>
          </div>
          {eligible && curLevel < 5 && (
            <button onClick={promote} style={{background:"#00F1A5",color:"#000000",border:"none",borderRadius:6,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>⬆ Subir</button>
          )}
        </div>
        {eligible && curLevel < 5 && (
          <div style={{marginTop:8,background:"#001A0F",border:"1px solid #00F1A5",borderRadius:6,padding:"6px 10px",fontSize:11,color:"#00F1A5",fontWeight:600}}>
            🎉 Você está elegível para subir de nível!
          </div>
        )}
      </div>

      {/* Jornada completa */}
      {tab === "register" || true ? null : null}
      <div style={{margin:"10px 16px 0",background:"#071410",border:"1px solid #003D28",borderRadius:10,padding:"14px 14px"}}>
        <div style={{fontSize:11,color:"#00593D",marginBottom:10,letterSpacing:".06em",textTransform:"uppercase"}}>🗺 Sua jornada — {ses.label}</div>
        <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:4}}>
          {getLevels(session).map((l, i) => {
            const cur = curLevel;
            const done = l.id < cur;
            const active = l.id === cur;
            return (
              <div key={l.id} style={{flex:"0 0 auto",background:active?"#001A0F":done?"#001A0F":"#000000",border:"1px solid "+(active?l.color:done?l.color+"55":"#003D28"),borderRadius:8,padding:"8px 10px",minWidth:90,textAlign:"center",opacity:done?0.7:1}}>
                <div style={{fontSize:16}}>{l.icon}</div>
                <div style={{fontSize:10,fontWeight:700,color:active?l.color:done?l.color:"#00593D",marginTop:2}}>{l.name}</div>
                <div style={{fontSize:9,color:"#00593D",marginTop:2}}>{l.salLabel}</div>
                <div style={{fontSize:8,color:"#003D28",marginTop:2}}>⏱ {l.dias}</div>
                {done && <div style={{fontSize:9,color:"#00F1A5",marginTop:3}}>✓ concluído</div>}
                {active && <div style={{fontSize:9,color:l.color,marginTop:3,fontWeight:700}}>← você está aqui</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",margin:"10px 16px 0",background:"#071410",borderRadius:8,padding:4}}>
        {[["register","📝 Registrar"],["history","📊 Histórico"],["ranking","🏆 Ranking"]].map(([k,label]) => (
          <button key={k} onClick={() => setTab(k)} style={{flex:1,background:tab===k?"#0D1A0D":"none",border:"none",color:tab===k?"#00F1A5":"#00593D",padding:"8px 4px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer"}}>
            {label}
          </button>
        ))}
      </div>

      {/* Register tab */}
      {tab === "register" && (
        <div style={{margin:"12px 16px 0",background:"#0D1A0D",border:"1px solid #003D28",borderRadius:12,padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{margin:0,fontSize:15,fontWeight:700}}>Resultado de hoje</h3>
            <SesBadge sessionId={session} />
          </div>
          {todayLog ? (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:28,marginBottom:8}}>✅</div>
              <div style={{color:"#00F1A5",fontWeight:600}}>Resultado já registrado</div>
              <div style={{color:"#89BAAA",fontSize:13,marginTop:4}}>{fmtBRL(todayLog.result)}</div>
              <div style={{marginTop:8,display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
                <StatusPill status={todayLog.status} />
                <DiscPill followed={todayLog.followed} />
              </div>
            </div>
          ) : (
            <>
              <label style={lbl}>Resultado do dia (R$)</label>
              <input value={result} onChange={e => setResult(e.target.value)} style={inp} placeholder={"Meta: " + (session==="forex"?"$":"R$") + lv.minGoal + " a " + lv.maxGoal} type="number" />
              <label style={lbl}>Seguiu os sinais de {ses.professor}?</label>
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                {[true, false].map(f => (
                  <button key={String(f)} onClick={() => setFollowed(f)} style={{flex:1,padding:"10px",borderRadius:8,border:"1px solid "+(followed===f?(f?"#00F1A5":"#E05C5C"):"#003D28"),background:followed===f?(f?"#001A0F":"#1A0808"):"#000000",color:followed===f?(f?"#00F1A5":"#E05C5C"):"#00593D",fontWeight:600,cursor:"pointer",fontSize:13}}>
                    {f ? "✓ Sim, segui" : "✕ Por conta"}
                  </button>
                ))}
              </div>
              <div style={{background:"#000000",borderRadius:8,padding:"10px 12px",marginBottom:14,fontSize:12,color:"#89BAAA"}}>
                Meta: <strong style={{color:"#C9A84C"}}>{fmtVal(lv.minGoal, session)}</strong> até <strong style={{color:"#00F1A5"}}>{fmtVal(lv.maxGoal, session)}</strong> · {session==="forex" ? lv.size+" tic (lote)" : lv.size+" contrato"+(lv.size>1?"s":"")}
              </div>
              <button onClick={submitLog} style={{...btnG, background: ses.color}}>Registrar {ses.icon} {ses.label}</button>
            </>
          )}
        </div>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div style={{margin:"12px 16px 0"}}>
          {myLogs.length === 0 ? (
            <div style={{textAlign:"center",padding:40,color:"#00593D"}}>Nenhum registro ainda.</div>
          ) : myLogs.map(log => (
            <div key={log.id} style={{background:"#0D1A0D",border:"1px solid #003D28",borderRadius:10,padding:"12px 14px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <div style={{fontSize:13,color:"#89BAAA"}}>{log.date}</div>
                <div style={{fontSize:16,fontWeight:800,color:log.result>=0?"#00F1A5":"#E05C5C"}}>{log.result>=0?"+":""}{fmtVal(log.result, log.session)}</div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <SesBadge sessionId={log.session} />
                <StatusPill status={log.status} />
                <DiscPill followed={log.followed} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ranking tab */}
      {tab === "ranking" && (
        <div style={{margin:"12px 16px 0"}}>
          <div style={{display:"flex",gap:6,marginBottom:10}}>
            {Object.values(SESSIONS).map(s => (
              <button key={s.id} onClick={() => setSession(s.id)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid "+(session===s.id?s.color:"#003D28"),background:session===s.id?s.color+"22":"none",color:session===s.id?s.color:"#00593D",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
          <div style={{fontSize:11,color:"#00593D",marginBottom:8,textAlign:"center"}}>Prof. {SESSIONS[session].professor}</div>
          {rankSes(session).map((u,i) => (
            <div key={u.id} style={{background:u.id===user.id?"#001A0F":"#0D1A0D",border:"1px solid "+(u.id===user.id?"#00F1A5":"#003D28"),borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,textAlign:"center"}}><Medal rank={i+1} /></div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600}}>{u.name} {u.id===user.id && <span style={{fontSize:10,color:"#00F1A5"}}>você</span>}</div>
                <LvBadge levelId={u[session==="indice"?"levelIndice":"levelForex"]||1} />
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:16,fontWeight:800,color:SESSIONS[session].color}}>{u.pts}</div>
                <div style={{fontSize:10,color:"#00593D"}}>pontos</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminPanel({ adminCtx, users, logs, setUsersS, setLogsS, setScreen, showToast, refresh }) {
  const isDiretor = adminCtx?.role === "diretor";
  const [viewSes, setViewSes]   = useState(isDiretor ? "indice" : (adminCtx?.session || "indice"));
  const [tab, setTab]           = useState("today");

  const ses      = SESSIONS[viewSes];
  const levelKey = viewSes === "indice" ? "levelIndice" : "levelForex";
  const allUsers = Object.values(users);
  const todayLogs     = logs.filter(l => l.date === today() && l.session === viewSes);
  const usersWithLog  = todayLogs.map(l => ({ ...l, user: users[l.userId] })).filter(l => l.user);
  const usersWithout  = allUsers.filter(u => !todayLogs.find(l => l.userId === u.id));
  const eligibles     = allUsers.filter(u => checkPromotion(logs, u.id, u[levelKey]||1, viewSes) && (u[levelKey]||1) < 5);
  const ranking       = allUsers.map(u => ({
    ...u,
    pts:  computePoints(logs, u.id, viewSes),
    strk: computeStreak(logs, u.id, viewSes),
    disc: (() => { const ul = logs.filter(l => l.userId===u.id && l.session===viewSes); return ul.length > 0 ? Math.round(ul.filter(l => l.followed).length / ul.length * 100) : 0; })(),
    regs: logs.filter(l => l.userId===u.id && l.session===viewSes).length,
  })).sort((a,b) => b.pts - a.pts);

  const promoteUser = async (u, up = true) => {
    const cur = u[levelKey] || 1;
    if (up && cur >= 5) { showToast("Já está no nível máximo.", "error"); return; }
    if (!up && cur <= 1) { showToast("Já está no nível mínimo.", "error"); return; }
    const newLevel = up ? cur + 1 : cur - 1;
    await updateUserLevel(u.id, levelKey, newLevel);
    const updatedUser = { ...u, [levelKey]: newLevel };
    const updatedUsers = { ...users, [u.id]: updatedUser };
    setUsersS(updatedUsers);
    showToast(u.name + (up ? " promovido para " : " voltou para ") + LEVELS[newLevel-1].name);
    refresh();
  };

  return (
    <div style={{maxWidth:600,margin:"0 auto",paddingBottom:40}}>
      <div style={{background:"#0D1A0D",borderBottom:"2px solid #00F1A5",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:11,color:"#00F1A5",letterSpacing:".1em",textTransform:"uppercase",fontWeight:700}}>{isDiretor?"Painel Diretor":"Painel Professor"}</div>
          <div style={{fontSize:15,fontWeight:700}}>{adminCtx?.name}</div>
        </div>
        <button onClick={() => setScreen("login")} style={{background:"none",border:"1px solid #003D28",color:"#89BAAA",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:12}}>Sair</button>
      </div>

      {/* Session selector */}
      <div style={{margin:"14px 16px 0",background:"#071410",borderRadius:10,padding:4,display:"flex",gap:4}}>
        {Object.values(SESSIONS).map(s => {
          const disabled = !isDiretor && adminCtx?.session !== "all" && s.id !== adminCtx?.session;
          const perf = { total: logs.filter(l => l.date===today()&&l.session===s.id).length };
          return (
            <button key={s.id} onClick={() => !disabled && setViewSes(s.id)} style={{flex:1,background:viewSes===s.id?s.color:"none",color:viewSes===s.id?"#000000":disabled?"#003D28":s.color,border:"none",borderRadius:8,padding:"10px 6px",fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontSize:12,opacity:disabled?0.4:1}}>
              {s.icon} {s.label}<br/>
              <span style={{fontSize:10,fontWeight:400,opacity:.85}}>{s.professor}</span><br/>
              <span style={{fontSize:10,fontWeight:600}}>{perf.total} reg. hoje</span>
            </button>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,padding:"10px 16px 0"}}>
        {[
          {label:"Alunos",     value:allUsers.length,               color:"#89BAAA"},
          {label:"Hoje",       value:usersWithLog.length+"/"+allUsers.length, color:"#00F1A5"},
          {label:"Seguiram",   value:todayLogs.filter(l=>l.followed).length,  color:"#00F1A5"},
          {label:"Elegíveis ↑",value:eligibles.length,              color:"#D2FFF1"},
        ].map((s,i) => (
          <div key={i} style={{background:"#071410",border:"1px solid #003D28",borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
            <div style={{fontSize:9,color:"#00593D",marginBottom:2}}>{s.label}</div>
            <div style={{fontSize:18,fontWeight:800,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",margin:"12px 16px 0",background:"#071410",borderRadius:8,padding:4}}>
        {[["today","📅 Hoje"],["students","👥 Alunos"],["ranking","🏆 Ranking"],["promote","⬆ Promoções"]].map(([k,label]) => (
          <button key={k} onClick={() => setTab(k)} style={{flex:1,background:tab===k?"#0D1A0D":"none",border:"none",color:tab===k?"#00F1A5":"#00593D",padding:"8px 2px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer"}}>
            {label}
          </button>
        ))}
      </div>

      {/* Today */}
      {tab === "today" && (
        <div style={{margin:"12px 16px 0"}}>
          <div style={{fontSize:12,color:"#00593D",marginBottom:8}}>{ses.icon} {ses.label} · {ses.professor} · {today()}</div>
          {usersWithLog.map(l => (
            <div key={l.id} style={{background:"#0D1A0D",border:"1px solid #003D28",borderRadius:10,padding:"12px 14px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600}}>{l.user.name}</div>
                  <div style={{fontSize:11,color:"#00593D",fontFamily:"monospace"}}>{l.user.code}</div>
                </div>
                <div style={{fontSize:18,fontWeight:800,color:l.result>=0?"#00F1A5":"#E05C5C"}}>{l.result>=0?"+":""}{fmtVal(l.result, l.session)}</div>
              </div>
              <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                <StatusPill status={l.status} />
                <DiscPill followed={l.followed} />
                <LvBadge levelId={l.level} />
              </div>
            </div>
          ))}
          {usersWithout.length > 0 && (
            <>
              <div style={{fontSize:12,color:"#E05C5C",margin:"12px 0 6px",fontWeight:600}}>⚠ Ainda não registraram</div>
              {usersWithout.map(u => (
                <div key={u.id} style={{background:"#1A0808",border:"1px solid #E05C5C22",borderRadius:8,padding:"10px 12px",marginBottom:6,fontSize:13,color:"#89BAAA"}}>
                  {u.name} <span style={{fontSize:11,fontFamily:"monospace",color:"#00593D"}}>· {u.code}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Students */}
      {tab === "students" && (
        <div style={{margin:"12px 16px 0"}}>
          {allUsers.map(u => (
            <div key={u.id} style={{background:"#0D1A0D",border:"1px solid #003D28",borderRadius:10,padding:"14px 14px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600}}>{u.name}</div>
                  <div style={{fontSize:11,color:"#00593D",fontFamily:"monospace"}}>{u.code} · desde {u.createdAt}</div>
                </div>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={() => promoteUser(u,false)} style={{background:"#1A0808",border:"1px solid #E05C5C33",color:"#E05C5C",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:12,fontWeight:700}}>↓</button>
                  <button onClick={() => promoteUser(u,true)}  style={{background:"#001A0F",border:"1px solid #00F1A533",color:"#00F1A5",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:12,fontWeight:700}}>↑</button>
                </div>
              </div>
              <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                <SesBadge sessionId={viewSes} />
                <LvBadge levelId={u[levelKey]||1} />
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                {[
                  {label:"Pontos",     value:computePoints(logs,u.id,viewSes),        color:"#00F1A5"},
                  {label:"Sequência",  value:"🔥 "+computeStreak(logs,u.id,viewSes)+"d", color:"#00F1A5"},
                  {label:"Disciplina", value:(()=>{const ul=logs.filter(l=>l.userId===u.id&&l.session===viewSes);return ul.length>0?Math.round(ul.filter(l=>l.followed).length/ul.length*100)+"%":"0%";})(), color:"#89BAAA"},
                  {label:"Registros",  value:logs.filter(l=>l.userId===u.id&&l.session===viewSes).length, color:"#89BAAA"},
                ].map((s,i) => (
                  <div key={i} style={{background:"#000000",borderRadius:6,padding:"8px 4px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:"#00593D"}}>{s.label}</div>
                    <div style={{fontSize:13,fontWeight:700,color:s.color}}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ranking */}
      {tab === "ranking" && (
        <div style={{margin:"12px 16px 0"}}>
          <div style={{fontSize:11,color:"#00593D",textAlign:"center",marginBottom:10}}>{ses.icon} {ses.label} · {ses.professor}</div>
          {ranking.map((u,i) => (
            <div key={u.id} style={{background:"#0D1A0D",border:"1px solid #003D28",borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,textAlign:"center"}}><Medal rank={i+1} /></div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600}}>{u.name}</div>
                <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                  <LvBadge levelId={u[levelKey]||1} />
                  <span style={{fontSize:11,color:"#00593D"}}>Disc.: {u.disc}%</span>
                  <span style={{fontSize:11,color:"#00593D"}}>🔥 {u.strk}d</span>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:18,fontWeight:800,color:ses.color}}>{u.pts}</div>
                <div style={{fontSize:10,color:"#00593D"}}>pontos</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Promote */}
      {tab === "promote" && (
        <div style={{margin:"12px 16px 0"}}>
          {eligibles.length === 0 ? (
            <div style={{textAlign:"center",padding:40,color:"#00593D"}}>Nenhum aluno elegível no {ses.label} agora.</div>
          ) : (
            <>
              <div style={{background:"#001A0F",border:"1px solid #00F1A533",borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:13,color:"#00F1A5"}}>
                {eligibles.length} aluno{eligibles.length>1?"s":""} elegível{eligibles.length>1?"is":""} — 2 semanas seguindo o método.
              </div>
              {eligibles.map(u => (
                <div key={u.id} style={{background:"#0D1A0D",border:"1px solid #00F1A533",borderRadius:10,padding:"14px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:600}}>{u.name}</div>
                    <div style={{display:"flex",gap:6,marginTop:6,alignItems:"center"}}>
                      <LvBadge levelId={u[levelKey]||1} />
                      <span style={{fontSize:11,color:"#89BAAA"}}>→</span>
                      <LvBadge levelId={(u[levelKey]||1)+1} />
                    </div>
                  </div>
                  <button onClick={() => promoteUser(u,true)} style={{background:"#00F1A5",color:"#000000",border:"none",borderRadius:8,padding:"8px 14px",fontWeight:700,cursor:"pointer",fontSize:13}}>Promover ⬆</button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
