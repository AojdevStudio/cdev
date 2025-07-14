# Security Policy

## Reporting Security Vulnerabilities

We take security seriously. If you discover a security vulnerability in CDEV (Claude Development), please report it responsibly.

### How to Report

**DO NOT** open a public issue for security vulnerabilities.

Instead:

1. Email: admin@kamdental.com or open a private security advisory on GitHub
2. Include a detailed description of the vulnerability
3. Provide steps to reproduce the issue
4. Include any relevant code snippets or configurations

### What to Include

- **Description**: Clear description of the vulnerability
- **Impact**: Potential impact if exploited
- **Reproduction**: Step-by-step instructions to reproduce
- **Environment**: Node.js version, OS, CDEV version
- **Proof of Concept**: If applicable, demonstrate the vulnerability

## Security Best Practices for Users

### API Key Management

1. **Never commit API keys**: Always use `.env` files and add them to `.gitignore`
2. **Use environment variables**: Store sensitive data in environment variables
3. **Rotate keys regularly**: Change API keys periodically
4. **Limit key permissions**: Use the minimum required permissions for API keys
5. **Monitor usage**: Set up billing alerts and usage monitoring

### Environment Configuration

1. **Use .env.example**: Copy `.env.example` to `.env` and update with real values
2. **Secure file permissions**: Ensure `.env` files have restricted permissions (`chmod 600 .env`)
3. **Separate environments**: Use different API keys for development, staging, and production
4. **Validate inputs**: Always validate and sanitize inputs from Linear issues

### Git Worktree Security

1. **Isolated workspaces**: Each agent works in a separate directory
2. **Clean up**: Remove worktrees after merging to prevent data leaks
3. **Review commits**: Carefully review all commits before merging
4. **No secrets in commits**: Never commit API keys or sensitive configuration

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Features

### Automatic Security Checks

CDEV includes several security features:

1. **Pre-publish security scan**: Checks for sensitive files before publishing
2. **Environment file protection**: Prevents `.env` files from being committed
3. **API key detection**: Scans for hardcoded API keys in source code
4. **Sensitive file exclusion**: Automatically excludes sensitive directories

### Security Scripts

- `npm run security:check`: Run comprehensive security checks
- `npm run security:audit`: Audit dependencies for vulnerabilities

### File Protections

The following files/directories are automatically excluded from publication:

- `.env*` (except `.env.example`)
- `logs/`
- `.linear-cache/`
- `validation/`
- `shared/coordination/`
- `workspaces/`
- Any files matching `*secret*`, `*key*`, `*token*` patterns

## Known Security Considerations

### Linear API Integration

- **API key exposure**: Linear API keys provide access to project data
- **Rate limiting**: Respect Linear's API rate limits
- **Data privacy**: Cached Linear issues may contain sensitive project information

### LLM Provider APIs

- **API costs**: Monitor usage to prevent unexpected billing
- **Data privacy**: Be aware of what data is sent to LLM providers
- **Model selection**: Choose appropriate models for your security requirements

### Git Worktrees

- **File permissions**: Worktree files inherit permissions from the main repository
- **Cleanup**: Failed cleanup may leave sensitive files in worktree directories
- **Branch naming**: Avoid including sensitive information in branch names

## Security Updates

We will provide security updates for:

- **Critical vulnerabilities**: Immediate patches
- **High severity issues**: Patches within 7 days
- **Medium/Low severity**: Included in regular releases

Subscribe to releases on GitHub to be notified of security updates.

## Compliance and Auditing

### Data Handling

- **Local storage**: Issue data is cached locally in `.linear-cache/`
- **Temporary files**: Agent workspaces contain temporary project data
- **Log files**: May contain references to file paths and project structure

### GDPR Considerations

If processing personal data:

1. **Data minimization**: Only cache necessary issue information
2. **Retention**: Clear cached data regularly
3. **Access controls**: Ensure appropriate file permissions
4. **Data portability**: Support data export/import if needed

## Third-Party Dependencies

We regularly audit our dependencies using:

- `npm audit`
- Automated dependency scanning
- Security advisories monitoring

Report any security issues in dependencies, and we'll prioritize updates.

## Contact

For security-related questions or concerns:

- **Security issues**: admin@kamdental.com
- **General questions**: GitHub Issues
- **Community discussion**: GitHub Discussions / Discord (Coming Soon)

---

**Last updated**: [Current Date]
**Version**: 1.0.0
