import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const CATEGORIES = [
  { id: "dsa", label: "DSA", color: "#d97706", resources: [
    { name: "Striver A2Z",    desc: "Industry-standard A2Z roadmap for SDE roles",                  url: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/", tag: "450+ problems" },
    { name: "NeetCode 150",   desc: "Most important LeetCode patterns for FAANG",                   url: "https://neetcode.io/practice", tag: "150 curated" },
    { name: "Love Babbar 450",desc: "Popular DSA sheet cracked by thousands",                       url: "https://450dsa.com", tag: "450 problems" },
    { name: "Blind 75",       desc: "The original 75 must-do LeetCode problems",                    url: "https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions", tag: "75 problems" },
    { name: "LeetCode Top Easy", desc: "LeetCode's curation of most frequent entry level interview questions", url: "https://leetcode.com/explore/interview/card/top-interview-questions-easy/", tag: "Top 100+" },
    { name: "Google Tech Dev",   desc: "Google's official curriculum recommendations for software growth", url: "https://techdevguide.withgoogle.com/", tag: "Google Recommended" }
  ]},
  { id: "system_design", label: "System Design", color: "#0284c7", resources: [
    { name: "ByteByteGo",         desc: "Alex Xu's system design newsletter & books",              url: "https://bytebytego.com", tag: "Best for FAANG" },
    { name: "Gaurav Sen YT",      desc: "Best free system design YouTube series",                  url: "https://www.youtube.com/c/GauravSensei", tag: "Free Video Guide" },
    { name: "System Design Primer",desc: "GitHub's most starred system design guide",              url: "https://github.com/donnemartin/system-design-primer", tag: "250k ⭐" },
    { name: "Designing Data-Intensive Applications", desc: "Martin Kleppmann's database internals bible", url: "https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/", tag: "Must-read Book" },
    { name: "High Scalability",   desc: "Real architecture case studies from Netflix, StackOverflow, and YouTube", url: "http://highscalability.com/", tag: "Tech Blog" }
  ]},
  { id: "cs", label: "CS Fundamentals", color: "#7c3aed", resources: [
    { name: "Love Babbar CS Notes", desc: "DBMS, OS, CN all-in-one notes for interviews",         url: "https://drive.google.com/drive/folders/1ZgHXxJO6s-UBSbT5aJHhHBX5mGl_JkZH", tag: "DBMS+OS+CN" },
    { name: "InterviewBit CS",      desc: "Structured CS theory with interview questions",         url: "https://www.interviewbit.com/courses/programming/", tag: "Topic-wise" },
    { name: "GFG OS Notes",         desc: "GeeksforGeeks OS for interviews",                      url: "https://www.geeksforgeeks.org/operating-systems/", tag: "OS Notes" },
    { name: "SQL Zoo",              desc: "Interactive SQL queries tutorial to master relational DBs", url: "https://sqlzoo.net/", tag: "SQL Interactive" },
    { name: "OS: Three Easy Pieces", desc: "The definitive open-source university textbook on modern OS internals", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/", tag: "Free Book" }
  ]},
  { id: "behavioral", label: "Behavioral", color: "#b45309", resources: [
    { name: "Amazon LP Guide",       desc: "All 16 Leadership Principles with STAR stories",       url: "https://www.amazon.jobs/en/principles", tag: "Amazon" },
    { name: "STAR Method Bank",      desc: "Template + 50 example behavioral answers",             url: "https://www.themuse.com/advice/star-interview-method", tag: "Framework" },
    { name: "Tech Interview Handbook",desc: "Yangshun's comprehensive behavioral guide",           url: "https://www.techinterviewhandbook.org/behavioral-interview/", tag: "Free Manual" },
    { name: "Behavioral Questions Guide", desc: "Curated lists of questions and answer templates by tech company", url: "https://techinterviewhandbook.org/behavioral-questions/", tag: "Company Specific" }
  ]},
  { id: "projects", label: "Projects & Dev", color: "#db2777", resources: [
    { name: "Roadmap.sh",       desc: "Curated learning paths for every dev role",                 url: "https://roadmap.sh", tag: "Interactive Map" },
    { name: "Build Your Own X", desc: "Build real versions of complex tools from scratch",         url: "https://github.com/codecrafters-io/build-your-own-x", tag: "GitHub Code" },
    { name: "DevChallenges",    desc: "Real-world project challenges with designs",                url: "https://devchallenges.io", tag: "Fullstack Projects" },
    { name: "Full Stack Open",  desc: "University of Helsinki's legendary React/Node deep-dive",  url: "https://fullstackopen.com/", tag: "University Course" },
    { name: "App Ideas Collection", desc: "Specs, user stories, and templates categorized by difficulty", url: "https://github.com/florinpop17/app-ideas", tag: "Project Ideas" }
  ]},
  { id: "mock", label: "Mock Interviews", color: "#16a34a", resources: [
    { name: "Pramp",            desc: "Free peer-to-peer mock technical interviews",               url: "https://www.pramp.com", tag: "Free Peer Mocks" },
    { name: "Interviewing.io",  desc: "Anonymous mock interviews with FAANG engineers",            url: "https://interviewing.io", tag: "FAANG Engineers" },
    { name: "LeetCode Mock",    desc: "Company-specific timed mock contests",                      url: "https://leetcode.com/assessment/", tag: "Timed Assessment" },
    { name: "Exponent",         desc: "Detailed video logs and mocks for SDE and PM prep",        url: "https://www.tryexponent.com/", tag: "Exponent Platform" }
  ]},
];

export default function ResourcesPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState("dsa");
  const cat = CATEGORIES.find(c => c.id === active);

  return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh" }} className="grid-lines">
      <Navbar />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "64px 24px 96px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <div className="section-label sr"><span className="section-label-text">Career Resources</span></div>
          <h1 className="text-display" style={{ marginBottom: 16 }}>
            Resource <span className="highlight-accent rotate-left-1" style={{ display: "inline-block", color: "#fff", fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: "600" }}>Hub</span>.
          </h1>
          <p className="sr" style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.75, maxWidth: 520 }}>
            Curated, battle-tested resources used by engineers who cracked FAANG.
          </p>
        </div>

        {/* Category Tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              id={`resource-tab-${c.id}`}
              style={{
                padding: "8px 18px",
                borderRadius: "var(--radius-sm)",
                border: "var(--border-brutal)",
                background: active === c.id ? c.color : "#fff",
                color: active === c.id ? "#fff" : "var(--text-secondary)",
                fontFamily: "var(--font-display)",
                fontSize: 13, fontWeight: 700,
                cursor: "pointer",
                boxShadow: active === c.id ? "2px 2px 0px var(--text-primary)" : "none",
                transform: active === c.id ? "translate(-1px, -1px)" : "none",
                transition: "all var(--transition-fast)",
              }}
            >{c.label}</button>
          ))}
        </div>

        {/* Resources grid */}
        {cat && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }} id="resources-grid">
            {cat.resources.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card"
                style={{
                  padding: "22px 24px",
                  textDecoration: "none",
                  display: "flex", flexDirection: "column", gap: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3 style={{
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15,
                    color: "var(--text-primary)",
                  }}>{r.name}</h3>
                  <span style={{ fontSize: 16, color: "var(--text-muted)", flexShrink: 0, marginLeft: 8 }}>↗</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>{r.desc}</p>
                <span style={{
                  alignSelf: "flex-start",
                  padding: "3px 10px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--accent-light)",
                  border: "var(--border-brutal)",
                  boxShadow: "1px 1px 0 var(--text-primary)",
                  fontSize: 11, fontWeight: 700,
                }}>{r.tag}</span>
              </a>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 60 }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate("/signup")}
            id="resources-cta-btn"
          >
            Start Your Journey →
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          #resources-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
