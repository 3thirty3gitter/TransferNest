# Universal Support Library Contributor Guide

This directory houses the institutional knowledge of the project. Its structure is automated and maintained by our AI partner.

## Structure

- **SUPPORT-LIBRARY.md**: The human-readable main index. Do not edit directly.
- **entries/**: Contains one normalized Markdown file for each post-mortem or incident. This is the canonical source of truth.
- **index.json**: A machine-readable catalog of all entries. Do not edit directly.
- **tags.json**: A machine-readable index of tags and systems. Do not edit directly.
- **sources/**: Contains snapshots of original source materials for provenance.
- **_checkpoint**: An opaque marker indicating the last known state or commit.

## How to Contribute

To add a new incident, provide the raw details (logs, error messages, notes) to the AI partner and ask it to "record a new post-mortem". It will handle the normalization and indexing process.
