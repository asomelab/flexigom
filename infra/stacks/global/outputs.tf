output "hosted_zone_id" {
  description = "Route53 hosted zone ID. Empty string when root_domain is not set."
  value       = var.root_domain != "" ? aws_route53_zone.root[0].zone_id : ""
}

output "hosted_zone_name_servers" {
  description = "Nameservers to configure at your domain registrar. Empty when no domain is configured."
  value       = var.root_domain != "" ? aws_route53_zone.root[0].name_servers : []
}

output "github_oidc_provider_arn" {
  description = "ARN of the GitHub Actions OIDC provider. Consumed by dev/prod stacks via remote state."
  value       = aws_iam_openid_connect_provider.github.arn
}

output "github_org" {
  description = "GitHub org, re-exported for dependent stacks' trust policies."
  value       = var.github_org
}

output "github_repo" {
  description = "GitHub repo, re-exported for dependent stacks' trust policies."
  value       = var.github_repo
}

output "terraform_ci_role_arn" {
  description = "IAM role ARN for the Terraform CI workflow (infra.yml). Set as AWS_INFRA_ROLE_ARN in GitHub repo variables."
  value       = aws_iam_role.terraform_ci.arn
}
