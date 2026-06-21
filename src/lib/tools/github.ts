export interface GitHubIssue {
  title: string;
  body: string;
  labels?: string[];
}

export interface GitHubResult {
  success: boolean;
  issueUrl?: string;
  issueNumber?: number;
  error?: string;
}

export async function createGitHubIssue(
  owner: string,
  repo: string,
  issue: GitHubIssue
): Promise<GitHubResult> {
  const token = process.env.GITHUB_TOKEN;
  if (!token || token === "ghp_your-token-here") {
    return { success: false, error: "No GITHUB_TOKEN configured in .env.local" };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        title: issue.title,
        body: issue.body,
        labels: issue.labels ?? [],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.message ?? "GitHub API error" };
    }

    const data = await res.json();
    return { success: true, issueUrl: data.html_url, issueNumber: data.number };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export function parseIssuesFromOutput(output: string): GitHubIssue[] {
  const issues: GitHubIssue[] = [];
  // Match **[FEAT-XXX] Title** patterns
  const regex = /\*\*\[([^\]]+)\]\s+([^\n*]+)\*\*\n([\s\S]*?)(?=\*\*\[|$)/g;
  let match;
  while ((match = regex.exec(output)) !== null) {
    const id = match[1];
    const title = match[2].trim();
    const body = match[3].trim();
    issues.push({ title: `[${id}] ${title}`, body, labels: ["feat", "sprint-1"] });
  }

  // Fallback: split on numbered lines
  if (issues.length === 0) {
    const lines = output.split("\n").filter((l) => /^\d+\.|^-/.test(l.trim()));
    lines.slice(0, 10).forEach((line, i) => {
      issues.push({
        title: line.replace(/^[\d\-.*]+\s*/, "").trim().slice(0, 100),
        body: `Auto-generated issue from Founder OS engineering plan.\n\n${line}`,
        labels: ["feat"],
      });
    });
  }
  return issues;
}
