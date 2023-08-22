# Environment
variable "environment" {
  type        = string
  description = "The environment name, defined in envrionments vars."
}

# ECS Service
variable "name_prefix" {
  type        = string
  description = "The name prefix to be used for parameter name spacing."
}

# Secrets
variable "secrets" {
  type        = map
  description = "The secrets to be added to Parameter Store."
}
variable "kms_key_id" {
  type        = string
  description = "The KMS key alias for encrypting the values for Parameter Store. "
}