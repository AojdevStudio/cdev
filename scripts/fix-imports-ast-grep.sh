#!/bin/bash

# AST-grep based import fixer for file moves during repository cleanup
# Usage: ./scripts/fix-imports-ast-grep.sh

echo "🔧 Starting AST-grep import path fixes..."

# Common file moves - Configuration files
ast-grep --pattern 'import $A from "./jest.config.js"' --rewrite 'import $A from "./config/jest.config.js"' --lang js --update-all
ast-grep --pattern 'require("./jest.config.js")' --rewrite 'require("./config/jest.config.js")' --lang js --update-all
ast-grep --pattern 'import $A from "../jest.config.js"' --rewrite 'import $A from "../config/jest.config.js"' --lang js --update-all
ast-grep --pattern 'require("../jest.config.js")' --rewrite 'require("../config/jest.config.js")' --lang js --update-all

# Babel config moves
ast-grep --pattern 'import $A from "./babel.config.js"' --rewrite 'import $A from "./config/babel.config.js"' --lang js --update-all
ast-grep --pattern 'require("./babel.config.js")' --rewrite 'require("./config/babel.config.js")' --lang js --update-all

# TypeScript config moves
ast-grep --pattern 'import $A from "./tsconfig.json"' --rewrite 'import $A from "./config/tsconfig.json"' --lang js --update-all
ast-grep --pattern 'require("./tsconfig.json")' --rewrite 'require("./config/tsconfig.json")' --lang js --update-all

# Documentation moves
ast-grep --pattern 'import $A from "./USAGE.md"' --rewrite 'import $A from "./docs/usage.md"' --lang js --update-all
ast-grep --pattern 'require("./USAGE.md")' --rewrite 'require("./docs/usage.md")' --lang js --update-all

# Python imports (if applicable)
ast-grep --pattern 'from utils import $A' --rewrite 'from src.utils import $A' --lang py --update-all
ast-grep --pattern 'import utils' --rewrite 'import src.utils as utils' --lang py --update-all

echo "✅ AST-grep import fixing complete"

# Run validation
echo "🧪 Running validation tests..."
if command -v npm &> /dev/null; then
    if npm run lint 2>/dev/null; then
        echo "✅ Linting passed after import fixes"
    else
        echo "⚠️  Please run 'npm run lint' to check for any remaining issues"
    fi
fi

echo "🎯 Import path fixes complete - use ast-grep for future moves!"