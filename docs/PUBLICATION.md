# Public release checklist

## Repository scan

- Run `rg -n -i 'password|secret|private[_-]?key|api[_-]?key|token|webhook' --hidden --glob '!.git/**' --glob '!node_modules/**'` and inspect every result.
- Run `rg -n -i 'poolraid\\.com' --hidden --glob '!.git/**' --glob '!node_modules/**'`; it must return no result.
- Inspect `.env.example`, workflows, Docker files, images, audio metadata, source maps, backups, and deleted files.
- Run a dedicated secret scanner such as Gitleaks or TruffleHog against the publication directory.
- Confirm `npm run check` and a container build pass.
- Confirm the operator owns or may redistribute every image, sound, font, and trademark.

## Fresh public history

Do not push this working repository's existing `.git` directory. Export the reviewed working tree to a separate directory, excluding `.git`, dependencies, builds, environment files, keypairs, and backups. Initialize that directory as a new repository with one publication commit, inspect `git status` and the staged diff, then connect it to a new empty GitHub repository.

One possible local workflow is:

```bash
mkdir ../poolraid-public
rsync -a ./ ../poolraid-public/ \
  --exclude .git --exclude node_modules --exclude .next \
  --exclude '.env*' --include .env.example \
  --exclude '*wallet*.json' --exclude '*keypair*.json'
cd ../poolraid-public
git init -b main
git add -A
git diff --cached --check
git commit -m "Initial public release"
```

Review the new commit's author identity before publishing. Add and push a remote only after all checks pass. Keep the original private repository intact for recovery.

## GitHub settings

Enable private vulnerability reporting, Dependabot alerts, secret scanning, push protection, branch protection, required CI checks, and review for changes to workflows. Disable unused features and avoid adding production secrets until a deployment workflow genuinely needs them.
