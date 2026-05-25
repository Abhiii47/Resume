function ResourceHub() {
  const [activeCategory, setActiveCategory] = useState("dsa");
  const [showHolisticTracker, setShowHolisticTracker] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!targetRole.trim() || !targetCompany.trim()) return;
    setError(null); setIsGenerating(true);
    try {
      const fd = new FormData();
      fd.append("target_role", targetRole.trim());
      fd.append("target_company", targetCompany.trim());
      const res = await axios.post(`${API_BASE}/roadmap/ai-generate`, fd, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      setRoadmap(res.data.roadmap);
      setShowForm(false); setShowRoadmap(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate. Upload a resume first.");
    } finally { setIsGenerating(false); }
  };

  const cat = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="p-6 animate-fade-in relative flex flex-col" style={{ minHeight: "100%" }}>
      <div className="flex justify-between items-start mb-6 flex-shrink-0">
        <h2 className="text-3xl font-black uppercase">Learning Hub</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowHolisticTracker(true)} className="px-4 py-2 text-xs font-mono uppercase border-2 border-border hover:border-primary transition-colors inline-flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" /> Holistic Tracker
          </button>
          <button onClick={() => { setShowForm(true); setShowRoadmap(false); }} className="brutalist-button px-4 py-2 text-xs inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> AI Roadmap
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 flex-shrink-0">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className="px-3 py-1.5 text-xs font-mono uppercase border-2 shrink-0 transition-all"
            style={activeCategory === c.id
              ? { background: c.color, color: "#fff", borderColor: c.color }
              : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Resource cards */}
      {cat && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
          {cat.resources.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
              className="brutalist-card bg-card p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform cursor-pointer group">
              <div className="flex justify-between items-start">
                <h4 className="font-black text-base">{r.name}</h4>
                <span className={`text-xs font-mono px-2 py-0.5 shrink-0 ml-2 ${cat.badge}`}>{r.tag}</span>
              </div>
              <p className="text-sm text-muted-foreground flex-1">{r.desc}</p>
              <p className="text-xs font-mono font-bold group-hover:underline" style={{ color: cat.color }}>Open ↗</p>
            </a>
          ))}

          {/* Special NeetCode tracker card for DSA category */}
          {activeCategory === "dsa" && (
            <div onClick={() => setShowHolisticTracker(true)}
              className="brutalist-card bg-card p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform cursor-pointer group border-2 border-primary">
              <div className="flex justify-between items-start">
                <h4 className="font-black text-base">Holistic Daily Tracker</h4>
                <span className="text-xs font-mono px-2 py-0.5 bg-primary text-primary-foreground">Built-in</span>
              </div>
              <p className="text-sm text-muted-foreground flex-1">Track your daily progress across 6 categories: DSA, System Design, Projects, CS Core, Behavioral, and Apps.</p>
              <p className="text-xs font-mono font-bold text-primary group-hover:underline">Open Tracker →</p>
            </div>
          )}

          {/* AI Roadmap card always visible */}
          <div onClick={() => { setShowForm(true); setShowRoadmap(false); }}
            className="brutalist-card bg-card p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform cursor-pointer group border-2 border-dashed border-primary/50">
            <div className="flex justify-between items-start">
              <h4 className="font-black text-base text-primary">Your AI Roadmap</h4>
              <span className="text-xs font-mono px-2 py-0.5 bg-primary/10 text-primary border border-primary">AI</span>
            </div>
            <p className="text-sm text-muted-foreground flex-1">
              {roadmap ? `Plan for ${roadmap.role} @ ${roadmap.company} ready.` : "Personalized 8-week plan based on your resume + target role."}
            </p>
            <p className="text-xs font-mono font-bold text-primary group-hover:underline">
              {roadmap ? "View / Regenerate →" : "Generate My Plan →"}
            </p>
          </div>
        </div>
      )}

      {/* Holistic Tracker Overlay */}
      {showHolisticTracker && (
        <div className="absolute inset-0 bg-background/96 backdrop-blur-sm z-10 p-6 animate-fade-in overflow-y-auto">
          <div className="max-w-4xl mx-auto flex justify-end mb-4">
            <button onClick={() => setShowHolisticTracker(false)} className="text-muted-foreground hover:text-foreground font-mono text-sm border-2 border-border px-4 py-2">[ ✕ Close Tracker ]</button>
          </div>
          <HolisticTracker roadmap={roadmap} />
        </div>
      )}

      {/* AI Roadmap Form */}
      {showForm && (
        <div className="absolute inset-0 bg-background/96 backdrop-blur-sm z-10 flex items-center justify-center animate-fade-in p-6">
          <div className="brutalist-card bg-card border-2 border-primary p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black uppercase text-primary">Generate My Plan</h3>
              <button onClick={() => setShowForm(false)} className="font-mono text-sm text-muted-foreground">[ ✕ ]</button>
            </div>
            <p className="text-sm text-muted-foreground mb-6 font-mono">AI analyzes your resume and builds a targeted 8-week roadmap. Upload a resume first.</p>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold uppercase block mb-2">Target Role</label>
                <input required value={targetRole} onChange={e => setTargetRole(e.target.value)} className="brutalist-input w-full py-3 px-4 text-sm" placeholder="e.g. Software Development Engineer" />
              </div>
              <div>
                <label className="text-xs font-mono font-bold uppercase block mb-2">Target Company</label>
                <input required value={targetCompany} onChange={e => setTargetCompany(e.target.value)} className="brutalist-input w-full py-3 px-4 text-sm" placeholder="e.g. Google, Amazon, Microsoft" />
              </div>
              {error && <div className="p-3 bg-destructive/10 border-2 border-destructive text-destructive text-sm font-mono">{error}</div>}
              <button type="submit" disabled={isGenerating} className="brutalist-button w-full py-3 disabled:opacity-50">
                {isGenerating ? "[ GENERATING... ]" : "[ GENERATE MY 8-WEEK PLAN ]"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Generated Roadmap */}
      {showRoadmap && roadmap && (
        <div className="absolute inset-0 bg-background/96 backdrop-blur-sm z-10 p-6 flex flex-col animate-fade-in overflow-y-auto">
          <div className="flex justify-between items-start mb-6 border-b-2 border-border pb-4">
            <div>
              <h3 className="text-2xl font-black uppercase text-primary">
                {roadmap.role} @ {roadmap.company}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 font-mono max-w-2xl">{roadmap.summary}</p>
            </div>
            <div className="flex gap-2 shrink-0 ml-4">
              <button onClick={() => { setShowForm(true); setShowRoadmap(false); }} className="brutalist-button px-4 py-2 text-xs">Regenerate</button>
              <button onClick={() => setShowRoadmap(false)} className="px-4 py-2 text-xs font-mono uppercase border-2 border-border text-muted-foreground hover:border-foreground transition-colors">[ Close ]</button>
            </div>
          </div>
          {roadmap.skill_gaps?.length > 0 && (
            <div className="max-w-4xl mx-auto w-full mb-8 p-4 bg-destructive/10 border-2 border-destructive">
              <p className="text-xs font-mono font-bold uppercase text-destructive mb-2">Skill Gaps</p>
              <div className="flex flex-wrap gap-2">
                {roadmap.skill_gaps.map((g, i) => <span key={i} className="text-xs font-mono bg-destructive/20 text-destructive px-2 py-1 border border-destructive">{g}</span>)}
              </div>
            </div>
          )}
          <div className="space-y-0 max-w-4xl mx-auto w-full">
            {roadmap.phases?.map((phase, i) => {
              const isLast = i === roadmap.phases.length - 1;
              return (
                <div key={i} className="flex gap-6 group">
                  <div className="w-24 shrink-0 text-right font-mono font-bold text-primary uppercase pt-4 text-sm">{phase.week_label}</div>
                  <div className="w-6 flex flex-col items-center">
                    <div className="w-6 h-6 bg-primary border-2 border-primary rounded-full group-hover:scale-125 transition-transform z-10 mt-4 shrink-0" />
                    {!isLast && <div className="w-0.5 bg-border flex-1 -mt-1" />}
                  </div>
                  <div className="brutalist-card bg-card p-6 flex-1 mb-8 hover:-translate-y-1 transition-transform">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-xl uppercase">{phase.title}</h4>
                      <span className="text-xs font-mono px-2 py-1 bg-primary text-primary-foreground ml-2 shrink-0">{phase.resource_type}</span>
                    </div>
                    <p className="text-xs font-mono text-primary uppercase tracking-wide mb-3">Focus: {phase.focus}</p>
                    <p className="text-muted-foreground mb-4 text-sm">{phase.description}</p>
                    {phase.resource_url && (
                      <a href={phase.resource_url} target="_blank" rel="noopener noreferrer"
                        className="inline-block border-2 border-primary text-primary px-3 py-1 text-xs font-mono font-bold uppercase hover:bg-primary hover:text-primary-foreground transition-colors">
                        {phase.resource_label} ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}