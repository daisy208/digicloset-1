        # How to use the Security Hardening Pack

1. Review all templates and adjust organizational values (emails, ARNs, namespaces).
2. Run SBOM & scans in a CI environment before merge.
3. Deploy Gatekeeper/OPA policies to a staging cluster first.
4. Integrate Vault (or cloud KMS) and remove any plaintext secrets.
5. Regularly run pentest checklist and update policies.
