terraform {
  backend "s3" {
    bucket         = "flexigom-tfstate"
    key            = "global/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "flexigom-tflock"
    encrypt        = true
  }
}
