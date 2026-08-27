# Security policy

## Supported version

Security fixes target the latest commit on `main`. This project does not currently maintain older release branches.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's private security-advisory feature for this repository and include:

- the affected route, module, or commit;
- reproduction steps or a minimal proof of concept;
- the expected and observed impact;
- any suggested mitigation; and
- whether funds, secrets, or personal data may be at immediate risk.

Do not access other users' data, move funds, degrade a deployment, or retain secrets while testing. Maintainers should acknowledge a complete report within seven days, but this is a volunteer project and no response-time guarantee is made.

## Operator emergencies

If an active deployment may be compromised, pause all tiers, disable coin flips, remove public access, revoke or rotate exposed credentials, and move remaining funds to a new wallet through a documented recovery process. Preserve logs and database backups for investigation.

The detailed trust boundaries and known limitations are in [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md).
