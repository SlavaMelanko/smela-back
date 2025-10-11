#!/usr/bin/env python3
"""
Backup .env.* files to prevent accidental commits of environment changes.
Only creates new backup if content has changed (based on hash).
"""

import hashlib
import zipfile
from datetime import datetime
from pathlib import Path


def create_env_backup():
    # Find .env and .env.* files
    env_files = []
    env_file = Path('.env')
    if env_file.exists():
        env_files.append(env_file)
    env_files.extend(Path('.').glob('.env.*'))

    if not env_files:
        return

    # Ensure backup directory exists
    backup_dir = Path('backups/env')
    backup_dir.mkdir(parents=True, exist_ok=True)

    # Create temp zip inside backup directory
    temp_zip = backup_dir / 'temp.zip'
    with zipfile.ZipFile(temp_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for env_file in env_files:
            zf.write(env_file)

    # Calculate hash
    with open(temp_zip, 'rb') as f:
        file_hash = hashlib.sha256(f.read()).hexdigest()[:12]

    # Check if backup with same hash exists
    existing = list(backup_dir.glob(f'*_{file_hash}.zip'))
    if existing:
        temp_zip.unlink()  # delete temp, backup already exists
        print(f'ℹ️ Environment backup unchanged (hash: {file_hash})')
        return

    # Create timestamped filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    final_name = backup_dir / f'{timestamp}_{file_hash}.zip'
    temp_zip.rename(final_name)

    print(f'✅ Environment backup created: {final_name.name}')


if __name__ == '__main__':
    create_env_backup()
