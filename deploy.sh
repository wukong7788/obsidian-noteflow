#!/bin/bash

# deploy.sh - NoteFlow Deployment Script
# Usage: ./deploy.sh "/path/to/your/obsidian/vault"

VAULT_PATH="$1"
PLUGIN_ID="noteflow"
DEFAULT_VAULT_PATH="$HOME/Documents/Obsidian Vault"

if [ -z "$VAULT_PATH" ]; then
    if [ -d "$DEFAULT_VAULT_PATH" ]; then
        echo "ℹ️ No path provided, using default Mac vault: $DEFAULT_VAULT_PATH"
        VAULT_PATH="$DEFAULT_VAULT_PATH"
    else
        echo "Error: No vault path provided and default vault not found."
        echo "Usage: ./deploy.sh \"/path/to/your/obsidian/vault\""
        exit 1
    fi
fi

# Check if vault path exists and is a directory
if [ ! -d "$VAULT_PATH" ]; then
    echo "Error: Vault path does not exist or is not a directory: $VAULT_PATH"
    exit 1
fi

DEST_DIR="$VAULT_PATH/.obsidian/plugins/$PLUGIN_ID"

echo "🚀 Building NoteFlow..."
bun run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting deployment."
    exit 1
fi

echo "📂 Preparing destination: $DEST_DIR"
mkdir -p "$DEST_DIR"

echo "🚚 Copying files..."
cp main.js "$DEST_DIR/"
cp manifest.json "$DEST_DIR/"

# Copy styles.css if it exists
if [ -f "styles.css" ]; then
    cp styles.css "$DEST_DIR/"
fi

echo "✅ NoteFlow deployed successfully to $VAULT_PATH"
echo "👉 Remember to enable the plugin in Obsidian settings."
