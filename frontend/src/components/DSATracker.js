import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE, getAuthToken } from "../utils";
import { DAILY_TARGET, DSA_CATALOG } from "../data/dsaCatalog";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function toUtcDateKey(date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildContributionWeeks(calendar) {
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - 83);

  const days = [];
  for (let index = 0; index < 84; index += 1) {
    const current = new Date(start);
    current.setUTCDate(start.getUTCDate() + index);
    const key = toUtcDateKey(current);
    days.push({
      key,
      count: calendar[key] || 0,
      label: current.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    });
  }

  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

function getRecommendedTopicIds(roadmap) {
  if (!roadmap || !roadmap.phases || roadmap.phases.length === 0) {
    return new Set();
  }

  const roadmapText = roadmap.phases
    .map((phase) => `${phase.title || ""} ${phase.focus || ""} ${phase.description || ""} ${phase.resource_type || ""}`)
    .join(" ")
    .toLowerCase();

  const recommended = new Set();
  DSA_CATALOG.forEach((topic) => {
    if (topic.keywords.some((keyword) => roadmapText.includes(keyword))) {
      recommended.add(topic.id);
    }
  });

  return recommended;
}

function getDifficultyClass(difficulty) {
  if (difficulty === "Easy") return "text-green-500 border-green-500/40";
  if (difficulty === "Medium") return "text-yellow-500 border-yellow-500/40";
  return "text-red-500 border-red-500/40";
}

function getContributionClass(count) {
  if (count >= 3) return "bg-primary border-primary";
  if (count === 2) return "bg-primary/70 border-primary/70";
  if (count === 1) return "bg-primary/40 border-primary/40";
  return "bg-background border-border";
}

export default function DSATracker({ roadmap = null }) {
  const [progress, setProgress] = useState({});
  const [calendar, setCalendar] = useState({});
  const [stats, setStats] = useState({ completed_total: 0, today_completed: 0, current_streak: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState({
    "arrays-hashing": true,
    trees: true,
  });

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const res = await axios.get(`${API_BASE}/dsa/progress`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setProgress(res.data.progress || {});
      setCalendar(res.data.calendar || {});
      setStats(res.data.stats || { completed_total: 0, today_completed: 0, current_streak: 0 });
    } catch (err) {
      console.error("Failed to load DSA progress", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleProblem = async (problemId, platform, currentStatus) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";

    setProgress((prev) => ({ ...prev, [problemId]: newStatus }));

    try {
      await axios.post(
        `${API_BASE}/dsa/progress`,
        {
          problem_id: problemId,
          platform: platform.toLowerCase(),
          status: newStatus,
        },
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        }
      );
      fetchProgress();
    } catch (err) {
      console.error("Failed to update status", err);
      setProgress((prev) => ({ ...prev, [problemId]: currentStatus }));
    }
  };

  const toggleTopic = (topicId) => {
    setExpandedTopics((prev) => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const recommendedTopicIds = getRecommendedTopicIds(roadmap);
  const contributionWeeks = buildContributionWeeks(calendar);
  const totalProblems = DSA_CATALOG.reduce((sum, topic) => sum + topic.problems.length, 0);
  const completedProblems = Object.values(progress).filter((status) => status === "done").length;
  const progressPct = Math.round((completedProblems / totalProblems) * 100) || 0;
  const dailyTargetDone = Math.min(stats.today_completed || 0, DAILY_TARGET);
  const dailyTargetPct = Math.round((dailyTargetDone / DAILY_TARGET) * 100);

  if (loading) {
    return (
      <div className="p-6 font-mono text-muted-foreground animate-pulse text-sm">
        [ LOADING_DSA_TELEMETRY... ]
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-card border-2 border-border p-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div>
            <span className="index-label">SYS.DSA_MODULE</span>
            <h3 className="text-3xl font-black text-foreground uppercase tracking-tight">
              Algorithm <span className="text-primary">Tracker</span>
            </h3>
            <p className="text-muted-foreground font-mono text-sm max-w-2xl mt-2">
              Track individual NeetCode and Striver problems, push toward a daily target, and keep your momentum visible with a contribution grid.
            </p>
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-primary">
            {recommendedTopicIds.size > 0 ? `${recommendedTopicIds.size} roadmap-aligned topics detected` : "roadmap alignment updates after AI plan generation"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-background border-2 border-border p-4">
            <p className="text-[10px] font-mono uppercase text-muted-foreground mb-2">Overall Completion</p>
            <div className="flex items-end justify-between gap-3">
              <p className="text-3xl font-black text-foreground">{progressPct}%</p>
              <p className="text-xs font-mono text-muted-foreground">{completedProblems}/{totalProblems} problems</p>
            </div>
            <div className="w-full h-3 mt-3 border-2 border-border bg-card overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="bg-background border-2 border-border p-4">
            <p className="text-[10px] font-mono uppercase text-muted-foreground mb-2">Daily Target</p>
            <div className="flex items-end justify-between gap-3">
              <p className="text-3xl font-black text-primary">{dailyTargetDone}/{DAILY_TARGET}</p>
              <p className="text-xs font-mono text-muted-foreground">{stats.today_completed || 0} solved today</p>
            </div>
            <div className="w-full h-3 mt-3 border-2 border-border bg-card overflow-hidden">
              <div className="h-full bg-accent transition-all duration-500" style={{ width: `${dailyTargetPct}%` }} />
            </div>
          </div>

          <div className="bg-background border-2 border-border p-4">
            <p className="text-[10px] font-mono uppercase text-muted-foreground mb-2">Current Streak</p>
            <div className="flex items-end justify-between gap-3">
              <p className="text-3xl font-black text-foreground">{stats.current_streak || 0}</p>
              <p className="text-xs font-mono text-muted-foreground">consecutive day{stats.current_streak === 1 ? "" : "s"}</p>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-3">
              Show up daily and keep the chain alive.
            </p>
          </div>
        </div>

        <div className="bg-background border-2 border-border p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="text-[10px] font-mono uppercase text-muted-foreground">Contribution Grid</p>
              <p className="text-sm font-mono text-foreground">Last 12 weeks of completed DSA work</p>
            </div>
            <div className="flex gap-2 items-center text-[10px] font-mono text-muted-foreground uppercase">
              <span>Less</span>
              <span className="w-3 h-3 border border-border bg-background inline-block" />
              <span className="w-3 h-3 border border-primary/40 bg-primary/40 inline-block" />
              <span className="w-3 h-3 border border-primary/70 bg-primary/70 inline-block" />
              <span className="w-3 h-3 border border-primary bg-primary inline-block" />
              <span>More</span>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto">
            <div className="flex flex-col justify-between text-[10px] font-mono text-muted-foreground py-1">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className="h-4 leading-4">{label}</span>
              ))}
            </div>
            <div className="flex gap-1">
              {contributionWeeks.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <div
                      key={day.key}
                      title={`${day.label}: ${day.count} solved`}
                      className={`w-4 h-4 border ${getContributionClass(day.count)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {recommendedTopicIds.size > 0 && (
          <div className="mt-6 p-4 border-2 border-primary bg-primary/5">
            <p className="text-[10px] font-mono uppercase text-primary mb-2">Roadmap Focus</p>
            <div className="flex flex-wrap gap-2">
              {DSA_CATALOG.filter((topic) => recommendedTopicIds.has(topic.id)).map((topic) => (
                <span key={topic.id} className="px-2 py-1 border border-primary text-primary text-xs font-mono uppercase">
                  {topic.topic}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {DSA_CATALOG.map((topic) => {
          const solved = topic.problems.filter((problem) => progress[problem.id] === "done").length;
          const topicPct = Math.round((solved / topic.problems.length) * 100) || 0;
          const isExpanded = expandedTopics[topic.id] ?? recommendedTopicIds.has(topic.id);

          return (
            <div key={topic.id} className="border-2 border-border bg-card">
              <button
                onClick={() => toggleTopic(topic.id)}
                className="w-full p-4 text-left bg-background border-b-2 border-border hover:bg-muted/30 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-black uppercase tracking-wider text-lg">{topic.topic}</span>
                    <span className="font-mono text-xs text-muted-foreground bg-card border-2 border-border px-2 py-1">
                      {solved}/{topic.problems.length}
                    </span>
                    {recommendedTopicIds.has(topic.id) && (
                      <span className="font-mono text-xs text-primary border border-primary px-2 py-1 uppercase">
                        AI roadmap match
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-36 h-2 border border-border bg-card overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${topicPct}%` }} />
                    </div>
                    <span className="font-mono text-sm text-primary w-14 text-right">{topicPct}%</span>
                    <span className="font-mono text-xl text-primary font-bold">{isExpanded ? "-" : "+"}</span>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="p-0">
                  {topic.problems.map((problem) => {
                    const isDone = progress[problem.id] === "done";
                    return (
                      <div
                        key={problem.id}
                        className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-b border-border/50 last:border-b-0 hover:bg-background/50 transition-colors ${isDone ? "opacity-70" : ""}`}
                      >
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => toggleProblem(problem.id, problem.platform, progress[problem.id])}
                            className={`w-6 h-6 border-2 flex items-center justify-center shrink-0 transition-colors mt-0.5 ${isDone ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}
                          >
                            {isDone && (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          <div>
                            <a
                              href={problem.url}
                              target="_blank"
                              rel="noreferrer"
                              className={`font-mono text-sm hover:text-primary transition-colors ${isDone ? "line-through text-muted-foreground" : "text-foreground font-bold"}`}
                            >
                              {problem.title} →
                            </a>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className={`text-[10px] font-mono uppercase px-2 py-1 border ${getDifficultyClass(problem.diff)}`}>
                                {problem.diff}
                              </span>
                              <span className="text-[10px] font-mono uppercase px-2 py-1 border border-border text-muted-foreground">
                                {problem.platform}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
