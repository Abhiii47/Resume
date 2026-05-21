import logging
from typing import Any, Dict, List

import requests

from config import settings

logger = logging.getLogger(__name__)


def fetch_user_repos(username: str) -> List[Dict[str, Any]]:
    """
    Fetches the public repositories for a given GitHub username.
    Returns a list of dictionaries with repository details.
    """
    if not username:
        return []

    url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=10"
    headers = {"Accept": "application/vnd.github.v3+json"}

    # Use token if available to increase rate limits
    if getattr(settings, "GITHUB_CLIENT_SECRET", None):
        # We can't strictly use client_secret for simple auth, but if we had a PAT we would put it here.
        # For public repos, unauthenticated requests are usually fine (60 req/hr).
        pass

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        repos = response.json()

        extracted_repos = []
        for repo in repos:
            if not repo.get("fork"):  # Skip forked repos
                extracted_repos.append(
                    {
                        "name": repo.get("name"),
                        "description": repo.get("description", ""),
                        "url": repo.get("html_url"),
                        "language": repo.get("language", ""),
                        "stars": repo.get("stargazers_count", 0),
                        "updated_at": repo.get("updated_at", ""),
                    }
                )

        # Sort by stars (descending) then by update time
        extracted_repos.sort(key=lambda x: (x["stars"], x["updated_at"]), reverse=True)
        return extracted_repos[:5]  # Return top 5

    except requests.exceptions.RequestException as e:
        logger.warning(f"Failed to fetch GitHub repos for {username}: {e}")
        return []


def extract_github_username_from_url(url: str) -> str:
    """Extracts username from a standard github.com/username URL."""
    if not url:
        return ""

    import re

    match = re.search(r"github\.com/([^/]+)", url)
    if match:
        return match.group(1).strip()
    return ""
