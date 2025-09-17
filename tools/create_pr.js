// Minimal PR creator using GitHub REST API with PAT from env
// Env vars checked (in order): PAT, GITHUB_TOKEN, GH_TOKEN

async function main() {
  const token = process.env.PAT || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.error('NO_PAT');
    process.exit(2);
  }

  const repo = process.env.REPO || 'MichaelWBrennan/FightingGameTest';
  const base = process.env.BASE || 'main';
  const headBranch = process.env.HEAD || process.env.HEAD_BRANCH || 'feat/image-startup-ui';
  const title = process.env.PR_TITLE || 'feat(ui): image-based startup splash and menu';
  const body = (process.env.PR_BODY && process.env.PR_BODY.trim()) || [
    '### Summary',
    '- Switch startup/loading overlay to image-based UI (background + progress bar).',
    '- Update menu to image-based layout with background and button skin.',
    '- Keep text fallback for robustness.',
    '',
    '### Files',
    '- src/core/ui/LoadingOverlay.ts',
    '- src/core/ui/UIManager.ts',
    '- public/index.html',
    '',
    '### Test plan',
    '- Build locally and open index; confirm image splash renders and menu shows a textured start button.',
    '- Verify Enter key and button both advance.',
  ].join('\n');

  const url = `https://api.github.com/repos/${repo}/pulls`;
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'cursor-agent'
  };

  // Try with branch-only head (same-repo). If that fails, prefix owner.
  const attempt = async (head) => {
    const payload = { title, head, base, body };
    const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    const data = await resp.json();
    return { ok: resp.ok, data };
  };

  let result = await attempt(headBranch);
  if (!(result && result.ok && result.data && result.data.html_url)) {
    // Prefix owner for head if needed
    const owner = (repo.split('/')[0]);
    result = await attempt(`${owner}:${headBranch}`);
  }

  if (result && result.ok && result.data && result.data.html_url) {
    console.log(result.data.html_url);
    return;
  }

  // If PR already exists or insufficient scope, attempt to find existing PR for this branch
  try {
    const owner = (repo.split('/')[0]);
    const listUrl = `https://api.github.com/repos/${repo}/pulls?state=open&head=${owner}:${headBranch}`;
    const listResp = await fetch(listUrl, { headers });
    const list = await listResp.json();
    if (Array.isArray(list) && list.length > 0 && list[0].html_url) {
      console.log(list[0].html_url);
      return;
    }
  } catch {}

  // Print last error payload for diagnosis
  console.error(JSON.stringify(result && result.data ? result.data : { error: 'unknown' }));
  process.exit(1);
}

main().catch((e) => { console.error(String(e && e.message || e)); process.exit(1); });

