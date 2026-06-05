# Flexigom Infrastructure (AWS)

Terraform for **frontend static hosting** (S3 + CloudFront + ACM + Route53) and
**email** (SES + DKIM/SPF/DMARC + IAM sender), deployed by GitHub Actions via
OIDC (no long-lived AWS keys). Backend stays on Railway — not managed here.

## Layout

```
infra/
├── bootstrap/            # Remote state backend (S3 + DynamoDB). LOCAL state. Apply once.
├── modules/
│   ├── static-site/      # Reusable: S3 + CloudFront(OAC) + ACM + Route53 (SPA fallback).
│   └── ses/              # Reusable: SES domain identity + DKIM/SPF/DMARC + IAM sender.
└── stacks/
    ├── global/           # GitHub OIDC provider + Route53 hosted zone + Terraform CI role.
    ├── dev/              # static-site (dev.flexigomtucuman.com) + least-privilege CI role.
    ├── prod/             # static-site (flexigomtucuman.com, www) + CI role.
    └── email/            # SES for flexigomtucuman.com + DKIM/SPF/DMARC + IAM sender.
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
cp terraform.tfvars.example terraform.tfvars   # root_domain = "flexigomtucuman.com"
terraform init
terraform apply
terraform output hosted_zone_name_servers
terraform output terraform_ci_role_arn
```

Then, at your **domain registrar**, replace the nameservers with the four
`hosted_zone_name_servers` values so Route53 becomes authoritative. ACM
validation and the sites won't go live until this propagates.

Copy `terraform_ci_role_arn` to a GitHub repo-level variable `AWS_INFRA_ROLE_ARN`
(used by `infra.yml` for Terraform plan/apply via OIDC — no secrets needed).

### 3. Dev and prod stacks

```bash
cd infra/stacks/dev    # then repeat for prod
cp terraform.tfvars.example terraform.tfvars   # domain_aliases already correct
terraform init
terraform apply
terraform output                                # copy values into GitHub (below)
```

`terraform apply` blocks on ACM DNS validation, which needs step 2's
nameservers live. First apply can take 5–10 min for CloudFront + cert.

### 4. Email stack

```bash
cd infra/stacks/email
cp terraform.tfvars.example terraform.tfvars   # set dmarc_rua if different
terraform init
terraform apply
terraform output access_key_id
terraform output -raw secret_access_key       # sensitive — copy straight to Railway
```

DKIM records are written to Route53 automatically. SES domain verification
completes passively once the nameservers are live (no manual action needed).

⚠️ **SES sandbox**: new accounts can only send to verified addresses. To email
arbitrary customers, request **production access** via AWS console →
SES → Account dashboard → "Request production access". Do this after the domain
is verified.

Copy the access key + secret to Railway env vars:
- `AWS_SES_ACCESS_KEY_ID`
- `AWS_SES_SECRET_ACCESS_KEY`
- `AWS_SES_REGION=us-east-1`
- `SES_FROM_EMAIL=no-reply@flexigomtucuman.com`
- `SES_REPLY_TO_EMAIL=no-reply@flexigomtucuman.com`

### 5. Wire up GitHub

See the sections below, then push to `dev` / `main`.

## GitHub configuration

### Frontend deploy (OIDC — no AWS secrets)

Configure two GitHub **Environments** (`Settings → Environments`):
`Flexigom / dev` and `Flexigom / prod`. For each, add these **Variables**:

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

### Terraform CI (infra.yml)

Add one repo-level **Variable** (not environment-scoped):

| Variable | Value | Source |
|---|---|---|
| `AWS_INFRA_ROLE_ARN` | Terraform CI role ARN | `terraform output terraform_ci_role_arn` (global stack) |

PRs touching `infra/**` get an automatic plan comment per stack. Apply runs via
`workflow_dispatch` (choose stack + action=apply).

## Verification

### Frontend

```bash
# HTTPS via CloudFront
curl -I https://flexigomtucuman.com     # expect HTTP/2 200, "via: ... cloudfront"

# S3 must NOT be directly reachable (OAC + public access block)
curl -I https://<bucket>.s3.amazonaws.com/index.html   # expect 403

# SPA deep link refresh returns the app (403/404 -> /index.html -> 200)
curl -I https://flexigomtucuman.com/products/anything
```

### Email / SES DNS

```bash
# DKIM CNAMEs (3 records)
dig CNAME <token>._domainkey.flexigomtucuman.com

# MAIL FROM MX
dig MX mail.flexigomtucuman.com

# SPF
dig TXT mail.flexigomtucuman.com

# DMARC
dig TXT _dmarc.flexigomtucuman.com
```

AWS SES console (us-east-1 → Verified identities) should show
`flexigomtucuman.com` as **Verified** and DKIM as **Success** after DNS
propagates.

A push to `dev` or `main` (or manual `workflow_dispatch`) should run:
build → `s3 sync` → CloudFront invalidation — all green.
