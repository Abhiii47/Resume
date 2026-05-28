from typing import Optional
from database import Analysis
from security_utils import decrypt_resume_text

MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024
UPLOAD_CHUNK_SIZE = 1024 * 1024
RESUME_PREVIEW_LIMIT = 200


def build_resume_preview(resume_text: str, limit: int = RESUME_PREVIEW_LIMIT) -> str:
    cleaned = (resume_text or "").strip()
    return cleaned[:limit]


def get_analysis_resume_text(analysis: Optional[Analysis]) -> str:
    if not analysis:
        return ""
    decrypted = decrypt_resume_text(analysis.resume_text)
    return (decrypted or analysis.resume_preview or "").strip()


def get_analysis_resume_preview(analysis: Optional[Analysis], limit: int = RESUME_PREVIEW_LIMIT) -> str:
    if not analysis:
        return ""
    preview = (analysis.resume_preview or "").strip()
    if preview:
        return preview[:limit]
    return build_resume_preview(get_analysis_resume_text(analysis), limit=limit)


def builder_content_to_resume_text(content: Optional[dict]) -> str:
    if not isinstance(content, dict):
        return ""

    personal = content.get("personal") or {}
    skills = content.get("skills") or {}
    sections = []

    name = (personal.get("name") or "").strip()
    contact = [
        (personal.get("email") or "").strip(),
        (personal.get("phone") or "").strip(),
        (personal.get("linkedin") or "").strip(),
        (personal.get("github") or "").strip(),
    ]
    if name:
        sections.append(name)
    if any(contact):
        sections.append(" | ".join([value for value in contact if value]))

    summary = (content.get("summary") or "").strip()
    if summary:
        sections.append(f"SUMMARY\n{summary}")

    experience_rows = []
    for row in content.get("experience") or []:
        if not isinstance(row, dict):
            continue
        header_parts = [
            (row.get("company") or "").strip(),
            (row.get("title") or "").strip(),
            " - ".join(
                [part for part in [(row.get("startDate") or "").strip(), (row.get("endDate") or "").strip()] if part]
            ),
        ]
        bullets = "\n".join(
            f"- {line.strip().lstrip('-* ')}" for line in (row.get("description") or "").splitlines() if line.strip()
        )
        block = "\n".join([part for part in header_parts if part])
        if bullets:
            block = f"{block}\n{bullets}" if block else bullets
        if block:
            experience_rows.append(block)
    if experience_rows:
        sections.append("EXPERIENCE\n" + "\n\n".join(experience_rows))

    education_rows = []
    for row in content.get("education") or []:
        if not isinstance(row, dict):
            continue
        block = " | ".join(
            [
                part
                for part in [
                    (row.get("school") or "").strip(),
                    (row.get("degree") or "").strip(),
                    (row.get("year") or "").strip(),
                ]
                if part
            ]
        )
        if block:
            education_rows.append(block)
    if education_rows:
        sections.append("EDUCATION\n" + "\n".join(education_rows))

    project_rows = []
    for row in content.get("projects") or []:
        if not isinstance(row, dict):
            continue
        title = " | ".join(
            [part for part in [(row.get("name") or "").strip(), (row.get("technologies") or "").strip()] if part]
        )
        bullets = "\n".join(
            f"- {line.strip().lstrip('-* ')}" for line in (row.get("description") or "").splitlines() if line.strip()
        )
        block = f"{title}\n{bullets}" if title and bullets else (title or bullets)
        if block:
            project_rows.append(block)
    if project_rows:
        sections.append("PROJECTS\n" + "\n\n".join(project_rows))

    skill_parts = []
    for label, value in [
        ("Languages", skills.get("languages")),
        ("Frameworks", skills.get("frameworks")),
        ("Tools", skills.get("tools")),
    ]:
        cleaned = (value or "").strip()
        if cleaned:
            skill_parts.append(f"{label}: {cleaned}")
    if skill_parts:
        sections.append("SKILLS\n" + "\n".join(skill_parts))

    return "\n\n".join(section for section in sections if section).strip()
