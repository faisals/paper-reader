#!/bin/bash

# Set the root directory of your project
PROJECT_DIR="/Users/xy/Work/llm/paper-reader"

# Create a temporary file to store the output
TEMP_FILE=$(mktemp)

# Function to process directories
process_directory() {
    local dir=$1
    
    # Change to the directory
    cd "$dir" || exit

    # Print the directory structure (respecting .gitignore)
    echo "Directory structure for $dir:" >> "$TEMP_FILE"
    git ls-files --others --exclude-standard --cached | sed 's/^/  /' >> "$TEMP_FILE"
    echo "" >> "$TEMP_FILE"

    # Print file contents with full path (respecting .gitignore)
    git ls-files --others --exclude-standard --cached | while read -r file; do
        echo "File: $dir/$file" >> "$TEMP_FILE"
        echo "Content:" >> "$TEMP_FILE"
        cat "$file" >> "$TEMP_FILE"
        echo -e "\n---\n" >> "$TEMP_FILE"
    done

    # Change back to the project directory
    cd "$PROJECT_DIR" || exit
}

# Process backend and frontend directories
process_directory "$PROJECT_DIR/backend"
process_directory "$PROJECT_DIR/frontend"

# Copy the content of the temporary file to clipboard
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    cat "$TEMP_FILE" | pbcopy
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux (requires xclip)
    cat "$TEMP_FILE" | xclip -selection clipboard
else
    echo "Unsupported operating system. Please copy the content manually from: $TEMP_FILE"
fi

# Clean up
rm "$TEMP_FILE"

echo "Project structure and file contents have been copied to clipboard (respecting .gitignore)."