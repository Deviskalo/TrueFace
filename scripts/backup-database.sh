#!/bin/bash

# TrueFace Database Backup Script
# This script creates backups of the MongoDB database with compression and rotation

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/backups/mongodb"
LOG_DIR="/var/log/trueface-backup"
DB_NAME="${MONGO_DB_NAME:-trueface_prod}"
MONGO_HOST="${MONGO_HOST:-mongo}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USER="${MONGO_READONLY_USER:-trueface_readonly}"
MONGO_PASSWORD="${MONGO_READONLY_PASSWORD:-readonly123}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
COMPRESSION="${BACKUP_COMPRESSION:-true}"

# Timestamp for backup file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="trueface_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Logging
LOG_FILE="${LOG_DIR}/backup.log"
mkdir -p "${LOG_DIR}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "${LOG_FILE}"
    exit 1
}

# Check if required tools are available
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v mongodump &> /dev/null; then
        error "mongodump not found. Please install MongoDB tools."
    fi
    
    if [[ "${COMPRESSION}" == "true" ]] && ! command -v gzip &> /dev/null; then
        error "gzip not found. Please install gzip for compression."
    fi
    
    log "Dependencies check passed"
}

# Create backup directory
create_backup_dir() {
    log "Creating backup directory: ${BACKUP_DIR}"
    mkdir -p "${BACKUP_DIR}"
    
    if [[ ! -w "${BACKUP_DIR}" ]]; then
        error "Backup directory is not writable: ${BACKUP_DIR}"
    fi
}

# Perform database backup
backup_database() {
    log "Starting database backup for ${DB_NAME}..."
    log "Backup destination: ${BACKUP_PATH}"
    
    # Build mongodump command
    MONGODUMP_CMD="mongodump"
    MONGODUMP_CMD="${MONGODUMP_CMD} --host ${MONGO_HOST}:${MONGO_PORT}"
    MONGODUMP_CMD="${MONGODUMP_CMD} --db ${DB_NAME}"
    MONGODUMP_CMD="${MONGODUMP_CMD} --username ${MONGO_USER}"
    MONGODUMP_CMD="${MONGODUMP_CMD} --password ${MONGO_PASSWORD}"
    MONGODUMP_CMD="${MONGODUMP_CMD} --authenticationDatabase admin"
    MONGODUMP_CMD="${MONGODUMP_CMD} --out ${BACKUP_PATH}"
    MONGODUMP_CMD="${MONGODUMP_CMD} --quiet"
    
    # Execute backup
    if eval "${MONGODUMP_CMD}"; then
        log "Database backup completed successfully"
    else
        error "Database backup failed"
    fi
    
    # Get backup size
    BACKUP_SIZE=$(du -sh "${BACKUP_PATH}" | cut -f1)
    log "Backup size: ${BACKUP_SIZE}"
}

# Compress backup if enabled
compress_backup() {
    if [[ "${COMPRESSION}" != "true" ]]; then
        log "Compression disabled, skipping..."
        return
    fi
    
    log "Compressing backup..."
    
    cd "${BACKUP_DIR}"
    if tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"; then
        # Remove uncompressed backup
        rm -rf "${BACKUP_NAME}"
        
        COMPRESSED_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
        log "Backup compressed successfully. Size: ${COMPRESSED_SIZE}"
    else
        error "Backup compression failed"
    fi
}

# Validate backup integrity
validate_backup() {
    log "Validating backup integrity..."
    
    if [[ "${COMPRESSION}" == "true" ]]; then
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
        if [[ -f "${BACKUP_FILE}" ]]; then
            if tar -tzf "${BACKUP_FILE}" > /dev/null 2>&1; then
                log "Backup integrity validation passed"
            else
                error "Backup integrity validation failed"
            fi
        else
            error "Backup file not found: ${BACKUP_FILE}"
        fi
    else
        if [[ -d "${BACKUP_PATH}" ]]; then
            log "Backup directory validation passed"
        else
            error "Backup directory not found: ${BACKUP_PATH}"
        fi
    fi
}

# Clean up old backups
cleanup_old_backups() {
    log "Cleaning up backups older than ${RETENTION_DAYS} days..."
    
    if [[ "${RETENTION_DAYS}" -le 0 ]]; then
        log "Backup retention disabled (RETENTION_DAYS <= 0)"
        return
    fi
    
    # Find and remove old backup files
    DELETED_COUNT=0
    
    if [[ "${COMPRESSION}" == "true" ]]; then
        # Clean compressed backups
        find "${BACKUP_DIR}" -name "trueface_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -print0 | \
        while IFS= read -r -d '' file; do
            log "Removing old backup: $(basename "${file}")"
            rm -f "${file}"
            ((DELETED_COUNT++))
        done
    else
        # Clean uncompressed backups
        find "${BACKUP_DIR}" -name "trueface_backup_*" -type d -mtime +${RETENTION_DAYS} -print0 | \
        while IFS= read -r -d '' dir; do
            log "Removing old backup: $(basename "${dir}")"
            rm -rf "${dir}"
            ((DELETED_COUNT++))
        done
    fi
    
    if [[ ${DELETED_COUNT} -gt 0 ]]; then
        log "Cleaned up ${DELETED_COUNT} old backup(s)"
    else
        log "No old backups to clean up"
    fi
}

# Send notification (if configured)
send_notification() {
    local status="$1"
    local message="$2"
    
    # Email notification (if configured)
    if [[ -n "${NOTIFICATION_EMAIL}" ]] && command -v mail &> /dev/null; then
        echo "${message}" | mail -s "TrueFace Backup ${status}" "${NOTIFICATION_EMAIL}"
        log "Notification sent to ${NOTIFICATION_EMAIL}"
    fi
    
    # Webhook notification (if configured)
    if [[ -n "${NOTIFICATION_WEBHOOK}" ]] && command -v curl &> /dev/null; then
        curl -X POST "${NOTIFICATION_WEBHOOK}" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"${status}\",\"message\":\"${message}\",\"timestamp\":\"$(date -Iseconds)\"}" \
            --silent --show-error || log "Webhook notification failed"
    fi
}

# Generate backup report
generate_report() {
    local start_time="$1"
    local end_time="$2"
    local duration=$((end_time - start_time))
    
    log "=== Backup Report ==="
    log "Database: ${DB_NAME}"
    log "Timestamp: ${TIMESTAMP}"
    log "Duration: ${duration} seconds"
    log "Compression: ${COMPRESSION}"
    log "Retention: ${RETENTION_DAYS} days"
    
    # Count total backups
    if [[ "${COMPRESSION}" == "true" ]]; then
        BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "trueface_backup_*.tar.gz" -type f | wc -l)
    else
        BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "trueface_backup_*" -type d | wc -l)
    fi
    log "Total backups: ${BACKUP_COUNT}"
    
    # Disk usage
    TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
    log "Total backup size: ${TOTAL_SIZE}"
    log "=================="
}

# Main backup process
main() {
    local start_time=$(date +%s)
    
    log "Starting TrueFace database backup process..."
    log "Configuration:"
    log "  Database: ${DB_NAME}"
    log "  Host: ${MONGO_HOST}:${MONGO_PORT}"
    log "  User: ${MONGO_USER}"
    log "  Backup directory: ${BACKUP_DIR}"
    log "  Compression: ${COMPRESSION}"
    log "  Retention: ${RETENTION_DAYS} days"
    
    # Check dependencies
    check_dependencies
    
    # Create backup directory
    create_backup_dir
    
    # Perform backup
    backup_database
    
    # Compress if enabled
    compress_backup
    
    # Validate backup
    validate_backup
    
    # Clean up old backups
    cleanup_old_backups
    
    local end_time=$(date +%s)
    
    # Generate report
    generate_report "${start_time}" "${end_time}"
    
    log "Database backup process completed successfully!"
    
    # Send success notification
    send_notification "SUCCESS" "Database backup completed successfully at $(date)"
}

# Error handling
trap 'error "Backup process interrupted"' INT TERM
trap 'send_notification "FAILED" "Database backup failed at $(date). Check logs for details."' ERR

# Run main process
main "$@"
