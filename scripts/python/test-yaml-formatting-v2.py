#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyyaml>=6.0"]
# ///

"""Test improved YAML formatting for multiline strings"""

from typing import Any

import yaml


class LiteralStr(str):
    """String subclass to force literal block style in YAML"""

    pass


def literal_str_representer(dumper, data):
    """Represent LiteralStr as literal block scalar"""
    return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="|")


# Register the custom representer
yaml.add_representer(LiteralStr, literal_str_representer)


def process_for_yaml(data: Any) -> Any:
    """Recursively process data to use literal strings for multiline content"""
    if isinstance(data, dict):
        return {k: process_for_yaml(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [process_for_yaml(item) for item in data]
    elif isinstance(data, str) and "\n" in data:
        return LiteralStr(data)
    else:
        return data


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

print("=== IMPROVED YAML OUTPUT ===")
processed_data = process_for_yaml(test_data)
print(yaml.dump(processed_data, default_flow_style=False, sort_keys=False, width=120))
