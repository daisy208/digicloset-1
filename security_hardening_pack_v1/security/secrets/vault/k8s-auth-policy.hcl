# Example Vault policy for Kubernetes auth
path "secret/data/*" {
  capabilities = ["read"]
}
