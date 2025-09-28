# Contributing to TrueFace

Thank you for your interest in contributing! This document explains how to propose changes and participate in the TrueFace project.

- Project: Face-recognition authentication platform (Next.js frontend, FastAPI backend)
- License: MIT (unless otherwise noted)

## Code of Conduct
By participating, you agree to uphold a respectful and inclusive environment. Be kind, collaborative, and constructive.

## How Can I Contribute?
- Report bugs (with clear steps to reproduce)
- Propose features and improvements
- Write documentation and examples
- Fix issues labeled good first issue or help wanted
- Improve tests, performance, and developer tooling

## Development Workflow
1. Fork the repository and create a feature branch off main
2. Keep changes focused and atomic
3. Write tests for your changes
4. Ensure linting, type checks, and tests pass locally
5. Submit a Pull Request with a clear description and checklist

### Branching Strategy
- main: stable, production-ready
- feature/*: feature branches
- fix/*: bug fixes
- chore/*: maintenance, refactors

### Commit Messages (Conventional Commits)
Use the conventional commits format:
- feat: add a new feature
- fix: bug fix
- docs: documentation changes
- style: formatting, no code changes
- refactor: code change that neither fixes a bug nor adds a feature
- perf: performance improvements
- test: add or fix tests
- build: build system or external dependencies changes
- ci: CI/CD changes
- chore: other changes that don't modify src or tests
- revert: revert a previous commit

Example:
- feat(auth): add admin JWT with extended expiry
- fix(db): handle connection timeout failures gracefully

## Project Structure (high-level)
- frontend/ … Next.js app
- backend/ … FastAPI service
- scripts/ … operational scripts (db init, backup/restore)
- monitoring/ … Prometheus config
- nginx/ … reverse proxy config

## Backend (Python/FastAPI)
- Python 3.11+
- Virtual env: backend/venv (recommended)
- Code style: black, isort, flake8
- Tests: pytest

Commands:
- Create venv: python -m venv venv && source venv/bin/activate
- Install deps: pip install -r requirements.txt
- Lint: flake8 . && black --check . && isort --check-only .
- Test: TEST_MODE=true DEV_MODE_NO_DB=true pytest -v

## Frontend (Next.js)
- Node.js 18.x (LTS) recommended
- Package manager: npm

Commands:
- Install: npm ci
- Dev: npm run dev
- Lint: npm run lint
- Build: npm run build

## Pull Requests
Please include:
- What problem this change solves
- Screenshots/GIFs for UI changes (before/after)
- Tests covering the change (backend/frontend as appropriate)
- Checklist:
  - [ ] Conventional commit title
  - [ ] Linting passes
  - [ ] Tests added/updated
  - [ ] No secrets in code or logs

## Testing Guidelines
- Prefer deterministic tests; use TEST_MODE=true for relaxed image validation
- Backend: unit tests (utils), API tests with TestClient
- Frontend: type-checking, linting, and (optional) component tests

## Security
- Never commit secrets; use environment variables or Docker secrets
- Follow least privilege and validate all inputs
- Report vulnerabilities privately to maintainers

## Documentation
- Update SETUP.md and docs/README.md when user-facing behavior changes

## Release Process (maintainers)
- Update CHANGELOG.md
- Tag with semantic version (v0.x.y)
- Build and push images via CI
- Announce changes in release notes

Thank you for helping improve TrueFace!
