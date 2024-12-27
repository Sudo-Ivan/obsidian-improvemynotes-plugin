#!/bin/bash

# Define the Obsidian vault plugin directory
VAULT_DIR="$HOME/Documents/test/.obsidian/plugins/improve-my-notes"

# Create plugin directory if it doesn't exist
mkdir -p "$VAULT_DIR"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the plugin
echo "Building plugin..."
npm run build

if [ $? -eq 0 ]; then
    echo "Build successful. Installing plugin..."
    
    # Copy plugin files to Obsidian vault
    cp main.js manifest.json "$VAULT_DIR/"
    
    # Copy styles.css if it exists
    if [ -f styles.css ]; then
        cp styles.css "$VAULT_DIR/"
    fi
    
    echo "Plugin installed successfully to: $VAULT_DIR"
    echo "Please restart Obsidian if it's running."
else
    echo "Build failed!"
    exit 1
fi 