# Enforcement Configs

- **Biome** = formatter + linter for everything **except tests** (fast, one tool).
- **ESLint** = **tests only** (to enforce typed mocks + test-specific rules).

---

# 1) Install deps

```bash
pnpm add -D @biomejs/biome eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-plugin-jest eslint-plugin-vitest eslint-plugin-testing-library eslint-plugin-jest-dom typescript
```

---

# 2) Biome config (lint everything but tests; still format tests)

**biome.json**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious/noConsoleLog": "error",
      "suspicious/noConsole": { "level": "error", "options": { "allow": ["warn", "error"] } },
      "typescript/noExplicitAny": "error",
      "typescript/noUnsafeAssignment": "error",
      "typescript/noUnsafeCall": "error",
      "typescript/noUnsafeMemberAccess": "error",
      "typescript/noUnsafeReturn": "error",
      "style/useImportType": "error",
      "complexity/noDisabledTests": "error"
    }
  },
  "overrides": [
    {
      // Disable ONLY the LINTER for tests; formatter still runs
      "include": ["**/*.test.*", "**/*.spec.*", "**/__tests__/**"],
      "linter": { "enabled": false }
    }
  ],
  "organizeImports": { "enabled": true },
  "javascript": { "formatter": { "quoteStyle": "double", "semicolons": "always" } }
}
```

---

# 3) ESLint config (tests only)

**.eslintrc.cjs**

```js
/* eslint-disable no-undef */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', project: ['./tsconfig.json'] },
  plugins: ['@typescript-eslint', 'jest', 'vitest', 'testing-library', 'jest-dom'],
  // We’ll run ESLint only on tests via scripts, so no global "extends" needed.
  overrides: [
    // Next.js app tests (Jest + RTL)
    {
      files: ['apps/**/__tests__/**/*.{ts,tsx}', 'apps/**/*.{test,spec}.{ts,tsx}'],
      env: { 'jest/globals': true, browser: true },
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:jest/recommended',
        'plugin:testing-library/react',
        'plugin:jest-dom/recommended',
      ],
      rules: {
        'no-console': ['error', { allow: ['warn', 'error'] }],
        '@typescript-eslint/no-explicit-any': 'error',

        // Block untyped jest.fn()
        'no-restricted-syntax': [
          'error',
          {
            selector:
              "CallExpression[callee.object.name='jest'][callee.property.name='fn']:not([typeArguments])",
            message: 'Use typed mocks: jest.fn<Return, Args>() or jest.MockedFunction<T>.',
          },
        ],
      },
    },
    // CLI & MCP tests (Vitest)
    {
      files: ['packages/**/__tests__/**/*.{ts,tsx}', 'packages/**/*.{test,spec}.{ts,tsx}'],
      env: { 'vitest/globals': true, node: true },
      extends: ['plugin:@typescript-eslint/recommended', 'plugin:vitest/recommended'],
      rules: {
        'no-console': ['error', { allow: ['warn', 'error'] }],
        '@typescript-eslint/no-explicit-any': 'error',

        // Block untyped vi.fn()
        'no-restricted-syntax': [
          'error',
          {
            selector:
              "CallExpression[callee.object.name='vi'][callee.property.name='fn']:not([typeArguments])",
            message: 'Use typed mocks: vi.fn<Return, Args>() or MockedFunction<T>.',
          },
        ],
      },
    },
  ],
};
```

> If you don’t have a monorepo, replace `apps/**` and `packages/**` with `**/*`.

---

# 4) Scripts + hooks

**package.json**

```json
{
  "scripts": {
    "format": "biome format .",
    "format:fix": "biome format --write .",
    "lint": "biome lint .",
    "lint:fix": "biome lint --apply .",
    "lint:tests": "eslint \"{apps,packages}/**/*.{test,spec}.{ts,tsx}\" \"{apps,packages}/**/__tests__/**/*.{ts,tsx}\"",
    "lint:tests:fix": "pnpm lint:tests --fix",
    "typecheck": "tsc --noEmit",
    "jest:ci": "jest --ci --coverage --runInBand",
    "vitest:ci": "vitest run --coverage",
    "test": "pnpm jest:ci && pnpm vitest:ci"
  }
}
```

**Husky**

```bash
pnpm dlx husky init
```

- **.husky/pre-commit**

  ```sh
  #!/usr/bin/env sh
  pnpm lint:fix
  pnpm format:fix
  pnpm lint:tests:fix
  ```

- **.husky/pre-push**

  ```sh
  #!/usr/bin/env sh
  pnpm typecheck || exit 1
  pnpm -s jest:ci || true
  pnpm -s vitest:ci || true
  ```

---

# 5) TypeScript strict (same as before)

**tsconfig.json**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "useUnknownInCatchVariables": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

# What this buys you

- ⚡ **Biome** for fast lint/format everywhere.
- 🧪 **ESLint** only where we need test-specific guardrails (typed mocks, jest/vitest rules).
- 🚫 No `console.log`, no `any`, no untyped `fn()` in tests.
- ✅ Tests still pretty-formatted by Biome.
