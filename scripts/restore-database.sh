#!/bin/bash

# TrueFace Database Restore Script
# This script restores MongoDB database from backups

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/backups/mongodb"
LOG_DIR="/var/log/trueface-backup"
DB_NAME="${MONGO_DB_NAME:-trueface_prod}"
MONGO_HOST="${MONGO_HOST:-mongo}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USER="${MONGO_ROOT_USER:-admin}"
MONGO_PASSWORD="${MONGO_ROOT_PASSWORD:-changeme123}"

# Logging
LOG_FILE="${LOG_DIR}/restore.log"
mkdir -p "${LOG_DIR}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "${LOG_FILE}"
    exit 1
}

# Usage information
usage() {
    cat << EOF
Usage: $0 [OPTIONS] BACKUP_FILE

TrueFace Database Restore Script

Arguments:
    BACKUP_FILE     Path to backup file or directory to restore

Options:
    -h, --help      Show this help message
    -f, --force     Force restore without confirmation
    -d, --drop      Drop existing database before restore
    -t, --target    Target database name (default: ${DB_NAME})
    --dry-run       Show what would be restored without doing it
    
Examples:
    $0 /backups/mongodb/trueface_backup_20240128_143000.tar.gz
    $0 --force --drop /backups/mongodb/trueface_backup_20240128_143000
    $0 --target trueface_test /backups/mongodb/latest_backup.tar.gz

Environment Variables:
    MONGO_HOST              MongoDB host (default: mongo)
    MONGO_PORT              MongoDB port (default: 27017)
    MONGO_ROOT_USER         MongoDB root user (default: admin)
    MONGO_ROOT_PASSWORD     MongoDB root password
    MONGO_DB_NAME           Target database name (default: trueface_prod)

EOF
}

# Parse command line arguments
parse_args() {
    FORCE=false
    DROP_DATABASE=false
    DRY_RUN=false
    TARGET_DB="${DB_NAME}"
    BACKUP_FILE=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -d|--drop)
                DROP_DATABASE=true
                shift
                ;;
            -t|--target)
                TARGET_DB="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -*)
                error "Unknown option: $1"
                ;;
            *)
                if [[ -z "${BACKUP_FILE}" ]]; then
                    BACKUP_FILE="$1"
                    shift
                else
                    error "Multiple backup files specified"
                fi
                ;;
        esac
    done
    
    if [[ -z "${BACKUP_FILE}" ]]; then
        error "Backup file/directory must be specified. Use --help for usage."
    fi
}

# Check if required tools are available
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v mongorestore &> /dev/null; then
        error "mongorestore not found. Please install MongoDB tools."
    fi
    
    log "Dependencies check passed"
}

# Validate backup file
validate_backup() {
    log "Validating backup file: ${BACKUP_FILE}"
    
    if [[ ! -e "${BACKUP_FILE}" ]]; then
        error "Backup file/directory does not exist: ${BACKUP_FILE}"
    fi
    
    # Check if it's a compressed backup
    if [[ "${BACKUP_FILE}" == *.tar.gz ]]; then
        log "Detected compressed backup file"
        
        if ! tar -tzf "${BACKUP_FILE}" > /dev/null 2>&1; then
            error "Invalid or corrupted backup file: ${BACKUP_FILE}"
        fi
        
        # Extract to temporary directory
        TEMP_DIR=$(mktemp -d)
        log "Extracting backup to temporary directory: ${TEMP_DIR}"
        
        if ! tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"; then
            error "Failed to extract backup file"
        fi
        
        # Find the extracted backup directory
        BACKUP_DIR_PATH=$(find "${TEMP_DIR}" -name "trueface_backup_*" -type d | head -n1)
        if [[ -z "${BACKUP_DIR_PATH}" ]]; then
            error "Could not find backup directory in extracted files"
        fi
        
        CLEANUP_TEMP=true
    else
        # Uncompressed backup directory
        log "Detected uncompressed backup directory"
        
        if [[ ! -d "${BACKUP_FILE}" ]]; then
            error "Backup path is not a directory: ${BACKUP_FILE}"
        fi
        
        BACKUP_DIR_PATH="${BACKUP_FILE}"
        CLEANUP_TEMP=false
    fi
    
    # Validate backup structure
    DB_BACKUP_PATH="${BACKUP_DIR_PATH}/${DB_NAME}"
    if [[ ! -d "${DB_BACKUP_PATH}" ]]; then
        error "Database backup directory not found: ${DB_BACKUP_PATH}"
    fi
    
    log "Backup validation passed"
    log "Backup directory: ${DB_BACKUP_PATH}"
}

# Get backup information
get_backup_info() {
    log "Gathering backup information..."
    
    # Get backup timestamp from filename
    BACKUP_BASENAME=$(basename "${BACKUP_FILE}")
    if [[ "${BACKUP_BASENAME}" =~ trueface_backup_([0-9]{8}_[0-9]{6}) ]]; then
        BACKUP_TIMESTAMP="${BASH_REMATCH[1]}"
        BACKUP_DATE=$(echo "${BACKUP_TIMESTAMP}" | sed 's/\([0-9]\{8\}\)_\([0-9]\{6\}\)/\1 \2/' | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\) \([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3 \4:\5:\6/')
        log "Backup timestamp: ${BACKUP_DATE}"
    fi
    
    # Get backup size
    BACKUP_SIZE=$(du -sh "${BACKUP_DIR_PATH}" | cut -f1)
    log "Backup size: ${BACKUP_SIZE}"
    
    # Count collections
    COLLECTION_COUNT=$(find "${DB_BACKUP_PATH}" -name "*.bson" | wc -l)
    log "Collections to restore: ${COLLECTION_COUNT}"
    
    if [[ ${COLLECTION_COUNT} -eq 0 ]]; then
        error "No collections found in backup"
    fi
    
    # List collections
    log "Collections found:"
    find "${DB_BACKUP_PATH}" -name "*.bson" | while read -r file; do
        collection=$(basename "${file}" .bson)
        log "  - ${collection}"
    done
}

# Confirm restore operation
confirm_restore() {
    if [[ "${FORCE}" == "true" ]]; then
        log "Force mode enabled, skipping confirmation"
        return
    fi
    
    log "=== RESTORE CONFIRMATION ==="
    log "Source backup: ${BACKUP_FILE}"
    log "Target database: ${TARGET_DB}"
    log "Target host: ${MONGO_HOST}:${MONGO_PORT}"
    log "Drop existing database: ${DROP_DATABASE}"
    log "============================="
    
    echo -n "Are you sure you want to proceed with the restore? (yes/no): "
    read -r response
    
    if [[ "${response}" != "yes" ]]; then
        log "Restore operation cancelled by user"
        exit 0
    fi
    
    log "Restore confirmed by user"
}

# Drop existing database if requested
drop_existing_database() {
    if [[ "${DROP_DATABASE}" != "true" ]]; then
        return
    fi
    
    log "Dropping existing database: ${TARGET_DB}"
    
    if [[ "${DRY_RUN}" == "true" ]]; then
        log "DRY RUN: Would drop database ${TARGET_DB}"
        return
    fi
    
    # Use mongo shell to drop database
    MONGO_CMD="mongo"
    MONGO_CMD="${MONGO_CMD} --host ${MONGO_HOST}:${MONGO_PORT}"
    MONGO_CMD="${MONGO_CMD} --username ${MONGO_USER}"
    MONGO_CMD="${MONGO_CMD} --password ${MONGO_PASSWORD}"
    MONGO_CMD="${MONGO_CMD} --authenticationDatabase admin"
    MONGO_CMD="${MONGO_CMD} --eval 'db.getSiblingDB(\"${TARGET_DB}\").dropDatabase()'"
    MONGO_CMD="${MONGO_CMD} --quiet"
    
    if eval "${MONGO_CMD}"; then
        log "Database dropped successfully"
    else
        error "Failed to drop existing database"
    fi
}

# Perform database restore
restore_database() {
    log "Starting database restore..."
    
    if [[ "${DRY_RUN}" == "true" ]]; then
        log "DRY RUN: Would restore database from ${DB_BACKUP_PATH} to ${TARGET_DB}"
        return
    fi
    
    # Build mongorestore command
    MONGORESTORE_CMD="mongorestore"
    MONGORESTORE_CMD="${MONGORESTORE_CMD} --host ${MONGO_HOST}:${MONGO_PORT}"
    MONGORESTORE_CMD="${MONGORESTORE_CMD} --username ${MONGO_USER}"
    MONGORESTORE_CMD="${MONGORESTORE_CMD} --password ${MONGO_PASSWORD}"
    MONGORESTORE_CMD="${MONGORESTORE_CMD} --authenticationDatabase admin"
    MONGORESTORE_CMD="${MONGORESTORE_CMD} --db ${TARGET_DB}"
    MONGORESTORE_CMD="${MONGORESTORE_CMD} --verbose"
    MONGORESTORE_CMD="${MONGORESTORE_CMD} ${DB_BACKUP_PATH}"
    
    # Execute restore
    log "Executing restore command..."
    if eval "${MONGORESTORE_CMD}"; then
        log "Database restore completed successfully"
    else
        error "Database restore failed"
    fi
}

# Verify restore
verify_restore() {
    if [[ "${DRY_RUN}" == "true" ]]; then
        log "DRY RUN: Would verify restore"
        return
    fi
    
    log "Verifying restore..."
    
    # Check if database exists and has collections
    MONGO_CMD="mongo"
    MONGO_CMD="${MONGO_CMD} --host ${MONGO_HOST}:${MONGO_PORT}"
    MONGO_CMD="${MONGO_CMD} --username ${MONGO_USER}"
    MONGO_CMD="${MONGO_CMD} --password ${MONGO_PASSWORD}"
    MONGO_CMD="${MONGO_CMD} --authenticationDatabase admin"
    MONGO_CMD="${MONGO_CMD} --eval 'db.getSiblingDB(\"${TARGET_DB}\").getCollectionNames()'"
    MONGO_CMD="${MONGO_CMD} --quiet"
    
    if eval "${MONGO_CMD}" > /tmp/collections.txt; then
        RESTORED_COLLECTIONS=$(cat /tmp/collections.txt | grep -o '"[^"]*"' | wc -l)
        log "Restored collections: ${RESTORED_COLLECTIONS}"
        
        if [[ ${RESTORED_COLLECTIONS} -eq ${COLLECTION_COUNT} ]]; then
            log "Restore verification passed"
        else
            error "Restore verification failed: collection count mismatch"
        fi
    else
        error "Failed to verify restored database"
    fi
    
    rm -f /tmp/collections.txt
}

# Cleanup temporary files
cleanup() {
    if [[ "${CLEANUP_TEMP}" == "true" ]] && [[ -n "${TEMP_DIR}" ]] && [[ -d "${TEMP_DIR}" ]]; then
        log "Cleaning up temporary files: ${TEMP_DIR}"
        rm -rf "${TEMP_DIR}"
    fi
}

# Main restore process
main() {
    local start_time=$(date +%s)
    
    log "Starting TrueFace database restore process..."
    
    # Parse command line arguments
    parse_args "$@"
    
    log "Configuration:"
    log "  Backup file: ${BACKUP_FILE}"
    log "  Target database: ${TARGET_DB}"
    log "  Host: ${MONGO_HOST}:${MONGO_PORT}"
    log "  User: ${MONGO_USER}"
    log "  Force mode: ${FORCE}"
    log "  Drop database: ${DROP_DATABASE}"
    log "  Dry run: ${DRY_RUN}"
    
    # Check dependencies
    check_dependencies
    
    # Validate backup
    validate_backup
    
    # Get backup information
    get_backup_info
    
    # Confirm restore operation
    confirm_restore
    
    # Drop existing database if requested
    drop_existing_database
    
    # Perform restore
    restore_database
    
    # Verify restore
    verify_restore
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "=== Restore Report ==="
    log "Source: ${BACKUP_FILE}"
    log "Target: ${TARGET_DB}"
    log "Duration: ${duration} seconds"
    log "Collections: ${COLLECTION_COUNT}"
    log "===================="
    
    if [[ "${DRY_RUN}" == "true" ]]; then
        log "DRY RUN completed - no actual restore performed"
    else
        log "Database restore process completed successfully!"
    fi
}

# Error handling and cleanup
trap cleanup EXIT
trap 'error "Restore process interrupted"' INT TERM

# Run main process
main "$@"
