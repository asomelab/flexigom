# Flexigom Infrastructure (AWS)

Terraform for the **frontend** static hosting on AWS: S3 (private) + CloudFront
(Origin Access Control) + ACM (HTTPS) + Route53, deployed by GitHub Actions via
OIDC (no long-lived AWS keys).

> Scope: frontend only. The backend (Strapi/Postgres/Caddy on EC2) and
> MercadoPago are **not** managed here.

## Layout

```
infra/
├── bootstrap/            # Remote state backend (S3 + DynamoDB). LOCAL state. Apply once.
├── modules/
│   └── static-site/      # Reusable: S3 + CloudFront(OAC) + ACM + Route53 (SPA fallback).
└── stacks/
    ├── global/           # GitHub OIDC provider + Route53 hosted zone.
    ├── dev/              # static-site (dev) + least-privilege CI role (branch: dev).
    └── prod/             # static-site (prod apex+www) + CI role (branch: main).
```

Region is **us-east-1** for everything (CloudFront ACM certs must live there).

## Apply order (runbook)

### 1. Bootstrap the state backend (once)

```bash
cd infra/bootstrap
terraform init
terraform apply
```

Creates `flexigom-tfstate` (S3) and `flexigom-tflock` (DynamoDB). If you change
these names, update `state_bucket_name`/`lock_table_name` here **and** every
`backend.tf` + `remote_state_bucket` default in the stacks.

### 2. Global stack

```bash
cd infra/stacks/global
cp terraform.tfvars.example terraform.tfvars   # set root_domain
terraform init
terraform apply
terraform output hosted_zone_name_servers
```

Then, at your **domain registrar**, replace the nameservers with the four
`hosted_zone_name_servers` values so Route53 becomes authoritative. ACM
validation and the sites won't go live until this propagates.

### 3. Dev and prod stacks

```bash
cd infra/stacks/dev    # then repeat for prod
cp terraform.tfvars.example terraform.tfvars   # set domain_aliases
terraform init
terraform apply
terraform output                                # copy values into GitHub (below)
```

`terraform apply` blocks on ACM DNS validation, which needs step 2's
nameservers live. First apply can take 5–10 min for CloudFront + cert.

### 4. Wire up GitHub

See the secrets/variables section below, then push to `dev` / `main`.

## GitHub configuration

OIDC is used, so **there are no AWS access-key secrets**. Configure two GitHub
**Environments** (`Settings → Environments`): `dev` and `prod`. For each, add
these **Variables** (not secrets — `VITE_*` values are baked into the public
bundle anyway):

| Variable | Value | Source |
|---|---|---|
| `AWS_ROLE_ARN` | IAM role ARN for the env | `terraform output ci_role_arn` |
| `AWS_REGION` | `us-east-1` | constant |
| `S3_BUCKET` | frontend bucket name | `terraform output bucket_name` |
| `CLOUDFRONT_DISTRIBUTION_ID` | distribution ID | `terraform output distribution_id` |
| `VITE_API_BASE_URL` | backend API URL for the env | you |
| `VITE_STRAPI_URL` | Strapi base URL for the env | you |
| `VITE_NODE_ENV` | `production` | you |
| `VITE_MERCADOPAGO_WEBHOOK_URL` | public MP webhook URL for the env | you |

**Secrets:** none required for AWS. Optional: branch protection so `prod` only
deploys from `main`.

Use the matching environment values per stage: dev Environment → dev stack
outputs + dev backend URLs; prod Environment → prod stack outputs + prod URLs.

## Verification

```bash
# HTTPS via CloudFront
curl -I https://<your-domain>            # expect HTTP/2 200, "via: ... cloudfront"

# S3 must NOT be directly reachable (OAC + public access block)
curl -I https://<bucket>.s3.amazonaws.com/index.html   # expect 403

# SPA deep link refresh returns the app (403/404 -> /index.html -> 200)
curl -I https://<your-domain>/products/anything
```

A push to `dev` (or manual `workflow_dispatch`) should run build → `s3 sync` →
CloudFront invalidation, all green.
