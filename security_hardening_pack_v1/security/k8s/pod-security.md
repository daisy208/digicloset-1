        # Pod Security Admission Recommendations

- Enforce 'restricted' for production namespaces.
- Ensure capabilities are dropped: securityContext.capabilities.drop: ['ALL']
- Set runAsNonRoot: true and readOnlyRootFilesystem: true
