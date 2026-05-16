# Contribution Guidelines

Welcome to the **Nexus AI** repository. To maintain high code quality and professional standards, please follow these guidelines.

## 🌿 Branching Strategy: GitFlow (Simplified)

We use a simplified GitFlow model to ensure stability and rapid deployment.

| Branch | Purpose |
| :--- | :--- |
| `main` | Production-ready code. Only merged from `staging`. |
| `staging` | Integration branch for testing. Pre-production. |
| `feature/*` | New features (e.g., `feature/voice-synthesis`). |
| `hotfix/*` | Critical production bug fixes. |
| `refactor/*` | Code improvements without behavior changes. |

## 🔄 The Git Workflow

1.  **Pull** the latest changes from `staging`.
2.  **Create** a new branch: `git checkout -b feature/your-feature-name`.
3.  **Code** and commit locally using [Conventional Commits](#-commit-standards).
4.  **Push** your branch: `git push origin feature/your-feature-name`.
5.  **Open** a Pull Request (PR) against the `staging` branch.
6.  **Review**: Get at least one peer review.
7.  **Merge**: Once approved and CI passes, merge into `staging`.

## 📝 Commit Standards

We follow the **Conventional Commits** specification. This allows for automated changelogs and better history.

**Format:** `<type>(<scope>): <description>`

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

**Example:**
`feat(backend): add streaming support for Gemini API`

## 🚀 Pull Request Protocol

- **Title**: Use Conventional Commit format.
- **Description**: Summary of changes, why they were made, and testing steps.
- **Link Issues**: Reference Jira/GitHub issues (e.g., `Closes #123`).
- **Checklist**:
  - [ ] Code follows style guidelines
  - [ ] Unit tests passed
  - [ ] Environment variables are not committed
  - [ ] README updated if necessary

## 🛡️ Security

- **NEVER** commit `.env` files or API keys.
- Use `secrets.json` or OS environment variables for local development.
- GitHub Secrets must be used for CI/CD pipelines.
