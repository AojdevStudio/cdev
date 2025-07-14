#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "pyyaml>=6.0",
#   "click>=8.1",
#   "rich>=13.0"
# ]
# ///

"""
Simple smoke test for complex scripts
"""

import sys
from pathlib import Path

# Add the scripts directory to the path
sys.path.insert(0, str(Path(__file__).parent))

# Test imports
try:
    # Test intelligent-agent-generator.py
    # Import using the actual module name (file name with hyphens replaced by underscores)
    import importlib.util

    # Load intelligent-agent-generator.py
    spec1 = importlib.util.spec_from_file_location("intelligent_agent_generator", "intelligent-agent-generator.py")
    intelligent_agent_generator = importlib.util.module_from_spec(spec1)
    spec1.loader.exec_module(intelligent_agent_generator)

    IntelligentAgentGenerator = intelligent_agent_generator.IntelligentAgentGenerator
    print("✅ Successfully imported from intelligent-agent-generator.py")

    # Test basic functionality
    generator = IntelligentAgentGenerator({}, {})
    print("✅ Successfully created IntelligentAgentGenerator instance")

    # Load decompose-parallel.py
    spec2 = importlib.util.spec_from_file_location("decompose_parallel", "decompose-parallel.py")
    decompose_parallel = importlib.util.module_from_spec(spec2)
    spec2.loader.exec_module(decompose_parallel)

    ExclusiveOwnershipDecomposer = decompose_parallel.ExclusiveOwnershipDecomposer
    print("✅ Successfully imported from decompose-parallel.py")

    # Test basic functionality
    decomposer = ExclusiveOwnershipDecomposer()
    print("✅ Successfully created ExclusiveOwnershipDecomposer instance")

    print("\n🎉 All smoke tests passed!")

except Exception as e:
    print(f"❌ Error: {str(e)}")
    sys.exit(1)
