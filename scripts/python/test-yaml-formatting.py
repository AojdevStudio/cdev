#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6.0"]
# ///

"""Test YAML formatting for multiline strings"""

import yaml


# Custom representer for multiline strings
def multiline_string_representer(dumper, data):
    """Use literal block style for strings with newlines"""
    if "\n" in data:
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="|")
    return dumper.represent_scalar("tag:yaml.org,2002:str", data)


# Add the custom representer
yaml.add_representer(str, multiline_string_representer)

# Test data similar to Linear issue
test_data = {
    "identifier": "AOJ-87",
    "title": "Guideline Search Enhancement - Enable Vector Search for 2,006 Guidelines",
    "description": """# PRIORITY 1: Activate Vector Search Engine

## Problem

Currently have 0 embeddings in the database despite having:

* 2,006 guidelines with rich content
* pgvector extension installed and ready
* Supabase vector infrastructure complete

## Solution Needed

Generate vector embeddings for all 2,006 guidelines to enable semantic search capabilities.

## Technical Details

* Database: `ymivwfdmeymosgvgoibb`
* Table: `guidelines` (2,006 records)
* Extension: pgvector 0.8.0 ✅ installed
* Target: `embeddings` table (currently 0 records)

## Expected Outcome

Transform static guidelines into semantically searchable knowledge base:

* Semantic search across all carrier guidelines
* Context-aware procedure requirement lookup
* Intelligent cross-referencing of documentation needs""",
}

# Show old style (default YAML behavior)
print("=== OLD STYLE (escaped newlines) ===")
import yaml as yaml_default

print(yaml_default.dump(test_data, default_flow_style=False, sort_keys=False))

print("\n=== NEW STYLE (proper multiline) ===")
# Add custom representer
yaml.add_representer(str, multiline_string_representer)
print(yaml.dump(test_data, default_flow_style=False, sort_keys=False, width=120))
