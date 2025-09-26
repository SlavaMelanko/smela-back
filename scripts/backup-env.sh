#!/bin/sh
set -e

# Environment backup script
# Usage: ./scripts/backup-env.sh

# Create backup folder structure
BACKUP_DIR="backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CURRENT_BACKUP="$BACKUP_DIR/$TIMESTAMP"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Remove oldest backup if we have 10 or more
BACKUP_COUNT=$(find "$BACKUP_DIR" -maxdepth 1 -type d ! -path "$BACKUP_DIR" | wc -l)
if [ "$BACKUP_COUNT" -ge 10 ]; then
  OLDEST=$(find "$BACKUP_DIR" -maxdepth 1 -type d ! -path "$BACKUP_DIR" | sort | head -1)
  echo "Removing oldest backup: $OLDEST"
  rm -rf "$OLDEST"
fi

# Create new backup folder
mkdir -p "$CURRENT_BACKUP"

# Copy all .env* files to backup
if ls .env* 1> /dev/null 2>&1; then
  cp .env* "$CURRENT_BACKUP/"
  echo "Environment files backed up to $CURRENT_BACKUP"
else
  echo "No .env* files found to backup"
fi