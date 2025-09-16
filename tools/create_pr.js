// Minimal PR creator using GitHub REST API with PAT from env
// Env vars checked (in order): PAT, GITHUB_TOKEN, GH_TOKEN

async function main() {
  const token = process.env.PAT || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.error('NO_PAT');
    process.exit(2);
  }
  const repo = 'MichaelWBrennan/FightingGameTest';
  const url = `https://api.github.com/repos/${repo}/pulls`;
  const payload = {
    title: 'Fix: render fallback blit + ?diag=1 camera/cube (black screen on iOS Safari)',
    head: 'fix/render-fallback-blit',
    base: 'main',
    body: [
      'Summary',
      '- Add fallback blit in PostProcessingManager to copy main camera offscreen render target to the default framebuffer each frame.',
      '- Wire PostFX manager to update every frame.',
      '- Add optional runtime diagnostics (?diag=1) to inject a camera, light, and rotating cube, and force on-screen renderTarget=null.',
      '',
      'Impact',
      '- Fixes black screen with FPS when main camera renders to offscreen target without a combine step (observed on iPhone Safari WebGL2).',
      '- Keeps normal pipeline intact; blit acts as safety net.',
      '',
      'How to test',
      '- Open deployed preview on iOS Safari and desktop.',
      '- Verify scene renders (no black screen).',
      '- Visit with ?diag=1 to confirm gray clear + rotating cube renders for quick sanity check.',
      '',
      'Notes',
      '- Assets manifest continues loading in background; rendering no longer blocked if assets fail.'
    ].join('\n')
  };

  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'cursor-agent'
  };

  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  const data = await resp.json();
  if (resp.ok && data && data.html_url) {
    console.log(data.html_url);
    return;
  }
  // If PR already exists or insufficient scope, attempt to list existing PR for this branch
  try {
    const listUrl = `https://api.github.com/repos/${repo}/pulls?state=open&head=MichaelWBrennan:fix/render-fallback-blit`;
    const listResp = await fetch(listUrl, { headers });
    const list = await listResp.json();
    if (Array.isArray(list) && list.length > 0 && list[0].html_url) {
      console.log(list[0].html_url);
      return;
    }
  } catch {}
  // Print original error payload for diagnosis
  console.error(JSON.stringify(data));
  process.exit(1);
}

main().catch((e) => { console.error(String(e && e.message || e)); process.exit(1); });

