#!/usr/bin/env bash

# Stop execution on error.
set -e

# Check that we have the right tools for this job.
command -v git >/dev/null 2>&1 || { echo >&2 "git is required to build xi-editor! It was not found in \$PATH. Aborting."; exit 1; }
command -v cargo >/dev/null 2>&1 || { echo >&2 "cargo is required to build xi-editor! It was not found in \$PATH. Aborting."; exit 1; }

# Clone xi-editor repo (deleting old one if it exists).
rm -rf ./.xi-core
git clone https://github.com/google/xi-editor.git ./.xi-core

# Build xi-editor from source.
cd ./.xi-core/rust
cargo build

# Copy build into xi-electron (removing old build).
rm -rf ../../src/xi-core
cp -R ./target/debug ../../src/
mv ../../src/debug ../../src/xi-core

echo "Build complete!"
echo "The xi-editor core was built and placed in xi-electron/src/xi-core"
