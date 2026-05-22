import React, { useState } from "react";
import { motion } from "framer-motion";

const STATUS_COLORS = { active: "#22c55e", thinking: "#f59e0b", tool_executing: "#f59e0b", standby: "#555", idle: "#555" };
const STATUS_LABELS = { active: "Active", thinking: "Thinking…", tool_executing: "Executing…", standby: "Standby", idle: "Standby" };

export default function AgentCard({ agent, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);
  const sc = STATUS_COLORS[agent.status] || STATUS_COLORS.standby;
  const sl = STATUS_LABELS[agent.status] || "Standby";
  const ac = agent.color || "#f97316";
  const pulsing = agent.status === "active" || agent.status === "thinking" || agent.status === "tool_executing";

  return (
    <motion.div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.02, x: 2 }} whileTap={{ scale: 0.98 }}
      style={{
        position: "relative", padding: "12px 14px", cursor: "pointer",
        background: isActive ? `linear-gradient(135deg,${ac}15,${ac}08)` : hovered ? "rgba(255,255,255,.03)" : "transparent",
        borderLeft: isActive ? `3px solid ${ac}` : "3px solid transparent",
        borderRight: "none", borderTop: "none", borderBottom: "1px solid rgba(255,255,255,.04)",
        transition: "background .2s,border-color .2s", display: "flex", alignItems: "center", gap: 12,
      }}
    >
      <div style={{
        width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
        background: `${ac}18`, border: `1px solid ${isActive ? ac : "rgba(255,255,255,.08)"}`, borderRadius: '0.5rem',
        flexShrink: 0, transition: "border-color .2s,box-shadow .2s",
        boxShadow: hovered ? `0 0 16px ${ac}40` : "none",
      }}>{agent.emoji}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: isActive ? ac : "hsl(0 0% 90%)", textTransform: "uppercase", letterSpacing: ".04em", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{agent.name}</div>
        <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "hsl(0 0% 50%)", letterSpacing: ".06em", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{agent.role}</div>
      </div>

      <div style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
        {pulsing && <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `2px solid ${sc}`, opacity: .4, animation: "agentPulse 2s ease-in-out infinite" }} />}
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: sc, boxShadow: pulsing ? `0 0 8px ${sc}` : "none" }} />
      </div>

      {hovered && (
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          style={{ position: "absolute", left: "calc(100% + 12px)", top: "50%", transform: "translateY(-50%)", background: "#fff", border: "1px solid #000", padding: "10px 14px", minWidth: 200, maxWidth: 260, zIndex: 100, borderRadius: "0px", boxShadow: "6px 6px 0 #000" }}>
          <div style={{ position: "absolute", left: -5, top: "50%", transform: "translateY(-50%) rotate(45deg)", width: 10, height: 10, background: "#fff", borderLeft: "1px solid #000", borderBottom: "1px solid #000" }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: ac, marginBottom: 4 }}>{agent.emoji} {agent.name}</div>
          <div style={{ fontSize: 11, color: "hsl(0 0% 65%)", lineHeight: 1.5, marginBottom: 6 }}>{agent.description || agent.role}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: sc, textTransform: "uppercase", letterSpacing: ".1em" }}>● {sl}</span>
            {agent.tools && <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "hsl(0 0% 45%)", letterSpacing: ".05em" }}>{agent.tools.length} tool{agent.tools.length !== 1 ? "s" : ""}</span>}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
