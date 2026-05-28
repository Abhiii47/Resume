import React, { useState, useEffect } from 'react';
import api from '../lib/api';

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

  // Parse template query parameter if present
  const query = new URLSearchParams(window.location.search);
  const [templateId, setTemplateId] = useState(query.get('template') || 'classic');

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

  const TEMPLATES_LIST = [
    { label: 'Classic Professional', value: 'classic' },
    { label: 'Modern Developer',     value: 'modern' },
    { label: 'Minimal Impact',       value: 'minimal' },
    { label: 'Executive Two-Column', value: 'executive' },
    { label: 'Creative Designer',    value: 'creative' },
    { label: 'Academic Researcher',  value: 'academic' },
    { label: 'Startup Specialist',   value: 'startup' },
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
      const res = await api.get("/resume/load");
      if (res.data.content) {
        setResumeData(normalizeResumeData(res.data.content));
        setSaveStatus('saved');
        setLastSavedAt(new Date());
      }
    } catch (err) {
      console.warn("Failed to load resume profile", err?.message);
    } finally {
      setLoading(false);
    }
  };

  const saveResume = async (silent = false) => {
    setSaveStatus('saving');
    try {
      await api.post("/resume/save", {
        title: "My Resume",
        content: resumeData
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
      const res = await api.post("/resume/parse-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" }
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
      const res = await api.post("/resume/analyze-builder", {
        content: resumeData,
        jd: analysisJd
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
      const res = await api.post("/resume/rewrite-bullet", fd, {
        headers: { "Content-Type": "multipart/form-data" }
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

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.trim().toLowerCase().replace(/\b(\w)/g, s => s.toUpperCase());
  };

  const normalizeDateString = (str) => {
    if (!str) return '';
    let clean = str.trim();
    if (/^present$/i.test(clean)) return 'Present';
    
    const months = [
      { reg: /january/i, rep: 'January' }, { reg: /jan\.?/i, rep: 'Jan' },
      { reg: /february/i, rep: 'February' }, { reg: /feb\.?/i, rep: 'Feb' },
      { reg: /march/i, rep: 'March' }, { reg: /mar\.?/i, rep: 'Mar' },
      { reg: /april/i, rep: 'April' }, { reg: /apr\.?/i, rep: 'Apr' },
      { reg: /may/i, rep: 'May' },
      { reg: /june/i, rep: 'June' }, { reg: /jun\.?/i, rep: 'Jun' },
      { reg: /july/i, rep: 'July' }, { reg: /jul\.?/i, rep: 'Jul' },
      { reg: /august/i, rep: 'August' }, { reg: /aug\.?/i, rep: 'Aug' },
      { reg: /september/i, rep: 'September' }, { reg: /sept?\.?/i, rep: 'Sep' },
      { reg: /october/i, rep: 'October' }, { reg: /oct\.?/i, rep: 'Oct' },
      { reg: /november/i, rep: 'November' }, { reg: /nov\.?/i, rep: 'Nov' },
      { reg: /december/i, rep: 'December' }, { reg: /dec\.?/i, rep: 'Dec' },
    ];
    
    months.forEach(m => {
      clean = clean.replace(m.reg, m.rep);
    });
    
    return clean;
  };

  const normalizeDescriptionBullets = (text) => {
    if (!text) return '';
    return text
      .split('\n')
      .map(line => {
        let cleaned = line.trim();
        if (!cleaned) return '';
        
        // Remove leading bullets and numbering (e.g. -, *, •, +, 1., 2.)
        cleaned = cleaned.replace(/^[-*•+\d\.\s]+/g, '').trim();
        if (!cleaned) return '';
        
        // Capitalize first character
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        
        // Ensure ending punctuation
        if (!/[.!?]$/.test(cleaned)) {
          cleaned += '.';
        }
        
        return `- ${cleaned}`;
      })
      .filter(Boolean)
      .join('\n');
  };

  const normalizeSkillsString = (str) => {
    if (!str) return '';
    return str
      .split(',')
      .map(s => {
        let val = s.trim();
        if (!val) return '';
        const lower = val.toLowerCase();
        const techCapitalizations = {
          'javascript': 'JavaScript', 'typescript': 'TypeScript', 'html': 'HTML',
          'css': 'CSS', 'react': 'React', 'reactjs': 'React.js', 'vue': 'Vue',
          'vuejs': 'Vue.js', 'nodejs': 'Node.js', 'node': 'Node.js', 'mongodb': 'MongoDB',
          'postgresql': 'PostgreSQL', 'mysql': 'MySQL', 'aws': 'AWS', 'gcp': 'GCP',
          'python': 'Python', 'java': 'Java', 'github': 'GitHub', 'git': 'Git',
          'docker': 'Docker', 'kubernetes': 'Kubernetes', 'graphql': 'GraphQL',
          'rest': 'REST API', 'restful': 'RESTful API', 'api': 'API', 'apis': 'APIs',
          'sqlite': 'SQLite', 'django': 'Django', 'flask': 'Flask', 'angular': 'Angular',
          'redux': 'Redux', 'nextjs': 'Next.js', 'sass': 'Sass', 'scss': 'SCSS',
          'webpack': 'Webpack', 'vite': 'Vite', 'npm': 'npm', 'yarn': 'Yarn',
          'firebase': 'Firebase', 'supabase': 'Supabase', 'redis': 'Redis',
          'elastic': 'Elasticsearch', 'elasticsearch': 'Elasticsearch', 'ci/cd': 'CI/CD',
          'cicd': 'CI/CD', 'jenkins': 'Jenkins', 'linux': 'Linux', 'windows': 'Windows', 'macos': 'macOS'
        };
        if (techCapitalizations[lower]) {
          return techCapitalizations[lower];
        }
        return val.charAt(0).toUpperCase() + val.slice(1);
      })
      .filter(Boolean)
      .join(', ');
  };

  const handleNormalizeAll = () => {
    setResumeData(prev => {
      const next = { ...prev };
      
      // Personal Details
      next.personal = {
        name: toTitleCase(prev.personal.name),
        email: (prev.personal.email || '').trim().toLowerCase(),
        phone: (prev.personal.phone || '').trim(),
        linkedin: (prev.personal.linkedin || '').trim().replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, ''),
        github: (prev.personal.github || '').trim().replace(/^https?:\/\/(www\.)?github\.com\//, '')
      };
      
      // Professional Summary
      if (prev.summary) {
        let cleanSummary = prev.summary.trim().replace(/\s+/g, ' ');
        cleanSummary = cleanSummary.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
        if (cleanSummary && !/[.!?]$/.test(cleanSummary)) {
          cleanSummary += '.';
        }
        next.summary = cleanSummary;
      }
      
      // Work Experience
      if (Array.isArray(prev.experience)) {
        next.experience = prev.experience.map(exp => ({
          ...exp,
          company: toTitleCase(exp.company),
          title: toTitleCase(exp.title),
          startDate: normalizeDateString(exp.startDate),
          endDate: normalizeDateString(exp.endDate),
          description: normalizeDescriptionBullets(exp.description)
        }));
      }
      
      // Projects
      if (Array.isArray(prev.projects)) {
        next.projects = prev.projects.map(proj => ({
          ...proj,
          name: toTitleCase(proj.name),
          technologies: normalizeSkillsString(proj.technologies),
          description: normalizeDescriptionBullets(proj.description)
        }));
      }
      
      // Education
      if (Array.isArray(prev.education)) {
        next.education = prev.education.map(edu => ({
          ...edu,
          school: toTitleCase(edu.school),
          degree: toTitleCase(edu.degree),
          year: normalizeDateString(edu.year)
        }));
      }
      
      // Skills stack
      next.skills = {
        languages: normalizeSkillsString(prev.skills.languages),
        frameworks: normalizeSkillsString(prev.skills.frameworks),
        tools: normalizeSkillsString(prev.skills.tools)
      };
      
      return next;
    });
    setSaveStatus('dirty');
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
    return (
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent)", marginBottom: 12 }}>Loading builder Profile</div>
          <div className="loading-dots"><div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" /></div>
        </div>
      </div>
    );
  }

  // ── Template Rendering Code ──────────────────────────────────────────
  
  const ClassicTemplate = () => (
    <>
      <header style={{ borderBottom: "2px solid #000", paddingBottom: 16, marginBottom: 16, textAlign: "center" }}>
        <h1 style={{ fontFamily, fontSize: resumeData.personal.name ? (layoutMode === 'compact' ? '1.5rem' : '1.8rem') : '1.3rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: resumeData.personal.name ? '#000' : '#aaa', margin: "0 0 8px" }}>
          {resumeData.personal.name || 'Your Name Here'}
        </h1>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 12px", fontSize: 11.5, fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>
          {resumeData.personal.email && <span>{resumeData.personal.email}</span>}
          {resumeData.personal.phone && <span>• {resumeData.personal.phone}</span>}
          {resumeData.personal.linkedin && <span>• {resumeData.personal.linkedin}</span>}
          {resumeData.personal.github && <span>• {resumeData.personal.github}</span>}
        </div>
      </header>

      {resumeData.summary && (
        <section style={{ marginBottom: 16, fontFamily: "var(--font-body)", fontSize: 12, textAlign: "justify", color: "#111", lineHeight: 1.6 }}>
          {resumeData.summary}
        </section>
      )}

      {resumeData.education.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontFamily, fontWeight: 700, borderBottom: "1px solid #000", paddingBottom: 2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Education</h2>
          {resumeData.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: 12, fontFamily: "var(--font-body)" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{edu.school}</div>
                <div style={{ fontStyle: "italic", color: "#333" }}>{edu.degree}</div>
              </div>
              <div style={{ textAlign: "right", fontWeight: 700 }}>
                {edu.year}
              </div>
            </div>
          ))}
        </section>
      )}

      {resumeData.experience.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontFamily, fontWeight: 700, borderBottom: "1px solid #000", paddingBottom: 2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Experience</h2>
          {resumeData.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 10, fontSize: 12, fontFamily: "var(--font-body)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontWeight: 700, marginBottom: 4 }}>
                <div>{exp.company} <span style={{ fontStyle: "italic", fontWeight: 400, color: "#333" }}>| {exp.title}</span></div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{exp.startDate} – {exp.endDate}</div>
              </div>
              <ul style={{ listStyle: "disc", paddingLeft: 18, margin: "4px 0 0", display: "flex", flexDirection: "column", gap: 3 }}>
                {exp.description.split('\n').map((bullet, j) => bullet.trim() && (
                  <li key={j}>{bullet.replace(/^- /, '')}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {resumeData.projects.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontFamily, fontWeight: 700, borderBottom: "1px solid #000", paddingBottom: 2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Projects</h2>
          {resumeData.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: 8, fontSize: 12, fontFamily: "var(--font-body)" }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                {proj.name} <span style={{ fontWeight: 400, fontStyle: "italic", color: "#333" }}>| {proj.technologies}</span>
              </div>
              <ul style={{ listStyle: "disc", paddingLeft: 18, margin: "4px 0 0", display: "flex", flexDirection: "column", gap: 3 }}>
                {proj.description.split('\n').map((bullet, j) => bullet.trim() && (
                  <li key={j}>{bullet.replace(/^- /, '')}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {(resumeData.skills.languages || resumeData.skills.frameworks || resumeData.skills.tools) && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontFamily, fontWeight: 700, borderBottom: "1px solid #000", paddingBottom: 2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Technical Skills</h2>
          <div style={{ fontSize: 12, fontFamily: "var(--font-body)", display: "flex", flexDirection: "column", gap: 3 }}>
            {resumeData.skills.languages && <div><span style={{ fontWeight: 700 }}>Languages:</span> {resumeData.skills.languages}</div>}
            {resumeData.skills.frameworks && <div><span style={{ fontWeight: 700 }}>Frameworks:</span> {resumeData.skills.frameworks}</div>}
            {resumeData.skills.tools && <div><span style={{ fontWeight: 700 }}>Tools & Platforms:</span> {resumeData.skills.tools}</div>}
          </div>
        </section>
      )}
    </>
  );

  const ModernTemplate = () => (
    <>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #000", paddingBottom: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily, fontSize: resumeData.personal.name ? '1.85rem' : '1.3rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000', margin: 0 }}>
            {resumeData.personal.name || 'Your Name Here'}
          </h1>
          <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--accent-dark)", marginTop: 4 }}>
            Software Developer
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, fontFamily: "var(--font-body)", lineHeight: 1.5, color: "#111" }}>
          {resumeData.personal.email && <div>{resumeData.personal.email}</div>}
          {resumeData.personal.phone && <div>{resumeData.personal.phone}</div>}
          {resumeData.personal.linkedin && <div>{resumeData.personal.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</div>}
          {resumeData.personal.github && <div>{resumeData.personal.github.replace(/^https?:\/\/(www\.)?/, '')}</div>}
        </div>
      </header>

      {resumeData.summary && (
        <section style={{ marginBottom: 20, fontFamily: "var(--font-body)", fontSize: 12, textAlign: "justify", lineHeight: 1.6, color: "#333" }}>
          {resumeData.summary}
        </section>
      )}

      {resumeData.experience.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 800, borderLeft: "4px solid var(--accent)", paddingLeft: 8, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>Experience</h2>
          {resumeData.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 12, fontSize: 12, fontFamily: "var(--font-body)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontWeight: 700, marginBottom: 4 }}>
                <div>{exp.company} <span style={{ fontStyle: "italic", fontWeight: 500, color: "var(--text-secondary)" }}>· {exp.title}</span></div>
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{exp.startDate} – {exp.endDate}</div>
              </div>
              <ul style={{ listStyle: "circle", paddingLeft: 16, margin: "4px 0 0", display: "flex", flexDirection: "column", gap: 3 }}>
                {exp.description.split('\n').map((bullet, j) => bullet.trim() && (
                  <li key={j}>{bullet.replace(/^- /, '')}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {resumeData.projects.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 800, borderLeft: "4px solid var(--accent)", paddingLeft: 8, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>Projects</h2>
          {resumeData.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: 10, fontSize: 12, fontFamily: "var(--font-body)" }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                {proj.name} <span style={{ fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--bg-elevated)", padding: "1px 6px", border: "1px solid var(--border-muted)", marginLeft: 6 }}>{proj.technologies}</span>
              </div>
              <ul style={{ listStyle: "circle", paddingLeft: 16, margin: "4px 0 0", display: "flex", flexDirection: "column", gap: 3 }}>
                {proj.description.split('\n').map((bullet, j) => bullet.trim() && (
                  <li key={j}>{bullet.replace(/^- /, '')}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {(resumeData.skills.languages || resumeData.skills.frameworks || resumeData.skills.tools) && (
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 800, borderLeft: "4px solid var(--accent)", paddingLeft: 8, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>Skills Matrix</h2>
          <div style={{ fontSize: 12, fontFamily: "var(--font-body)", display: "flex", flexDirection: "column", gap: 4 }}>
            {resumeData.skills.languages && <div><span style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", color: "var(--text-secondary)" }}>Languages:</span> {resumeData.skills.languages}</div>}
            {resumeData.skills.frameworks && <div><span style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", color: "var(--text-secondary)" }}>Frameworks:</span> {resumeData.skills.frameworks}</div>}
            {resumeData.skills.tools && <div><span style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", color: "var(--text-secondary)" }}>Tools & Ops:</span> {resumeData.skills.tools}</div>}
          </div>
        </section>
      )}

      {resumeData.education.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 800, borderLeft: "4px solid var(--accent)", paddingLeft: 8, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>Education</h2>
          {resumeData.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: 12, fontFamily: "var(--font-body)" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{edu.school}</div>
                <div style={{ fontStyle: "italic", fontSize: 11, color: "#444" }}>{edu.degree}</div>
              </div>
              <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                {edu.year}
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );

  const MinimalTemplate = () => (
    <>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily, fontSize: resumeData.personal.name ? '1.8rem' : '1.3rem', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#000', margin: "0 0 10px" }}>
          {resumeData.personal.name || 'Your Name Here'}
        </h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
          {resumeData.personal.email && <span>{resumeData.personal.email}</span>}
          {resumeData.personal.phone && <span>{resumeData.personal.phone}</span>}
          {resumeData.personal.linkedin && <span>{resumeData.personal.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>}
          {resumeData.personal.github && <span>{resumeData.personal.github.replace(/^https?:\/\/(www\.)?/, '')}</span>}
        </div>
      </header>

      {resumeData.summary && (
        <section style={{ marginBottom: 24, fontFamily: "var(--font-body)", fontSize: 11.5, textAlign: "justify", lineHeight: 1.6, color: "#222" }}>
          {resumeData.summary}
        </section>
      )}

      {resumeData.experience.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", marginBottom: 14 }}>Experience</h2>
          {resumeData.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 16, fontSize: 11.5, fontFamily: "var(--font-body)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontWeight: 700, marginBottom: 4 }}>
                <div style={{ color: "#000" }}>{exp.company} <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>/ {exp.title}</span></div>
                <div style={{ fontSize: 10, fontWeight: 500, color: "var(--text-muted)" }}>{exp.startDate} – {exp.endDate}</div>
              </div>
              <ul style={{ listStyle: "none", paddingLeft: 0, margin: "4px 0 0", display: "flex", flexDirection: "column", gap: 3 }}>
                {exp.description.split('\n').map((bullet, j) => bullet.trim() && (
                  <li key={j} style={{ display: "flex", gap: 8 }}>
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                    <span>{bullet.replace(/^- /, '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {resumeData.projects.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", marginBottom: 14 }}>Projects</h2>
          {resumeData.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: 12, fontSize: 11.5, fontFamily: "var(--font-body)" }}>
              <div style={{ fontWeight: 700, marginBottom: 2, color: "#000" }}>
                {proj.name} <span style={{ fontWeight: 400, color: "var(--text-secondary)", fontSize: 11 }}>· {proj.technologies}</span>
              </div>
              <ul style={{ listStyle: "none", paddingLeft: 0, margin: "4px 0 0", display: "flex", flexDirection: "column", gap: 3 }}>
                {proj.description.split('\n').map((bullet, j) => bullet.trim() && (
                  <li key={j} style={{ display: "flex", gap: 8 }}>
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                    <span>{bullet.replace(/^- /, '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {(resumeData.skills.languages || resumeData.skills.frameworks || resumeData.skills.tools) && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", marginBottom: 14 }}>Skills</h2>
          <div style={{ fontSize: 11.5, fontFamily: "var(--font-body)", display: "flex", flexDirection: "column", gap: 3 }}>
            {resumeData.skills.languages && <div><span style={{ fontWeight: 600 }}>Languages:</span> {resumeData.skills.languages}</div>}
            {resumeData.skills.frameworks && <div><span style={{ fontWeight: 600 }}>Frameworks:</span> {resumeData.skills.frameworks}</div>}
            {resumeData.skills.tools && <div><span style={{ fontWeight: 600 }}>Tools:</span> {resumeData.skills.tools}</div>}
          </div>
        </section>
      )}

      {resumeData.education.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-secondary)", marginBottom: 14 }}>Education</h2>
          {resumeData.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 11.5, fontFamily: "var(--font-body)" }}>
              <div>
                <span style={{ fontWeight: 700 }}>{edu.school}</span> <span style={{ color: "var(--text-secondary)" }}>/ {edu.degree}</span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {edu.year}
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );

  const ExecutiveTemplate = () => (
    <div style={{ display: "flex", gap: 24, height: "100%" }}>
      {/* Left Column - Sidebar (32%) */}
      <div style={{ width: "32%", borderRight: "1px solid #ddd", paddingRight: 16, display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h1 style={{ fontFamily, fontSize: resumeData.personal.name ? '1.4rem' : '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: '#000', margin: "0 0 6px" }}>
            {resumeData.personal.name || 'Your Name'}
          </h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, fontFamily: "var(--font-body)", color: "var(--text-secondary)", wordBreak: "break-word" }}>
            {resumeData.personal.email && <div>✉ {resumeData.personal.email}</div>}
            {resumeData.personal.phone && <div>☎ {resumeData.personal.phone}</div>}
            {resumeData.personal.linkedin && <div>in: {resumeData.personal.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</div>}
            {resumeData.personal.github && <div>gh: {resumeData.personal.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</div>}
          </div>
        </div>

        {(resumeData.skills.languages || resumeData.skills.frameworks || resumeData.skills.tools) && (
          <div>
            <h2 style={{ fontSize: 11.5, fontFamily, fontWeight: 700, borderBottom: "1.5px solid #000", paddingBottom: 2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Skills</h2>
            <div style={{ fontSize: 11, fontFamily: "var(--font-body)", display: "flex", flexDirection: "column", gap: 8 }}>
              {resumeData.skills.languages && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "var(--text-secondary)" }}>Languages</div>
                  <div style={{ marginTop: 2 }}>{resumeData.skills.languages}</div>
                </div>
              )}
              {resumeData.skills.frameworks && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "var(--text-secondary)" }}>Frameworks</div>
                  <div style={{ marginTop: 2 }}>{resumeData.skills.frameworks}</div>
                </div>
              )}
              {resumeData.skills.tools && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 10, textTransform: "uppercase", color: "var(--text-secondary)" }}>Tools / Ops</div>
                  <div style={{ marginTop: 2 }}>{resumeData.skills.tools}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {resumeData.education.length > 0 && (
          <div>
            <h2 style={{ fontSize: 11.5, fontFamily, fontWeight: 700, borderBottom: "1.5px solid #000", paddingBottom: 2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Education</h2>
            {resumeData.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 8, fontSize: 11, fontFamily: "var(--font-body)" }}>
                <div style={{ fontWeight: 700 }}>{edu.school}</div>
                <div style={{ fontStyle: "italic", fontSize: 10, color: "#333" }}>{edu.degree}</div>
                <div style={{ fontWeight: 700, fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>{edu.year}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column - Main Content (68%) */}
      <div style={{ width: "68%", display: "flex", flexDirection: "column", gap: 18 }}>
        {resumeData.summary && (
          <section style={{ fontFamily: "var(--font-body)", fontSize: 12, textAlign: "justify", color: "#111", lineHeight: 1.6 }}>
            {resumeData.summary}
          </section>
        )}

        {resumeData.experience.length > 0 && (
          <section>
            <h2 style={{ fontSize: 12, fontFamily, fontWeight: 700, borderBottom: "1.5px solid #000", paddingBottom: 2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Work History</h2>
            {resumeData.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 10, fontSize: 11.5, fontFamily: "var(--font-body)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontWeight: 700, marginBottom: 4 }}>
                  <div>{exp.company} <span style={{ fontStyle: "italic", fontWeight: 400, color: "#333" }}>| {exp.title}</span></div>
                  <div style={{ fontSize: 10 }}>{exp.startDate} – {exp.endDate}</div>
                </div>
                <ul style={{ listStyle: "disc", paddingLeft: 16, margin: "2px 0 0", display: "flex", flexDirection: "column", gap: 2 }}>
                  {exp.description.split('\n').map((bullet, j) => bullet.trim() && (
                    <li key={j}>{bullet.replace(/^- /, '')}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {resumeData.projects.length > 0 && (
          <section>
            <h2 style={{ fontSize: 12, fontFamily, fontWeight: 700, borderBottom: "1.5px solid #000", paddingBottom: 2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Key Projects</h2>
            {resumeData.projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: 8, fontSize: 11.5, fontFamily: "var(--font-body)" }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>
                  {proj.name} <span style={{ fontWeight: 400, fontStyle: "italic", color: "#333" }}>| {proj.technologies}</span>
                </div>
                <ul style={{ listStyle: "disc", paddingLeft: 16, margin: "2px 0 0", display: "flex", flexDirection: "column", gap: 2 }}>
                  {proj.description.split('\n').map((bullet, j) => bullet.trim() && (
                    <li key={j}>{bullet.replace(/^- /, '')}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );

  const CreativeTemplate = () => (
    <div style={{ position: "relative", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {/* Visual Accent bar at the top */}
      <div style={{ height: 6, background: "var(--accent)", margin: "-48px -48px 24px -48px", width: "calc(100% + 96px)" }} />
      <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily, fontSize: resumeData.personal.name ? (layoutMode === 'compact' ? '1.5rem' : '1.8rem') : '1.3rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, textTransform: "uppercase" }}>
            {resumeData.personal.name || 'Your Name'}
          </h1>
          <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent)", marginTop: 4, letterSpacing: "0.05em" }}>
            CREATIVE TECHNOLOGIST / SPECIALIST
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11, fontFamily: "var(--font-body)", color: "var(--text-secondary)", textAlign: "right" }}>
          {resumeData.personal.email && <div>{resumeData.personal.email}</div>}
          {resumeData.personal.phone && <div>{resumeData.personal.phone}</div>}
          {resumeData.personal.linkedin && <div>{resumeData.personal.linkedin}</div>}
          {resumeData.personal.github && <div>{resumeData.personal.github}</div>}
        </div>
      </header>

      {resumeData.summary && (
        <section style={{ marginBottom: 16, padding: 12, background: "var(--accent-light)", borderLeft: "4px solid var(--accent)", fontSize: 12, lineHeight: 1.5, color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
          {resumeData.summary}
        </section>
      )}

      <div style={{ display: "flex", gap: 20, flex: 1 }}>
        {/* Left column (60%) */}
        <div style={{ width: "60%", display: "flex", flexDirection: "column", gap: 16 }}>
          {resumeData.experience.length > 0 && (
            <section>
              <h2 style={{ fontSize: 12, fontFamily, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, background: "var(--accent)", display: "inline-block" }}></span>
                Experience
              </h2>
              {resumeData.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: 10, fontSize: 11.5, fontFamily: "var(--font-body)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontWeight: 700, marginBottom: 2 }}>
                    <div>{exp.company} <span style={{ fontStyle: "italic", fontWeight: 400, color: "var(--text-secondary)" }}>| {exp.title}</span></div>
                    <div style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{exp.startDate} - {exp.endDate}</div>
                  </div>
                  <ul style={{ listStyle: "square", paddingLeft: 14, margin: "2px 0 0", display: "flex", flexDirection: "column", gap: 2 }}>
                    {exp.description.split('\n').map((bullet, j) => bullet.trim() && (
                      <li key={j}>{bullet.replace(/^- /, '')}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {resumeData.projects.length > 0 && (
            <section>
              <h2 style={{ fontSize: 12, fontFamily, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, background: "var(--accent)", display: "inline-block" }}></span>
                Featured Work
              </h2>
              {resumeData.projects.map((proj, i) => (
                <div key={i} style={{ marginBottom: 10, fontSize: 11.5, fontFamily: "var(--font-body)" }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>
                    {proj.name} <span style={{ fontWeight: 400, fontStyle: "italic", color: "var(--accent)" }}>({proj.technologies})</span>
                  </div>
                  <ul style={{ listStyle: "square", paddingLeft: 14, margin: "2px 0 0", display: "flex", flexDirection: "column", gap: 2 }}>
                    {proj.description.split('\n').map((bullet, j) => bullet.trim() && (
                      <li key={j}>{bullet.replace(/^- /, '')}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Right column (40%) */}
        <div style={{ width: "40%", display: "flex", flexDirection: "column", gap: 16 }}>
          {(resumeData.skills.languages || resumeData.skills.frameworks || resumeData.skills.tools) && (
            <section style={{ padding: 12, border: "2px solid #000", boxShadow: "3px 3px 0px #000", background: "#fff" }}>
              <h2 style={{ fontSize: 11.5, fontFamily, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-primary)", marginBottom: 8 }}>
                Skills Stack
              </h2>
              <div style={{ fontSize: 11, fontFamily: "var(--font-body)", display: "flex", flexDirection: "column", gap: 6 }}>
                {resumeData.skills.languages && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 9, textTransform: "uppercase", color: "var(--accent)" }}>Languages</div>
                    <div style={{ marginTop: 2 }}>{resumeData.skills.languages}</div>
                  </div>
                )}
                {resumeData.skills.frameworks && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 9, textTransform: "uppercase", color: "var(--accent)" }}>Frameworks</div>
                    <div style={{ marginTop: 2 }}>{resumeData.skills.frameworks}</div>
                  </div>
                )}
                {resumeData.skills.tools && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 9, textTransform: "uppercase", color: "var(--accent)" }}>Tools / Tech</div>
                    <div style={{ marginTop: 2 }}>{resumeData.skills.tools}</div>
                  </div>
                )}
              </div>
            </section>
          )}

          {resumeData.education.length > 0 && (
            <section>
              <h2 style={{ fontSize: 12, fontFamily, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, background: "var(--accent)", display: "inline-block" }}></span>
                Education
              </h2>
              {resumeData.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: 8, fontSize: 11, fontFamily: "var(--font-body)" }}>
                  <div style={{ fontWeight: 700 }}>{edu.school}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 10.5 }}>{edu.degree}</div>
                  <div style={{ fontWeight: 700, fontSize: 9.5, color: "var(--accent)", marginTop: 2 }}>{edu.year}</div>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );

  const AcademicTemplate = () => (
    <div style={{ fontFamily: 'Garamond, "Times New Roman", serif', padding: "0 10px" }}>
      <header style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: resumeData.personal.name ? '1.8rem' : '1.3rem', fontWeight: 400, color: '#000', margin: "0 0 6px", letterSpacing: "0.02em" }}>
          {resumeData.personal.name || 'Your Name'}
        </h1>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 12px", fontSize: 11.5, color: "#333", fontStyle: "italic" }}>
          {resumeData.personal.email && <span>Email: {resumeData.personal.email}</span>}
          {resumeData.personal.phone && <span>Phone: {resumeData.personal.phone}</span>}
          {resumeData.personal.linkedin && <span>LinkedIn: {resumeData.personal.linkedin}</span>}
          {resumeData.personal.github && <span>GitHub: {resumeData.personal.github}</span>}
        </div>
      </header>

      {resumeData.summary && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, borderBottom: "1px solid #333", paddingBottom: 2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Profile</h2>
          <p style={{ fontSize: 11.5, textAlign: "justify", lineHeight: 1.5, color: "#000", margin: 0 }}>
            {resumeData.summary}
          </p>
        </section>
      )}

      {resumeData.education.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, borderBottom: "1px solid #333", paddingBottom: 2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Education</h2>
          {resumeData.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: 11.5 }}>
              <div>
                <span style={{ fontWeight: 700 }}>{edu.school}</span>
                <span style={{ fontStyle: "italic" }}> — {edu.degree}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 10.5 }}>{edu.year}</div>
            </div>
          ))}
        </section>
      )}

      {resumeData.experience.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, borderBottom: "1px solid #333", paddingBottom: 2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Professional Experience</h2>
          {resumeData.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 10, fontSize: 11.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontWeight: 700, marginBottom: 3 }}>
                <div>{exp.company} <span style={{ fontWeight: 400, fontStyle: "italic" }}>| {exp.title}</span></div>
                <div style={{ fontSize: 10, fontWeight: 600 }}>{exp.startDate} – {exp.endDate}</div>
              </div>
              <ul style={{ listStyle: "circle", paddingLeft: 16, margin: "2px 0 0", display: "flex", flexDirection: "column", gap: 2 }}>
                {exp.description.split('\n').map((bullet, j) => bullet.trim() && (
                  <li key={j}>{bullet.replace(/^- /, '')}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {resumeData.projects.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, borderBottom: "1px solid #333", paddingBottom: 2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Projects & Publications</h2>
          {resumeData.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: 8, fontSize: 11.5 }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                {proj.name} <span style={{ fontWeight: 400, fontStyle: "italic" }}>— Stack: {proj.technologies}</span>
              </div>
              <ul style={{ listStyle: "circle", paddingLeft: 16, margin: "2px 0 0", display: "flex", flexDirection: "column", gap: 2 }}>
                {proj.description.split('\n').map((bullet, j) => bullet.trim() && (
                  <li key={j}>{bullet.replace(/^- /, '')}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {(resumeData.skills.languages || resumeData.skills.frameworks || resumeData.skills.tools) && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, borderBottom: "1px solid #333", paddingBottom: 2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Publications & Expertise</h2>
          <div style={{ fontSize: 11.5, display: "flex", flexDirection: "column", gap: 3 }}>
            {resumeData.skills.languages && <div><span style={{ fontWeight: 700 }}>Languages & Data:</span> {resumeData.skills.languages}</div>}
            {resumeData.skills.frameworks && <div><span style={{ fontWeight: 700 }}>Frameworks & Frameworks:</span> {resumeData.skills.frameworks}</div>}
            {resumeData.skills.tools && <div><span style={{ fontWeight: 700 }}>Research Tools & Environments:</span> {resumeData.skills.tools}</div>}
          </div>
        </section>
      )}
    </div>
  );

  const StartupTemplate = () => (
    <div style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <header style={{ marginBottom: 16 }}>
        <div style={{ display: "inline-block", background: "var(--text-primary)", color: "#fff", padding: "3px 8px", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          FAST-TRACK RESUME
        </div>
        <h1 style={{ fontSize: resumeData.personal.name ? (layoutMode === 'compact' ? '1.5rem' : '1.75rem') : '1.3rem', fontWeight: 900, color: '#000', margin: "0 0 4px", letterSpacing: "-0.02em" }}>
          {resumeData.personal.name || 'Your Name'}
        </h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
          {resumeData.personal.email && <span>{resumeData.personal.email}</span>}
          {resumeData.personal.phone && <span>· {resumeData.personal.phone}</span>}
          {resumeData.personal.linkedin && <span>· in/{resumeData.personal.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</span>}
          {resumeData.personal.github && <span>· gh/{resumeData.personal.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</span>}
        </div>
      </header>

      {/* Top Skills Row */}
      {(resumeData.skills.languages || resumeData.skills.frameworks || resumeData.skills.tools) && (
        <section style={{ marginBottom: 14, background: "var(--bg-elevated)", border: "1px solid var(--border-muted)", padding: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 10.5, fontFamily: "var(--font-mono)" }}>
            {resumeData.skills.languages && <div><span style={{ fontWeight: 700 }}>LANGS:</span> {resumeData.skills.languages}</div>}
            {resumeData.skills.frameworks && <div><span style={{ fontWeight: 700 }}>STACK:</span> {resumeData.skills.frameworks}</div>}
            {resumeData.skills.tools && <div><span style={{ fontWeight: 700 }}>OPS:</span> {resumeData.skills.tools}</div>}
          </div>
        </section>
      )}

      {resumeData.summary && (
        <section style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11.5, color: "#111", lineHeight: 1.5, margin: 0 }}>
            {resumeData.summary}
          </p>
        </section>
      )}

      {resumeData.experience.length > 0 && (
        <section style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent-dark)", borderBottom: "1px solid var(--border-muted)", paddingBottom: 3, marginBottom: 6 }}>Employment</h2>
          {resumeData.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 8, fontSize: 11.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontWeight: 700, marginBottom: 2 }}>
                <div>
                  <span style={{ color: "#000", fontWeight: 800 }}>{exp.company}</span>
                  <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}> — {exp.title}</span>
                </div>
                <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 500 }}>{exp.startDate} - {exp.endDate}</div>
              </div>
              <ul style={{ listStyle: "none", paddingLeft: 0, margin: "2px 0 0", display: "flex", flexDirection: "column", gap: 2 }}>
                {exp.description.split('\n').map((bullet, j) => bullet.trim() && (
                  <li key={j} style={{ display: "flex", gap: 6 }}>
                    <span style={{ color: "var(--accent)" }}>❯</span>
                    <span>{bullet.replace(/^- /, '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {resumeData.projects.length > 0 && (
        <section style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent-dark)", borderBottom: "1px solid var(--border-muted)", paddingBottom: 3, marginBottom: 6 }}>Tech Projects</h2>
          {resumeData.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: 8, fontSize: 11.5 }}>
              <div style={{ fontWeight: 800, color: "#000", marginBottom: 2, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span>{proj.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", fontWeight: 500 }}>{proj.technologies}</span>
              </div>
              <ul style={{ listStyle: "none", paddingLeft: 0, margin: "2px 0 0", display: "flex", flexDirection: "column", gap: 2 }}>
                {proj.description.split('\n').map((bullet, j) => bullet.trim() && (
                  <li key={j} style={{ display: "flex", gap: 6 }}>
                    <span style={{ color: "var(--accent)" }}>❯</span>
                    <span>{bullet.replace(/^- /, '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {resumeData.education.length > 0 && (
        <section style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent-dark)", borderBottom: "1px solid var(--border-muted)", paddingBottom: 3, marginBottom: 6 }}>Education</h2>
          {resumeData.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 11.5 }}>
              <div>
                <span style={{ fontWeight: 700, color: "#000" }}>{edu.school}</span>
                <span style={{ color: "var(--text-secondary)" }}> / {edu.degree}</span>
              </div>
              <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 500 }}>
                {edu.year}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );

  // ── End of Template Rendering Code ───────────────────────────────────

  return (
    <div className="resume-builder-layout">
      {/* Editor Pane (Hidden when printing) */}
      <div className="resume-builder-editor print:hidden">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid var(--border-muted)", paddingBottom: 16 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)", color: "var(--text-primary)" }}>Resume Builder</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <select
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              className="input-field"
              style={{ width: "auto", padding: "6px 12px", fontSize: 12, height: "auto", cursor: "pointer" }}
              title="Resume template style layout"
            >
              {TEMPLATES_LIST.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select
              value={fontFamily}
              onChange={e => setFontFamily(e.target.value)}
              className="input-field"
              style={{ width: "auto", padding: "6px 12px", fontSize: 12, height: "auto", cursor: "pointer" }}
              title="Resume font"
            >
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select
              value={layoutMode}
              onChange={e => setLayoutMode(e.target.value)}
              className="input-field"
              style={{ width: "auto", padding: "6px 12px", fontSize: 12, height: "auto", cursor: "pointer" }}
              title="Resume density"
            >
              {LAYOUTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer", height: "auto", display: "inline-flex", alignItems: "center", margin: 0 }}>
              Parse PDF
              <input type="file" accept=".pdf" style={{ display: "none" }} onChange={handleParsePdf} />
            </label>
            <button onClick={handleNormalizeAll} className="btn btn-secondary btn-sm" style={{ height: "auto", display: "inline-flex", alignItems: "center", margin: 0, gap: 4 }} title="Automatically format and clean up casing, bullets, tech stack tags, dates, and links">
              ✨ Auto-Format
            </button>
            <button onClick={() => saveResume(false)} disabled={saveStatus === 'saving'} className="btn btn-secondary btn-sm" style={{ height: "auto" }}>
              {saveStatus === 'saving' ? "Saving..." : "Save"}
            </button>
            <button onClick={handleAnalyzeBuilder} disabled={analyzingBuilder} className="btn btn-secondary btn-sm" style={{ height: "auto" }}>
              {analyzingBuilder ? "Analyzing..." : "Analyze Builder"}
            </button>
            <button onClick={handlePrint} className="btn btn-primary btn-sm" style={{ height: "auto" }}>
              Export PDF
            </button>
          </div>
        </div>

        {/* Simplified Status Bar */}
        <div className="card" style={{ padding: "12px 18px", marginBottom: 20, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 16, fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-secondary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>COMPLETION:</span>
              <div style={{ width: 60, height: 6, background: "var(--bg-elevated)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${completionScore}%`, background: completionScore > 80 ? "var(--color-success)" : "var(--accent)" }} />
              </div>
              <strong style={{ color: "var(--text-primary)" }}>{completionScore}%</strong>
            </div>
            <div style={{
              color: saveStatus === 'error' ? 'var(--color-error)' : saveStatus === 'dirty' ? 'var(--color-warning)' : 'var(--color-success)',
            }}>
              ● {saveStatus === 'dirty' && 'Unsaved changes'}
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && `Saved`}
              {saveStatus === 'error' && 'Save failed'}
              {saveStatus === 'idle' && 'Ready'}
            </div>
          </div>
          {builderAnalysis && (
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", cursor: "pointer" }} onClick={() => setActiveTab('analysis')}>
              ATS Score: {builderAnalysis.atsScore}/100 →
            </div>
          )}
        </div>

        {/* Section Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 8 }}>
          {['personal', 'summary', 'experience', 'education', 'projects', 'skills', 'analysis'].map(tab => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                id={`builder-tab-${tab}`}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "var(--border-brutal)",
                  background: active ? (tab === 'analysis' ? "var(--text-primary)" : "var(--accent)") : "#fff",
                  color: active ? "#fff" : (tab === 'analysis' ? "var(--accent)" : "var(--text-secondary)"),
                  fontFamily: "var(--font-display)",
                  fontSize: 11, fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: active ? "2px 2px 0 var(--text-primary)" : "none",
                  transform: active ? "translate(-1px, -1px)" : "none",
                  transition: "all var(--transition-fast)",
                  textTransform: "uppercase"
                }}
              >
                {tab === 'analysis' ? '✨ Review & Analyze' : tab}
              </button>
            );
          })}
        </div>

        {/* Editor Forms */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {activeTab === 'analysis' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", gap: 8 }} className="quick-actions-row">
                <input
                  className="input-field"
                  style={{ flex: 1, padding: "8px 12px", fontSize: 12, height: "auto" }}
                  value={analysisJd}
                  onChange={e => setAnalysisJd(e.target.value)}
                  placeholder="Target job description for specialized AI builder analysis..."
                />
              </div>

              {builderAnalysis && (
                <div className="card-surface" style={{ padding: 18, border: "var(--border-brutal)", background: "var(--bg-surface)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: "1px dashed var(--border-muted)", paddingBottom: 8 }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, color: "var(--accent)" }}>🔍 AI Analysis & Rewrites</h3>
                    <div style={{ display: "flex", gap: 12, fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700 }}>
                      <span style={{ color: "var(--text-secondary)" }}>ATS SCORE: <strong style={{ color: "var(--text-primary)" }}>{builderAnalysis.atsScore}/100</strong></span>
                      <span style={{ color: "var(--text-secondary)" }}>DELTA: <strong style={{ color: builderAnalysis.scoreDiff > 0 ? "var(--color-success)" : builderAnalysis.scoreDiff < 0 ? "var(--color-error)" : "var(--text-primary)" }}>
                        {builderAnalysis.scoreDiff > 0 ? `+${builderAnalysis.scoreDiff}` : builderAnalysis.scoreDiff}
                      </strong></span>
                    </div>
                  </div>
                  
                  {builderAnalysis.verdict && <p style={{ fontSize: 12.5, color: "var(--text-primary)", lineHeight: 1.6, marginBottom: 14 }}>{builderAnalysis.verdict}</p>}
                  
                  {builderAnalysis.topFixes && builderAnalysis.topFixes.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <h4 style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", fontSize: 9, letterSpacing: "0.08em" }}>Top Suggested Fixes</h4>
                      {builderAnalysis.topFixes.map((fix, idx) => (
                        <div key={idx} className="card" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, background: "#fff" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span className="badge badge-blue" style={{ fontSize: 9, padding: "2px 6px" }}>{fix.category.replace('_', ' ')}</span>
                            <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>Priority {fix.priority}</span>
                          </div>
                          {fix.original && (
                            <div style={{ display: "flex", gap: 8 }}>
                              <span style={{ color: "var(--color-error)", fontWeight: 800 }}>-</span>
                              <span style={{ color: "var(--text-muted)", textDecoration: "line-through", fontSize: 12 }}>{fix.original}</span>
                            </div>
                          )}
                          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <span style={{ color: "var(--color-success)", fontWeight: 800 }}>+</span>
                            <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 12 }}>{fix.fix}</span>
                          </div>
                          
                          {fix.original && (
                            <button 
                              onClick={() => applyMaxRewrite(fix)}
                              className="btn btn-secondary btn-sm"
                              style={{ alignSelf: "flex-end", marginTop: 4, fontSize: 9, padding: "3px 10px", height: "auto" }}
                            >
                              1-Click Apply ⚡
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {builderAnalysis.suggestions.map((sug, idx) => (
                        <p key={idx} style={{ fontSize: 12, color: "var(--text-secondary)" }}>- {sug}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ATS Bullet Checker */}
              {allBullets.length > 0 && (
                <div className="card" style={{ padding: 18, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, color: "var(--text-primary)" }}>ATS Bullet Quality</h3>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>
                      Goal: Action Verb + Metric Result
                    </span>
                  </div>
                  {weakBullets.length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--color-success)", fontWeight: 700 }}>✓ Outstanding! All bullet points are impact-oriented and contain metrics.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 180, overflowY: "auto" }}>
                      {weakBullets.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="card-surface" style={{ padding: 12, border: "var(--border-brutal)", background: "var(--bg-surface)" }}>
                          <p style={{ fontSize: 12.5, color: "var(--text-primary)", lineHeight: 1.5 }}>"{item.line}"</p>
                          <p style={{ fontSize: 10, color: "var(--accent-dark)", fontWeight: 700, marginTop: 6, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                            {!item.hasActionVerb ? "⚠️ Missing Action Verb. " : ""}
                            {!item.hasMetric ? "⚠️ Missing Measurable Impact (%, $, numbers)." : ""}
                          </p>
                          <button
                            onClick={() => handleAiRewriteWeakBullet(item)}
                            disabled={rewritingKey === item.key}
                            className="btn btn-secondary btn-sm"
                            style={{ marginTop: 8, fontSize: 9, padding: "3px 8px", height: "auto" }}
                          >
                            {rewritingKey === item.key ? 'Rewriting...' : 'AI Rewrite →'}
                          </button>
                        </div>
                      ))}
                      {weakBullets.length > 4 && (
                        <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700, textAlign: "right" }}>
                          +{weakBullets.length - 4} more weak bullets
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Section Scores */}
              <div className="card" style={{ padding: 18, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, color: "var(--text-primary)" }}>Section ATS Scores</h3>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>Target 80+ per section</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }} className="section-scores-grid">
                  {Object.entries(sectionScores).map(([key, value]) => {
                    const valColor = value.score >= 80 ? "var(--color-success)" : value.score >= 60 ? "var(--accent)" : "var(--color-error)";
                    const valBg = value.score >= 80 ? "rgba(22,163,74,0.06)" : value.score >= 60 ? "var(--accent-glow)" : "rgba(220,38,38,0.06)";
                    return (
                      <div key={key} className="card-surface" style={{ padding: 10, textAlign: "center", border: "var(--border-brutal)", background: valBg }}>
                        <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase" }}>{key}</p>
                        <p style={{ fontSize: 20, fontWeight: 900, color: valColor, fontFamily: "var(--font-serif)", fontStyle: "italic", marginTop: 4 }}>{value.score}</p>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(sectionScores).map(([key, value]) => (
                    <div key={`hint-${key}`} className="card" style={{ padding: 12, background: "#fff" }}>
                      <p style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase", marginBottom: 4 }}>{key} Hints</p>
                      {value.hints.length ? (
                        <ul style={{ paddingLeft: 14, fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.5, listStyle: "square" }}>
                          {value.hints.map((hint, idx) => <li key={idx} style={{ marginBottom: 2 }}>{hint}</li>)}
                        </ul>
                      ) : (
                        <p style={{ fontSize: 11, color: "var(--color-success)", fontWeight: 700 }}>✓ Perfect! Section is fully optimized.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Score History Trend */}
              <div className="card" style={{ padding: 18, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, color: "var(--text-primary)" }}>Section Score Trend</h3>
                  <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>Last {Math.min(sectionScoreHistory.length, 12)} saves</span>
                </div>
                {sectionScoreHistory.length < 2 ? (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>Save a few times to track score changes over iterations.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 150, overflowY: "auto" }}>
                    {sectionScoreHistory.map((snap, idx) => {
                      const prev = sectionScoreHistory[idx + 1];
                      const delta = (field) => (prev ? snap[field] - prev[field] : 0);
                      const deltaLabel = (d) => (d > 0 ? `+${d}` : `${d}`);
                      return (
                        <div key={snap.ts} className="card-surface" style={{ padding: 10, fontSize: 11, fontFamily: "var(--font-mono)", background: "#fff", border: "var(--border-brutal)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontWeight: 800, color: "var(--text-primary)" }}>
                            <span>SAVE #{sectionScoreHistory.length - idx}</span>
                            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{new Date(snap.ts).toLocaleTimeString()}</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                            {['summary', 'experience', 'projects', 'skills'].map((field) => {
                              const d = delta(field);
                              const cl = d > 0 ? 'var(--color-success)' : d < 0 ? 'var(--color-error)' : 'var(--text-secondary)';
                              return (
                                <span key={`${snap.ts}-${field}`} style={{ color: cl, fontWeight: 700, fontSize: 9.5 }}>
                                  {field.charAt(0).toUpperCase() + field.slice(1, 3)}: {snap[field]} ({deltaLabel(d)})
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
            </div>
          )}
          {activeTab === 'personal' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label className="input-label" style={{ fontSize: 10, marginBottom: 4 }}>Full Name</label><input className="input-field" value={resumeData.personal.name} onChange={e => updatePersonal('name', e.target.value)} /></div>
              <div><label className="input-label" style={{ fontSize: 10, marginBottom: 4 }}>Email</label><input className="input-field" value={resumeData.personal.email} onChange={e => updatePersonal('email', e.target.value)} /></div>
              <div><label className="input-label" style={{ fontSize: 10, marginBottom: 4 }}>Phone</label><input className="input-field" value={resumeData.personal.phone} onChange={e => updatePersonal('phone', e.target.value)} /></div>
              <div><label className="input-label" style={{ fontSize: 10, marginBottom: 4 }}>LinkedIn URL</label><input className="input-field" value={resumeData.personal.linkedin} onChange={e => updatePersonal('linkedin', e.target.value)} /></div>
              <div><label className="input-label" style={{ fontSize: 10, marginBottom: 4 }}>GitHub URL</label><input className="input-field" value={resumeData.personal.github} onChange={e => updatePersonal('github', e.target.value)} /></div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <label className="input-label" style={{ fontSize: 10, marginBottom: 4 }}>Professional Summary</label>
              <textarea className="input-field" style={{ height: 120, resize: "vertical" }} value={resumeData.summary} onChange={e => { setResumeData({...resumeData, summary: e.target.value}); setSaveStatus('dirty'); }} />
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono)" }}>Tip: Keep this between 50-90 words and role-specific.</p>
            </div>
          )}

          {activeTab === 'experience' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {resumeData.experience.map((exp, i) => (
                <div key={i} className="card" style={{ padding: 18, position: "relative", background: "#fff" }}>
                  <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 10, fontSize: 11, fontFamily: "var(--font-mono)" }}>
                    <button onClick={() => moveArrayItem('experience', i, -1)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "var(--text-secondary)" }}>[↑]</button>
                    <button onClick={() => moveArrayItem('experience', i, 1)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "var(--text-secondary)" }}>[↓]</button>
                    <button onClick={() => removeArrayItem('experience', i)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "var(--color-error)" }}>[Remove]</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                    <input className="input-field" style={{ fontWeight: 700 }} placeholder="Company Name (e.g. Google)" value={exp.company} onChange={e => updateArrayItem('experience', i, 'company', e.target.value)} />
                    <input className="input-field" placeholder="Job Title (e.g. Frontend Engineer)" value={exp.title} onChange={e => updateArrayItem('experience', i, 'title', e.target.value)} />
                    <div style={{ display: "flex", gap: 10 }}>
                      <input className="input-field" style={{ width: "50%" }} placeholder="Start Date (e.g. Jan 2020)" value={exp.startDate} onChange={e => updateArrayItem('experience', i, 'startDate', e.target.value)} />
                      <input className="input-field" style={{ width: "50%" }} placeholder="End Date (e.g. Present)" value={exp.endDate} onChange={e => updateArrayItem('experience', i, 'endDate', e.target.value)} />
                    </div>
                    <textarea className="input-field" style={{ height: 100, resize: "vertical" }} placeholder="Description (one bullet per line starting with a dash)" value={exp.description} onChange={e => updateArrayItem('experience', i, 'description', e.target.value)} />
                  </div>
                </div>
              ))}
              <button onClick={() => addArrayItem('experience', { company: '', title: '', startDate: '', endDate: '', description: '' })} className="btn btn-secondary" style={{ borderStyle: "dashed", width: "100%", justifyContent: "center" }}>
                + Add Experience
              </button>
            </div>
          )}

          {activeTab === 'education' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {resumeData.education.map((edu, i) => (
                <div key={i} className="card" style={{ padding: 18, position: "relative", background: "#fff" }}>
                  <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 10, fontSize: 11, fontFamily: "var(--font-mono)" }}>
                    <button onClick={() => moveArrayItem('education', i, -1)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "var(--text-secondary)" }}>[↑]</button>
                    <button onClick={() => moveArrayItem('education', i, 1)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "var(--text-secondary)" }}>[↓]</button>
                    <button onClick={() => removeArrayItem('education', i)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "var(--color-error)" }}>[Remove]</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                    <input className="input-field" style={{ fontWeight: 700 }} placeholder="School / University" value={edu.school} onChange={e => updateArrayItem('education', i, 'school', e.target.value)} />
                    <input className="input-field" placeholder="Degree (e.g. B.S. Computer Science)" value={edu.degree} onChange={e => updateArrayItem('education', i, 'degree', e.target.value)} />
                    <input className="input-field" placeholder="Graduation Year (e.g. 2024)" value={edu.year} onChange={e => updateArrayItem('education', i, 'year', e.target.value)} />
                  </div>
                </div>
              ))}
              <button onClick={() => addArrayItem('education', { school: '', degree: '', year: '' })} className="btn btn-secondary" style={{ borderStyle: "dashed", width: "100%", justifyContent: "center" }}>
                + Add Education
              </button>
            </div>
          )}

          {activeTab === 'projects' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {resumeData.projects.map((proj, i) => (
                <div key={i} className="card" style={{ padding: 18, position: "relative", background: "#fff" }}>
                  <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 10, fontSize: 11, fontFamily: "var(--font-mono)" }}>
                    <button onClick={() => moveArrayItem('projects', i, -1)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "var(--text-secondary)" }}>[↑]</button>
                    <button onClick={() => moveArrayItem('projects', i, 1)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "var(--text-secondary)" }}>[↓]</button>
                    <button onClick={() => removeArrayItem('projects', i)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "var(--color-error)" }}>[Remove]</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                    <input className="input-field" style={{ fontWeight: 700 }} placeholder="Project Name" value={proj.name} onChange={e => updateArrayItem('projects', i, 'name', e.target.value)} />
                    <input className="input-field" placeholder="Technologies Used (e.g. React, Firebase, Python)" value={proj.technologies} onChange={e => updateArrayItem('projects', i, 'technologies', e.target.value)} />
                    <textarea className="input-field" style={{ height: 100, resize: "vertical" }} placeholder="Description (one bullet per line starting with a dash)" value={proj.description} onChange={e => updateArrayItem('projects', i, 'description', e.target.value)} />
                  </div>
                </div>
              ))}
              <button onClick={() => addArrayItem('projects', { name: '', technologies: '', description: '' })} className="btn btn-secondary" style={{ borderStyle: "dashed", width: "100%", justifyContent: "center" }}>
                + Add Project
              </button>
            </div>
          )}

          {activeTab === 'skills' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div><label className="input-label" style={{ fontSize: 10, marginBottom: 4 }}>Languages</label><input className="input-field" placeholder="e.g. Python, Java, JavaScript, SQL" value={resumeData.skills.languages} onChange={updateSkills.bind(null, 'languages')} /></div>
              <div><label className="input-label" style={{ fontSize: 10, marginBottom: 4 }}>Frameworks</label><input className="input-field" placeholder="e.g. React, Node.js, Django, Tailwind" value={resumeData.skills.frameworks} onChange={updateSkills.bind(null, 'frameworks')} /></div>
              <div><label className="input-label" style={{ fontSize: 10, marginBottom: 4 }}>Tools / Other</label><input className="input-field" placeholder="e.g. Git, Docker, Kubernetes, AWS" value={resumeData.skills.tools} onChange={updateSkills.bind(null, 'tools')} /></div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Pane (Becomes full width/height when printing) */}
      <div className="resume-builder-preview grid-lines">
        {/* A4 Sheet Simulation */}
        <div
          className={`bg-white text-black print-resume-container print:shadow-none print:m-0 print:p-0 ${layoutMode === 'compact' ? 'p-8' : 'p-12'}`}
          style={{ 
            fontFamily, 
            lineHeight: layoutMode === 'compact' ? 1.4 : 1.6,
            width: "210mm",
            minHeight: "297mm",
            border: "var(--border-brutal-thick)",
            boxShadow: "var(--shadow-brutal-xl)",
            borderRadius: "0px"
          }}
        >
          {templateId === 'modern' ? (
            <ModernTemplate />
          ) : templateId === 'minimal' ? (
            <MinimalTemplate />
          ) : templateId === 'executive' ? (
            <ExecutiveTemplate />
          ) : templateId === 'creative' ? (
            <CreativeTemplate />
          ) : templateId === 'academic' ? (
            <AcademicTemplate />
          ) : templateId === 'startup' ? (
            <StartupTemplate />
          ) : (
            <ClassicTemplate />
          )}
        </div>
      </div>
      
      <style>{`
        .resume-builder-layout {
          display: flex;
          flex-direction: row;
          height: calc(100vh - 52px);
          background: var(--bg-surface);
          overflow: hidden;
        }
        .resume-builder-editor {
          width: 50%;
          padding: 24px;
          overflow-y: auto;
          border-right: var(--border-brutal);
          background: var(--bg-surface);
          max-height: 100%;
        }
        .resume-builder-preview {
          width: 50%;
          overflow-y: auto;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          background: var(--bg-elevated);
          padding: 32px 16px;
          max-height: 100%;
        }
        
        /* Disable wobbly hover transitions/animations for inputs/details cards to preserve focus */
        .resume-builder-editor .card:hover,
        .resume-builder-editor .card-premium:hover,
        .resume-builder-editor .card-surface:hover {
          transform: none !important;
          box-shadow: var(--shadow-brutal) !important;
        }
        
        @media (max-width: 1024px) {
          .resume-builder-layout {
            flex-direction: column;
            height: auto;
            overflow: visible;
          }
          .resume-builder-editor {
            width: 100%;
            border-right: none;
            border-bottom: var(--border-brutal);
            max-height: none;
          }
          .resume-builder-preview {
            width: 100%;
            padding: 24px 12px;
            max-height: none;
          }
        }
        
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .resume-builder-layout {
            display: block;
            height: auto;
            background: #fff;
            overflow: visible;
          }
          .resume-builder-editor {
            display: none !important;
          }
          .resume-builder-preview {
            width: 100% !important;
            display: block;
            background: #fff !important;
            padding: 0 !important;
            overflow: visible;
          }
          .print-resume-container {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: auto !important;
          }
        }
        @media (max-width: 900px) {
          .section-scores-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .section-scores-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
