import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE, getAuthToken } from '../utils';

const DEFAULT_RESUME_DATA = {
  personal: { name: '', email: '', phone: '', linkedin: '', github: '' },
  summary: '',
  experience: [],
  education: [],
  projects: [],
  skills: { languages: '', frameworks: '', tools: '' }
};

const normalizeResumeData = (raw = {}) => ({
  personal: { ...DEFAULT_RESUME_DATA.personal, ...(raw.personal || {}) },
  summary: raw.summary || '',
  experience: Array.isArray(raw.experience) ? raw.experience : [],
  education: Array.isArray(raw.education) ? raw.education : [],
  projects: Array.isArray(raw.projects) ? raw.projects : [],
  skills: { ...DEFAULT_RESUME_DATA.skills, ...(raw.skills || {}) }
});

const ACTION_VERBS = [
  'built', 'led', 'designed', 'implemented', 'optimized', 'improved', 'developed',
  'launched', 'delivered', 'reduced', 'increased', 'automated', 'managed', 'architected',
  'created', 'deployed', 'streamlined', 'resolved', 'accelerated', 'scaled'
];

export default function ResumeBuilder() {
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | dirty | saving | saved | error
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [fontFamily, setFontFamily] = useState('Georgia, serif');
  const [layoutMode, setLayoutMode] = useState('classic');
  const [rewritingKey, setRewritingKey] = useState('');
  const [sectionScoreHistory, setSectionScoreHistory] = useState([]);
  const [analysisJd, setAnalysisJd] = useState('');
  const [analyzingBuilder, setAnalyzingBuilder] = useState(false);
  const [builderAnalysis, setBuilderAnalysis] = useState(null);

  const FONTS = [
    { label: 'Classic Serif',   value: 'Georgia, serif' },
    { label: 'Modern Sans',     value: 'Inter, Arial, sans-serif' },
    { label: 'Professional',    value: '"Times New Roman", serif' },
    { label: 'Tech Mono',       value: '"Courier New", monospace' },
    { label: 'Elegant',         value: 'Garamond, serif' },
  ];

  const LAYOUTS = [
    { label: 'Classic', value: 'classic' },
    { label: 'Compact', value: 'compact' }
  ];

  const [resumeData, setResumeData] = useState(DEFAULT_RESUME_DATA);

  useEffect(() => {
    loadResume();
    try {
      const savedHistory = JSON.parse(localStorage.getItem('resume_section_score_history') || '[]');
      if (Array.isArray(savedHistory)) {
        setSectionScoreHistory(savedHistory.slice(0, 12));
      }
    } catch (err) {
      console.error('Failed to load section score history', err);
    }
  }, []);

  useEffect(() => {
    if (saveStatus !== 'dirty') return;
    const timer = setTimeout(() => {
      saveResume(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [resumeData, saveStatus]);

  const loadResume = async () => {
    try {
      const res = await axios.get(`${API_BASE}/resume/load`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (res.data.content) {
        setResumeData(normalizeResumeData(res.data.content));
        setSaveStatus('saved');
        setLastSavedAt(new Date());
      }
    } catch (err) {
      console.error("Failed to load resume profile", err);
    } finally {
      setLoading(false);
    }
  };

  const saveResume = async (silent = false) => {
    setSaveStatus('saving');
    try {
      await axios.post(`${API_BASE}/resume/save`, {
        title: "My Resume",
        content: resumeData
      }, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      saveSectionScoreSnapshot();
    } catch (err) {
      console.error("Failed to save resume profile", err);
      setSaveStatus('error');
      if (!silent) {
        alert("Failed to save resume.");
      }
    } finally {
      if (silent && saveStatus !== 'error') {
        setSaveStatus('saved');
      }
    }
  };

  const handleParsePdf = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/resume/parse-pdf`, formData, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setResumeData(normalizeResumeData(res.data));
      setSaveStatus('dirty');
      alert("PDF parsed successfully!");
    } catch (err) {
      console.error("Failed to parse PDF", err);
      alert("Failed to parse PDF.");
    } finally {
      setLoading(false);
      e.target.value = null; // Reset input
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAnalyzeBuilder = async () => {
    setAnalyzingBuilder(true);
    try {
      const res = await axios.post(`${API_BASE}/resume/analyze-builder`, {
        content: resumeData,
        jd: analysisJd
      }, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      setBuilderAnalysis({
        atsScore: res.data.ats_score,
        scoreDiff: res.data.score_diff,
        suggestions: res.data.suggestions || [],
        topFixes: res.data.full_report?.top_fixes || [],
        verdict: res.data.full_report?.overall_verdict || ''
      });
      setSaveStatus('saved');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to analyze builder resume.');
    } finally {
      setAnalyzingBuilder(false);
    }
  };

  const updatePersonal = (field, value) => {
    setResumeData(prev => ({
      ...prev,
      personal: { ...prev.personal, [field]: value }
    }));
    setSaveStatus('dirty');
  };

  const updateSkills = (field, value) => {
    setResumeData(prev => ({
      ...prev,
      skills: { ...prev.skills, [field]: value }
    }));
    setSaveStatus('dirty');
  };

  const addArrayItem = (field, defaultItem) => {
    setResumeData(prev => ({
      ...prev,
      [field]: [...prev[field], defaultItem]
    }));
    setSaveStatus('dirty');
  };

  const updateArrayItem = (field, index, subfield, value) => {
    setResumeData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = { ...newArray[index], [subfield]: value };
      return { ...prev, [field]: newArray };
    });
    setSaveStatus('dirty');
  };

  const removeArrayItem = (field, index) => {
    setResumeData(prev => {
      const newArray = [...prev[field]];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray };
    });
    setSaveStatus('dirty');
  };

  const moveArrayItem = (field, index, direction) => {
    setResumeData(prev => {
      const newArray = [...prev[field]];
      const target = index + direction;
      if (target < 0 || target >= newArray.length) return prev;
      [newArray[index], newArray[target]] = [newArray[target], newArray[index]];
      return { ...prev, [field]: newArray };
    });
    setSaveStatus('dirty');
  };

  const getWordCount = (text) => (text || '').trim().split(/\s+/).filter(Boolean).length;
  const hasMetric = (line) => /(\d+%|\d+\+|₹|\$|million|kpi|ms|sec|x\b|users?|clients?|days?|months?)/i.test(line || '');
  const startsWithActionVerb = (line) => {
    const first = (line || '').trim().toLowerCase().replace(/^[-*]\s*/, '').split(/\s+/)[0];
    return ACTION_VERBS.includes(first);
  };
  const extractBullets = (text) => (text || '')
    .split('\n')
    .map((line) => line.trim().replace(/^[-*]\s*/, ''))
    .filter(Boolean);

  const allBullets = [
    ...resumeData.experience.flatMap((exp, sectionIndex) =>
      extractBullets(exp.description).map((line, bulletIndex) => ({
        line,
        section: 'experience',
        sectionIndex,
        bulletIndex
      }))
    ),
    ...resumeData.projects.flatMap((proj, sectionIndex) =>
      extractBullets(proj.description).map((line, bulletIndex) => ({
        line,
        section: 'projects',
        sectionIndex,
        bulletIndex
      }))
    )
  ];

  const bulletDiagnostics = allBullets.map((item) => ({
    ...item,
    hasActionVerb: startsWithActionVerb(item.line),
    hasMetric: hasMetric(item.line),
    key: `${item.section}-${item.sectionIndex}-${item.bulletIndex}`
  }));

  const strongBullets = bulletDiagnostics.filter((b) => b.hasActionVerb && b.hasMetric).length;
  const weakBullets = bulletDiagnostics.filter((b) => !b.hasActionVerb || !b.hasMetric);
  const experienceBullets = resumeData.experience.flatMap((exp) => extractBullets(exp.description));
  const projectBullets = resumeData.projects.flatMap((proj) => extractBullets(proj.description));

  const calcSummaryScore = () => {
    const words = getWordCount(resumeData.summary);
    let score = 0;
    if (words >= 35) score += 40;
    if (words >= 50 && words <= 100) score += 30;
    if (/[A-Za-z]/.test(resumeData.summary || '') && /(engineer|developer|analyst|manager|intern)/i.test(resumeData.summary || '')) score += 30;
    const hints = [];
    if (words < 35) hints.push('Expand summary to at least 35 words.');
    if (words > 110) hints.push('Trim summary for stronger ATS readability (target 50-100 words).');
    if (!/(engineer|developer|analyst|manager|intern)/i.test(resumeData.summary || '')) hints.push('Mention your target role explicitly.');
    return { score: Math.min(100, score), hints };
  };

  const calcBulletSectionScore = (bullets, sectionName) => {
    if (!bullets.length) {
      return { score: 0, hints: [`Add at least 2 ${sectionName} bullet points.`] };
    }
    const actionCount = bullets.filter(startsWithActionVerb).length;
    const metricCount = bullets.filter(hasMetric).length;
    const score = Math.round(
      (Math.min(1, bullets.length / 4) * 30) +
      ((actionCount / bullets.length) * 35) +
      ((metricCount / bullets.length) * 35)
    );
    const hints = [];
    if (bullets.length < 4) hints.push(`Increase depth: add more ${sectionName} bullets.`);
    if (actionCount < bullets.length) hints.push('Start each bullet with a strong action verb.');
    if (metricCount < Math.ceil(bullets.length * 0.6)) hints.push('Add measurable impact to most bullets.');
    return { score, hints };
  };

  const calcSkillsScore = () => {
    const languages = (resumeData.skills.languages || '').split(',').map(s => s.trim()).filter(Boolean);
    const frameworks = (resumeData.skills.frameworks || '').split(',').map(s => s.trim()).filter(Boolean);
    const tools = (resumeData.skills.tools || '').split(',').map(s => s.trim()).filter(Boolean);
    const total = languages.length + frameworks.length + tools.length;
    let score = 0;
    if (languages.length > 0) score += 35;
    if (frameworks.length > 0) score += 30;
    if (tools.length > 0) score += 20;
    if (total >= 8) score += 15;
    const hints = [];
    if (!languages.length) hints.push('Add programming languages.');
    if (!frameworks.length) hints.push('Add relevant frameworks/libraries.');
    if (!tools.length) hints.push('Add tools/platforms (Git, Docker, AWS, etc.).');
    if (total > 14) hints.push('Reduce skill clutter; keep only high-signal, relevant skills.');
    return { score: Math.min(100, score), hints };
  };

  const sectionScores = {
    summary: calcSummaryScore(),
    experience: calcBulletSectionScore(experienceBullets, 'experience'),
    projects: calcBulletSectionScore(projectBullets, 'project'),
    skills: calcSkillsScore()
  };

  const saveSectionScoreSnapshot = () => {
    const snapshot = {
      ts: new Date().toISOString(),
      summary: sectionScores.summary.score,
      experience: sectionScores.experience.score,
      projects: sectionScores.projects.score,
      skills: sectionScores.skills.score
    };
    setSectionScoreHistory((prev) => {
      const last = prev[0];
      const isDuplicate = last &&
        last.summary === snapshot.summary &&
        last.experience === snapshot.experience &&
        last.projects === snapshot.projects &&
        last.skills === snapshot.skills;
      if (isDuplicate) return prev;
      const next = [snapshot, ...prev].slice(0, 12);
      try {
        localStorage.setItem('resume_section_score_history', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to persist section score history', err);
      }
      return next;
    });
  };

  const scoreColorClass = (score) => {
    if (score >= 80) return 'text-green-500 border-green-500';
    if (score >= 60) return 'text-yellow-500 border-yellow-500';
    return 'text-destructive border-destructive';
  };

  const replaceBulletInSection = (section, sectionIndex, bulletIndex, newBulletText) => {
    setResumeData((prev) => {
      const next = { ...prev };
      const rows = [...next[section]];
      const row = { ...rows[sectionIndex] };
      const description = row.description || '';
      const bullets = description
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      if (bulletIndex < 0 || bulletIndex >= bullets.length) return prev;
      bullets[bulletIndex] = newBulletText.replace(/^[-*]\s*/, '').trim();
      row.description = bullets.map((b) => `- ${b}`).join('\n');
      rows[sectionIndex] = row;
      next[section] = rows;
      return next;
    });
    setSaveStatus('dirty');
  };

  const handleAiRewriteWeakBullet = async (bulletItem) => {
    const key = bulletItem.key;
    setRewritingKey(key);
    try {
      const fd = new FormData();
      fd.append('bullet', bulletItem.line);
      fd.append('role', 'Software Engineer');
      const res = await axios.post(`${API_BASE}/resume/rewrite-bullet`, fd, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const rewrites = Array.isArray(res.data?.rewrites) ? res.data.rewrites : [];
      if (rewrites.length > 0) {
        replaceBulletInSection(
          bulletItem.section,
          bulletItem.sectionIndex,
          bulletItem.bulletIndex,
          rewrites[0]
        );
      }
    } catch (err) {
      console.error('Failed to rewrite weak bullet', err);
      alert('Failed to rewrite bullet.');
    } finally {
      setRewritingKey('');
    }
  };

  const applyMaxRewrite = (fixItem) => {
    if (!fixItem.original) {
      alert("This fix doesn't have an original text to replace. Please apply it manually.");
      return;
    }
    
    let applied = false;
    setResumeData(prev => {
      const next = { ...prev };
      
      // search in experience
      if (next.experience) {
        next.experience = next.experience.map(exp => {
          if (exp.description && exp.description.includes(fixItem.original)) {
            applied = true;
            return { ...exp, description: exp.description.replace(fixItem.original, fixItem.fix) };
          }
          return exp;
        });
      }
      
      // search in projects
      if (!applied && next.projects) {
        next.projects = next.projects.map(proj => {
          if (proj.description && proj.description.includes(fixItem.original)) {
            applied = true;
            return { ...proj, description: proj.description.replace(fixItem.original, fixItem.fix) };
          }
          return proj;
        });
      }
      
      return next;
    });
    
    if (applied) {
      setSaveStatus('dirty');
      alert("Max's rewrite applied successfully!");
    } else {
      alert("Could not find the exact original text in your resume. It may have already been modified.");
    }
  };

  const completionScore = (() => {
    const checks = [
      resumeData.personal.name,
      resumeData.personal.email,
      resumeData.personal.phone,
      resumeData.summary,
      resumeData.experience.length > 0,
      resumeData.education.length > 0,
      resumeData.projects.length > 0,
      resumeData.skills.languages || resumeData.skills.frameworks || resumeData.skills.tools
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  })();

  if (loading) {
    return <div className="p-6 font-mono text-muted-foreground animate-pulse">[ LOADING_BUILDER... ]</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Editor Pane (Hidden when printing) */}
      <div className="w-full lg:w-1/2 p-6 border-r-2 border-border overflow-y-auto print:hidden bg-background">
        <div className="flex justify-between items-center mb-6 border-b-2 border-border pb-4">
          <h2 className="text-2xl font-black uppercase tracking-tight">Resume Builder</h2>
          <div className="flex gap-2 flex-wrap justify-end">
            <select
              value={fontFamily}
              onChange={e => setFontFamily(e.target.value)}
              className="modern-input py-2 px-3 text-xs font-mono cursor-pointer"
              title="Resume font"
            >
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select
              value={layoutMode}
              onChange={e => setLayoutMode(e.target.value)}
              className="modern-input py-2 px-3 text-xs font-mono cursor-pointer"
              title="Resume density"
            >
              {LAYOUTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <label className="modern-btn-outline py-2 px-4 text-xs cursor-pointer border-dashed hover:bg-muted text-muted-foreground hover:text-foreground">
              Parse PDF
              <input type="file" accept=".pdf" className="hidden" onChange={handleParsePdf} />
            </label>
            <button onClick={() => saveResume(false)} disabled={saveStatus === 'saving'} className="modern-btn-outline px-4 py-2 text-xs">
              {saveStatus === 'saving' ? "Saving..." : "Save"}
            </button>
            <button onClick={handleAnalyzeBuilder} disabled={analyzingBuilder} className="modern-btn-outline px-4 py-2 text-xs">
              {analyzingBuilder ? "Analyzing..." : "Analyze Builder"}
            </button>
            <button onClick={handlePrint} className="modern-btn-outline bg-accent text-accent-foreground px-4 py-2 text-xs">
              Export PDF
            </button>
          </div>
        </div>

        <div className="mb-4 p-3 border-2 border-border bg-card">
          <div className="flex flex-wrap gap-4 text-xs font-mono">
            <span>Completion: <strong>{completionScore}%</strong></span>
            <span>Summary Words: <strong>{getWordCount(resumeData.summary)}</strong></span>
            <span>Experience: <strong>{resumeData.experience.length}</strong></span>
            <span>Projects: <strong>{resumeData.projects.length}</strong></span>
            <span>Strong Bullets: <strong>{strongBullets}/{allBullets.length || 0}</strong></span>
            <span className={saveStatus === 'error' ? 'text-destructive' : saveStatus === 'dirty' ? 'text-yellow-500' : 'text-muted-foreground'}>
              {saveStatus === 'dirty' && 'Unsaved changes'}
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && `Saved ${lastSavedAt ? lastSavedAt.toLocaleTimeString() : ''}`}
              {saveStatus === 'error' && 'Save failed'}
              {saveStatus === 'idle' && 'Ready'}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
            <input
              className="modern-input w-full p-2 text-xs font-mono"
              value={analysisJd}
              onChange={e => setAnalysisJd(e.target.value)}
              placeholder="Optional target job description for builder analysis"
            />
            {builderAnalysis && (
              <div className="p-4 border-2 border-primary bg-[#fff] text-xs font-mono w-full col-span-1 lg:col-span-2 mt-4">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
                  <h3 className="text-sm font-black text-primary uppercase">🔍 Maya's Analysis & Max's Rewrites</h3>
                  <div className="flex gap-4">
                    <span className="text-muted-foreground">ATS SCORE: <strong className="text-foreground text-base">{builderAnalysis.atsScore}/100</strong></span>
                    <span className="text-muted-foreground">DELTA: <strong className={builderAnalysis.scoreDiff > 0 ? "text-green-500" : builderAnalysis.scoreDiff < 0 ? "text-destructive" : "text-foreground"}>
                      {builderAnalysis.scoreDiff > 0 ? `+${builderAnalysis.scoreDiff}` : builderAnalysis.scoreDiff}
                    </strong></span>
                  </div>
                </div>
                
                {builderAnalysis.verdict && <p className="mb-4 text-sm text-foreground">{builderAnalysis.verdict}</p>}
                
                {builderAnalysis.topFixes && builderAnalysis.topFixes.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-bold text-muted-foreground uppercase text-[10px]">Top Suggested Fixes</h4>
                    {builderAnalysis.topFixes.map((fix, idx) => (
                      <div key={idx} className="p-3 border border-border bg-background flex flex-col gap-2">
                        <div className="flex justify-between">
                          <span className="uppercase text-[10px] bg-muted px-1 py-0.5 font-bold">{fix.category.replace('_', ' ')}</span>
                          <span className="text-[10px] text-muted-foreground">Priority {fix.priority}</span>
                        </div>
                        {fix.original && (
                          <div className="flex gap-2">
                            <span className="text-destructive font-black text-xs min-w-[20px]">-</span>
                            <span className="text-muted-foreground line-through decoration-destructive/50">{fix.original}</span>
                          </div>
                        )}
                        <div className="flex gap-2 items-start">
                          <span className="text-green-500 font-black text-xs min-w-[20px]">+</span>
                          <span className="text-foreground font-bold">{fix.fix}</span>
                        </div>
                        
                        {/* 1-Click Apply Button */}
                        {fix.original && (
                          <button 
                            onClick={() => applyMaxRewrite(fix)}
                            className="self-end mt-1 text-[10px] uppercase font-black bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-3 py-1 border border-primary transition-colors"
                          >
                            1-Click Apply ⚡
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {builderAnalysis.suggestions.map((sug, idx) => (
                      <p key={idx} className="text-muted-foreground">- {sug}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {allBullets.length > 0 && (
          <div className="mb-6 p-4 border-2 border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase">ATS Bullet Quality</h3>
              <span className="text-xs font-mono text-muted-foreground">
                Strong = starts with action verb + includes measurable impact
              </span>
            </div>
            {weakBullets.length === 0 ? (
              <p className="text-xs font-mono text-green-500">Great work - all bullets are impact-oriented.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {weakBullets.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="text-xs font-mono p-2 border border-border bg-background">
                    <p className="text-foreground">{item.line}</p>
                    <p className="text-muted-foreground mt-1">
                      {!item.hasActionVerb ? "Add a strong action verb. " : ""}
                      {!item.hasMetric ? "Add a measurable result (%, count, time, revenue)." : ""}
                    </p>
                    <button
                      onClick={() => handleAiRewriteWeakBullet(item)}
                      disabled={rewritingKey === item.key}
                      className="mt-2 text-[11px] font-mono px-2 py-1 border border-primary text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                    >
                      {rewritingKey === item.key ? 'Rewriting...' : 'AI Rewrite'}
                    </button>
                  </div>
                ))}
                {weakBullets.length > 6 && (
                  <p className="text-xs font-mono text-muted-foreground">+{weakBullets.length - 6} more weak bullets</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mb-6 p-4 border-2 border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black uppercase">Section ATS Scores</h3>
            <span className="text-xs font-mono text-muted-foreground">Target 80+ per section</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {Object.entries(sectionScores).map(([key, value]) => (
              <div key={key} className={`p-3 border-2 bg-background ${scoreColorClass(value.score)}`}>
                <p className="text-[10px] font-mono uppercase">{key}</p>
                <p className="text-2xl font-black">{value.score}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {Object.entries(sectionScores).map(([key, value]) => (
              <div key={`hint-${key}`} className="p-2 border border-border bg-background">
                <p className="text-xs font-mono font-bold uppercase mb-1">{key} Hints</p>
                {value.hints.length ? (
                  <ul className="text-xs font-mono text-muted-foreground list-disc pl-4 space-y-1">
                    {value.hints.map((hint, idx) => <li key={idx}>{hint}</li>)}
                  </ul>
                ) : (
                  <p className="text-xs font-mono text-green-500">Looks strong for ATS.</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 p-4 border-2 border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black uppercase">Section Score Trend</h3>
            <span className="text-xs font-mono text-muted-foreground">Last {Math.min(sectionScoreHistory.length, 12)} saves</span>
          </div>
          {sectionScoreHistory.length < 2 ? (
            <p className="text-xs font-mono text-muted-foreground">Save a few iterations to track progress over time.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sectionScoreHistory.map((snap, idx) => {
                const prev = sectionScoreHistory[idx + 1];
                const delta = (field) => (prev ? snap[field] - prev[field] : 0);
                const deltaLabel = (d) => (d > 0 ? `+${d}` : `${d}`);
                return (
                  <div key={snap.ts} className="p-2 border border-border bg-background text-xs font-mono">
                    <div className="flex justify-between mb-1">
                      <span>Save #{sectionScoreHistory.length - idx}</span>
                      <span className="text-muted-foreground">{new Date(snap.ts).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {['summary', 'experience', 'projects', 'skills'].map((field) => {
                        const d = delta(field);
                        return (
                          <span key={`${snap.ts}-${field}`} className={d > 0 ? 'text-green-500' : d < 0 ? 'text-destructive' : 'text-muted-foreground'}>
                            {field}: {snap[field]} ({deltaLabel(d)})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['personal', 'summary', 'experience', 'education', 'projects', 'skills'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 font-mono text-xs uppercase border-2 transition-colors shrink-0 ${activeTab === tab ? 'bg-primary text-primary-foreground border-primary font-bold' : 'bg-card border-border hover:border-primary'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Editor Forms */}
        <div className="space-y-4">
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div><label className="text-xs font-mono font-bold uppercase block mb-1">Full Name</label><input className="modern-input w-full p-2" value={resumeData.personal.name} onChange={e => updatePersonal('name', e.target.value)} /></div>
              <div><label className="text-xs font-mono font-bold uppercase block mb-1">Email</label><input className="modern-input w-full p-2" value={resumeData.personal.email} onChange={e => updatePersonal('email', e.target.value)} /></div>
              <div><label className="text-xs font-mono font-bold uppercase block mb-1">Phone</label><input className="modern-input w-full p-2" value={resumeData.personal.phone} onChange={e => updatePersonal('phone', e.target.value)} /></div>
              <div><label className="text-xs font-mono font-bold uppercase block mb-1">LinkedIn URL</label><input className="modern-input w-full p-2" value={resumeData.personal.linkedin} onChange={e => updatePersonal('linkedin', e.target.value)} /></div>
              <div><label className="text-xs font-mono font-bold uppercase block mb-1">GitHub URL</label><input className="modern-input w-full p-2" value={resumeData.personal.github} onChange={e => updatePersonal('github', e.target.value)} /></div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <label className="text-xs font-mono font-bold uppercase block mb-1">Professional Summary</label>
              <textarea className="modern-input w-full p-2 h-32" value={resumeData.summary} onChange={e => { setResumeData({...resumeData, summary: e.target.value}); setSaveStatus('dirty'); }} />
              <p className="text-xs font-mono text-muted-foreground mt-2">Tip: Keep this between 50-90 words and role-specific.</p>
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="space-y-6">
              {resumeData.experience.map((exp, i) => (
                <div key={i} className="p-4 border-2 border-border bg-card relative">
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button onClick={() => moveArrayItem('experience', i, -1)} className="text-xs font-mono hover:underline">[↑]</button>
                    <button onClick={() => moveArrayItem('experience', i, 1)} className="text-xs font-mono hover:underline">[↓]</button>
                    <button onClick={() => removeArrayItem('experience', i)} className="text-destructive font-mono text-xs hover:underline">[Remove]</button>
                  </div>
                  <div className="space-y-2">
                    <input className="modern-input w-full p-2 text-sm font-bold" placeholder="Company Name" value={exp.company} onChange={e => updateArrayItem('experience', i, 'company', e.target.value)} />
                    <input className="modern-input w-full p-2 text-sm" placeholder="Job Title" value={exp.title} onChange={e => updateArrayItem('experience', i, 'title', e.target.value)} />
                    <div className="flex gap-2">
                      <input className="modern-input w-1/2 p-2 text-sm" placeholder="Start Date (e.g. Jan 2020)" value={exp.startDate} onChange={e => updateArrayItem('experience', i, 'startDate', e.target.value)} />
                      <input className="modern-input w-1/2 p-2 text-sm" placeholder="End Date (e.g. Present)" value={exp.endDate} onChange={e => updateArrayItem('experience', i, 'endDate', e.target.value)} />
                    </div>
                    <textarea className="modern-input w-full p-2 text-sm h-24" placeholder="Description (one bullet per line)" value={exp.description} onChange={e => updateArrayItem('experience', i, 'description', e.target.value)} />
                  </div>
                </div>
              ))}
              <button onClick={() => addArrayItem('experience', { company: '', title: '', startDate: '', endDate: '', description: '' })} className="w-full py-2 border-2 border-dashed border-primary text-primary font-mono text-sm hover:bg-primary/10 transition-colors">
                + Add Experience
              </button>
            </div>
          )}

          {activeTab === 'education' && (
            <div className="space-y-6">
              {resumeData.education.map((edu, i) => (
                <div key={i} className="p-4 border-2 border-border bg-card relative">
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button onClick={() => moveArrayItem('education', i, -1)} className="text-xs font-mono hover:underline">[↑]</button>
                    <button onClick={() => moveArrayItem('education', i, 1)} className="text-xs font-mono hover:underline">[↓]</button>
                    <button onClick={() => removeArrayItem('education', i)} className="text-destructive font-mono text-xs hover:underline">[Remove]</button>
                  </div>
                  <div className="space-y-2">
                    <input className="modern-input w-full p-2 text-sm font-bold" placeholder="School/University" value={edu.school} onChange={e => updateArrayItem('education', i, 'school', e.target.value)} />
                    <input className="modern-input w-full p-2 text-sm" placeholder="Degree (e.g. B.S. Computer Science)" value={edu.degree} onChange={e => updateArrayItem('education', i, 'degree', e.target.value)} />
                    <input className="modern-input w-full p-2 text-sm" placeholder="Year / Expected Graduation" value={edu.year} onChange={e => updateArrayItem('education', i, 'year', e.target.value)} />
                  </div>
                </div>
              ))}
              <button onClick={() => addArrayItem('education', { school: '', degree: '', year: '' })} className="w-full py-2 border-2 border-dashed border-primary text-primary font-mono text-sm hover:bg-primary/10 transition-colors">
                + Add Education
              </button>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-6">
              {resumeData.projects.map((proj, i) => (
                <div key={i} className="p-4 border-2 border-border bg-card relative">
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button onClick={() => moveArrayItem('projects', i, -1)} className="text-xs font-mono hover:underline">[↑]</button>
                    <button onClick={() => moveArrayItem('projects', i, 1)} className="text-xs font-mono hover:underline">[↓]</button>
                    <button onClick={() => removeArrayItem('projects', i)} className="text-destructive font-mono text-xs hover:underline">[Remove]</button>
                  </div>
                  <div className="space-y-2">
                    <input className="modern-input w-full p-2 text-sm font-bold" placeholder="Project Name" value={proj.name} onChange={e => updateArrayItem('projects', i, 'name', e.target.value)} />
                    <input className="modern-input w-full p-2 text-sm" placeholder="Technologies Used" value={proj.technologies} onChange={e => updateArrayItem('projects', i, 'technologies', e.target.value)} />
                    <textarea className="modern-input w-full p-2 text-sm h-24" placeholder="Description (one bullet per line)" value={proj.description} onChange={e => updateArrayItem('projects', i, 'description', e.target.value)} />
                  </div>
                </div>
              ))}
              <button onClick={() => addArrayItem('projects', { name: '', technologies: '', description: '' })} className="w-full py-2 border-2 border-dashed border-primary text-primary font-mono text-sm hover:bg-primary/10 transition-colors">
                + Add Project
              </button>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div><label className="text-xs font-mono font-bold uppercase block mb-1">Languages</label><input className="modern-input w-full p-2" placeholder="e.g. Python, Java, JavaScript" value={resumeData.skills.languages} onChange={e => updateSkills('languages', e.target.value)} /></div>
              <div><label className="text-xs font-mono font-bold uppercase block mb-1">Frameworks</label><input className="modern-input w-full p-2" placeholder="e.g. React, Node.js, Django" value={resumeData.skills.frameworks} onChange={e => updateSkills('frameworks', e.target.value)} /></div>
              <div><label className="text-xs font-mono font-bold uppercase block mb-1">Tools / Other</label><input className="modern-input w-full p-2" placeholder="e.g. Git, Docker, AWS" value={resumeData.skills.tools} onChange={e => updateSkills('tools', e.target.value)} /></div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Pane (Becomes full width/height when printing) */}
      <div className="w-full lg:w-1/2 bg-[#f8f9fa] overflow-y-auto flex items-start justify-center print:w-full print:block print:bg-white print:overflow-visible">
        {/* A4 Sheet Simulation */}
        <div
          className={`bg-white text-black shadow-2xl my-8 w-[210mm] min-h-[297mm] print:shadow-none print:m-0 print:p-0 ${layoutMode === 'compact' ? 'p-6' : 'p-8'}`}
          style={{ fontFamily, lineHeight: layoutMode === 'compact' ? 1.35 : 1.5 }}
        >
          {/* Header */}
          <header className="border-b border-border pb-4 mb-4 text-center">
            <h1 style={{ fontFamily, fontSize: resumeData.personal.name ? (layoutMode === 'compact' ? '1.75rem' : '2rem') : '1.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: resumeData.personal.name ? '#000' : '#aaa' }}>
              {resumeData.personal.name || 'Your Name Here'}
            </h1>
            <div className="flex flex-wrap justify-center gap-3 text-sm mt-2 font-sans">
              {resumeData.personal.email && <span>{resumeData.personal.email}</span>}
              {resumeData.personal.phone && <span>• {resumeData.personal.phone}</span>}
              {resumeData.personal.linkedin && <span>• {resumeData.personal.linkedin}</span>}
              {resumeData.personal.github && <span>• {resumeData.personal.github}</span>}
            </div>
          </header>

          {/* Summary */}
          {resumeData.summary && (
            <section className="mb-4 font-sans text-sm text-justify">
              {resumeData.summary}
            </section>
          )}

          {/* Education */}
          {resumeData.education.length > 0 && (
            <section className="mb-4">
              <h2 className="text-lg font-serif font-bold uppercase border-b border-black mb-2">Education</h2>
              {resumeData.education.map((edu, i) => (
                <div key={i} className="mb-2 font-sans text-sm flex justify-between items-start">
                  <div>
                    <div className="font-bold">{edu.school}</div>
                    <div className="italic">{edu.degree}</div>
                  </div>
                  <div className="text-right shrink-0 ml-4 font-bold">
                    {edu.year}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Experience */}
          {resumeData.experience.length > 0 && (
            <section className="mb-4">
              <h2 className="text-lg font-serif font-bold uppercase border-b border-black mb-2">Experience</h2>
              {resumeData.experience.map((exp, i) => (
                <div key={i} className="mb-3 font-sans text-sm">
                  <div className="flex justify-between items-start font-bold">
                    <div>{exp.company} <span className="italic font-normal">| {exp.title}</span></div>
                    <div>{exp.startDate} – {exp.endDate}</div>
                  </div>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {exp.description.split('\n').map((bullet, j) => bullet.trim() && (
                      <li key={j}>{bullet.replace(/^- /, '')}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {/* Projects */}
          {resumeData.projects.length > 0 && (
            <section className="mb-4">
              <h2 className="text-lg font-serif font-bold uppercase border-b border-black mb-2">Projects</h2>
              {resumeData.projects.map((proj, i) => (
                <div key={i} className="mb-2 font-sans text-sm">
                  <div className="font-bold">
                    {proj.name} <span className="font-normal italic">| {proj.technologies}</span>
                  </div>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {proj.description.split('\n').map((bullet, j) => bullet.trim() && (
                      <li key={j}>{bullet.replace(/^- /, '')}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {/* Skills */}
          {(resumeData.skills.languages || resumeData.skills.frameworks || resumeData.skills.tools) && (
            <section className="mb-4">
              <h2 className="text-lg font-serif font-bold uppercase border-b border-black mb-2">Technical Skills</h2>
              <div className="font-sans text-sm space-y-1">
                {resumeData.skills.languages && <div><span className="font-bold">Languages:</span> {resumeData.skills.languages}</div>}
                {resumeData.skills.frameworks && <div><span className="font-bold">Frameworks:</span> {resumeData.skills.frameworks}</div>}
                {resumeData.skills.tools && <div><span className="font-bold">Tools:</span> {resumeData.skills.tools}</div>}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
