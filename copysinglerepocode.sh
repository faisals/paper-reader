find . -type f ! -path "./node_modules/*" ! -path "./public/*" ! -path "./public/favicon.ico" ! -path "./package-lock.json" ! -path "./*.bin" ! -path "*/.*" -exec sh -c '
  for filepath do
    echo "File: $filepath"
    cat "$filepath"
    echo
    echo "----------------------"
    echo
  done' sh {} + | pbcopy
