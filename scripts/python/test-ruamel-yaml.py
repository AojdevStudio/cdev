#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["ruamel.yaml>=0.18"]
# ///

"""Test ruamel.yaml formatting for multiline strings"""

import sys

from ruamel.yaml import YAML
from ruamel.yaml.scalarstring import LiteralScalarString

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
    "short_field": "This is a short field with no newlines",
}

print("=== WITH RUAMEL.YAML (Proper Multiline) ===")

# Initialize ruamel.yaml
yaml = YAML()
yaml.preserve_quotes = True
yaml.width = 120
yaml.default_flow_style = False


# Process multiline strings
def process_for_yaml(data):
    if isinstance(data, dict):
        return {k: process_for_yaml(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [process_for_yaml(item) for item in data]
    elif isinstance(data, str) and "\n" in data:
        return LiteralScalarString(data)
    else:
        return data


processed_data = process_for_yaml(test_data)
yaml.dump(processed_data, sys.stdout)
