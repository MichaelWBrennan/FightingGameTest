# Contributing

Thanks for your interest in contributing! This project targets a modern web stack with TypeScript, PlayCanvas, and Fastify.

## Development

- Node: see `.nvmrc` (use `nvm use`)
- Install: `npm install`
- Build (dev): `npm run build`
- Preview (local): `npm run preview`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`

## Pull Requests

1. Create a feature branch
2. Ensure CI checks pass locally:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
3. Open a PR using the template

## Commit style

- Conventional commits preferred (e.g., `feat:`, `fix:`, `chore:`)

## Code style

- ESLint flat config with TypeScript
- Prettier enforced via pre-commit

## Security

- Report vulnerabilities via SECURITY.md instructions; do not open public issues for sensitive reports.
