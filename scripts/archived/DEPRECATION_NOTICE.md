# DEPRECATION NOTICE

**⚠️ IMPORTANT: These scripts are deprecated and will be removed in a future release.**

## Affected Scripts

### Shell Scripts (`.sh`)
- agent-commit-enhanced.sh
- cache-linear-issue.sh
- deploy.sh
- integrate-parallel-work.sh
- monitor-agents.sh
- resolve-conflicts.sh
- spawn-agents.sh
- test-locally.sh
- validate-parallel-work.sh

### JavaScript Scripts (`.js`, `.cjs`)
- decompose-parallel.cjs
- intelligent-agent-generator.js
- postpublish.js
- prepublish.js
- security-check.js

## Deprecation Timeline

| Phase | Date | Action |
|-------|------|--------|
| **Phase 1** | July 2025 | Scripts archived, wrappers provide compatibility |
| **Phase 2** | October 2025 | Deprecation warnings added to wrapper execution |
| **Phase 3** | January 2026 | Final removal of wrapper scripts |

## Migration Guide

### For Shell Scripts

Replace shell script calls with Python equivalents:

```bash
# Old (deprecated)
./scripts/deploy.sh --environment production

# New (recommended)
python scripts/python/deploy.py --environment production
```

### For JavaScript Scripts

Replace Node.js script calls with Python equivalents:

```bash
# Old (deprecated)
node scripts/intelligent-agent-generator.js

# New (recommended)
python scripts/python/intelligent-agent-generator.py
```

### For Package.json Scripts

Update your `package.json` scripts section:

```json
// Old
{
  "scripts": {
    "deploy": "./scripts/deploy.sh",
    "security:check": "node scripts/security-check.js"
  }
}

// New
{
  "scripts": {
    "deploy": "python scripts/python/deploy.py",
    "security:check": "python scripts/python/security-check.py"
  }
}
```

## Benefits of Migration

1. **Cross-platform compatibility**: Python scripts work consistently across all operating systems
2. **Better error messages**: Python provides clearer error messages and stack traces
3. **Improved performance**: Python scripts have been optimized during conversion
4. **Enhanced features**: Many Python scripts include additional functionality
5. **Unified toolchain**: Single language reduces maintenance complexity

## Backward Compatibility

During the deprecation period, wrapper scripts ensure backward compatibility:

- All command-line arguments are preserved
- Exit codes remain consistent
- Output format is maintained
- Environment variables are passed through

## Getting Help

If you need assistance with migration:

1. Run any Python script with `--help` for usage information
2. Check `scripts/python/README.md` for detailed documentation
3. Review `docs/migration-announcement.md` for migration tips
4. Open an issue for specific migration challenges

## Action Required

**Please update your scripts and workflows to use the Python versions before January 2026.**

---

*This notice was created on July 12, 2025, as part of the script modernization initiative.*