// MongoDB Initialization Script for TrueFace
// This script runs when the MongoDB container first starts
// It creates the application database and users with proper permissions

// Switch to the admin database for user creation
db = db.getSiblingDB('admin');

print('🚀 Initializing TrueFace MongoDB...');

// Create application user with read/write permissions
try {
    db.createUser({
        user: 'trueface_app',
        pwd: process.env.MONGO_APP_PASSWORD || 'changeme789',
        roles: [
            {
                role: 'readWrite',
                db: 'trueface_prod'
            }
        ]
    });
    print('✅ Created application user: trueface_app');
} catch (error) {
    print('⚠️  Application user already exists or error occurred:', error.message);
}

// Create read-only user for monitoring and backups
try {
    db.createUser({
        user: 'trueface_readonly',
        pwd: process.env.MONGO_READONLY_PASSWORD || 'readonly123',
        roles: [
            {
                role: 'read',
                db: 'trueface_prod'
            }
        ]
    });
    print('✅ Created read-only user: trueface_readonly');
} catch (error) {
    print('⚠️  Read-only user already exists or error occurred:', error.message);
}

// Switch to the application database
db = db.getSiblingDB('trueface_prod');

print('📄 Initializing TrueFace database schema...');

// Create collections with validation schemas
try {
    // Users collection
    db.createCollection('users', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['name', 'email', 'faces', 'created_at'],
                properties: {
                    name: {
                        bsonType: 'string',
                        maxLength: 100,
                        description: 'User full name - required string, max 100 characters'
                    },
                    email: {
                        bsonType: 'string',
                        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                        maxLength: 254,
                        description: 'User email address - required valid email format'
                    },
                    faces: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'array',
                            description: 'Face embedding vector'
                        },
                        description: 'Array of face embedding vectors'
                    },
                    created_at: {
                        bsonType: 'date',
                        description: 'User creation timestamp - required date'
                    },
                    disabled: {
                        bsonType: 'bool',
                        description: 'Whether user account is disabled'
                    },
                    disabled_reason: {
                        bsonType: 'string',
                        maxLength: 500,
                        description: 'Reason for account disable'
                    },
                    disabled_at: {
                        bsonType: 'date',
                        description: 'When account was disabled'
                    }
                }
            }
        }
    });
    print('✅ Created users collection with validation');
} catch (error) {
    print('⚠️  Users collection already exists or error occurred:', error.message);
}

try {
    // Sessions collection
    db.createCollection('sessions', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['user_id', 'created_at', 'expires_at', 'active'],
                properties: {
                    user_id: {
                        bsonType: 'objectId',
                        description: 'Reference to user - required ObjectId'
                    },
                    created_at: {
                        bsonType: 'date',
                        description: 'Session creation timestamp - required date'
                    },
                    expires_at: {
                        bsonType: 'date',
                        description: 'Session expiration timestamp - required date'
                    },
                    active: {
                        bsonType: 'bool',
                        description: 'Whether session is active - required boolean'
                    }
                }
            }
        }
    });
    print('✅ Created sessions collection with validation');
} catch (error) {
    print('⚠️  Sessions collection already exists or error occurred:', error.message);
}

try {
    // Logs collection
    db.createCollection('logs', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['user_id', 'action', 'timestamp'],
                properties: {
                    user_id: {
                        bsonType: 'objectId',
                        description: 'Reference to user - required ObjectId'
                    },
                    action: {
                        bsonType: 'string',
                        enum: ['signup', 'login', 'logout', 'enroll', 'verify', 'recognize', 'admin_disable'],
                        description: 'Action type - required enum value'
                    },
                    timestamp: {
                        bsonType: 'date',
                        description: 'Action timestamp - required date'
                    },
                    confidence: {
                        bsonType: 'double',
                        minimum: 0.0,
                        maximum: 1.0,
                        description: 'Recognition confidence score (0.0-1.0)'
                    },
                    metadata: {
                        bsonType: 'object',
                        description: 'Additional action metadata'
                    },
                    success: {
                        bsonType: 'bool',
                        description: 'Whether action was successful'
                    }
                }
            }
        }
    });
    print('✅ Created logs collection with validation');
} catch (error) {
    print('⚠️  Logs collection already exists or error occurred:', error.message);
}

try {
    // Admin users collection
    db.createCollection('admin_users', {
        validator: {
            $jsonSchema: {
                bsonType: 'object',
                required: ['username', 'password_hash', 'email', 'created_at'],
                properties: {
                    username: {
                        bsonType: 'string',
                        minLength: 3,
                        maxLength: 50,
                        description: 'Admin username - required string, 3-50 characters'
                    },
                    password_hash: {
                        bsonType: 'string',
                        description: 'Hashed password - required string'
                    },
                    email: {
                        bsonType: 'string',
                        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                        maxLength: 254,
                        description: 'Admin email address - required valid email format'
                    },
                    created_at: {
                        bsonType: 'date',
                        description: 'Admin creation timestamp - required date'
                    },
                    last_login: {
                        bsonType: 'date',
                        description: 'Last login timestamp'
                    }
                }
            }
        }
    });
    print('✅ Created admin_users collection with validation');
} catch (error) {
    print('⚠️  Admin users collection already exists or error occurred:', error.message);
}

// Create indexes for performance
print('📚 Creating database indexes...');

// Users collection indexes
try {
    db.users.createIndex({ email: 1 }, { unique: true, background: true });
    db.users.createIndex({ created_at: -1 }, { background: true });
    db.users.createIndex({ disabled: 1 }, { background: true });
    print('✅ Created users collection indexes');
} catch (error) {
    print('⚠️  Users indexes already exist or error occurred:', error.message);
}

// Sessions collection indexes
try {
    db.sessions.createIndex({ user_id: 1 }, { background: true });
    db.sessions.createIndex({ expires_at: 1 }, { background: true });
    db.sessions.createIndex({ active: 1 }, { background: true });
    db.sessions.createIndex({ created_at: -1 }, { background: true });
    // TTL index to automatically remove expired sessions
    db.sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0, background: true });
    print('✅ Created sessions collection indexes');
} catch (error) {
    print('⚠️  Sessions indexes already exist or error occurred:', error.message);
}

// Logs collection indexes
try {
    db.logs.createIndex({ user_id: 1 }, { background: true });
    db.logs.createIndex({ timestamp: -1 }, { background: true });
    db.logs.createIndex({ action: 1 }, { background: true });
    db.logs.createIndex({ user_id: 1, timestamp: -1 }, { background: true });
    print('✅ Created logs collection indexes');
} catch (error) {
    print('⚠️  Logs indexes already exist or error occurred:', error.message);
}

// Admin users collection indexes
try {
    db.admin_users.createIndex({ username: 1 }, { unique: true, background: true });
    db.admin_users.createIndex({ email: 1 }, { unique: true, background: true });
    print('✅ Created admin_users collection indexes');
} catch (error) {
    print('⚠️  Admin users indexes already exist or error occurred:', error.message);
}

// Create default admin user if it doesn't exist
try {
    const existingAdmin = db.admin_users.findOne({ username: 'admin' });
    if (!existingAdmin) {
        // Default admin password hash for 'admin123' (should be changed in production)
        const defaultPasswordHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
        
        db.admin_users.insertOne({
            username: 'admin',
            password_hash: defaultPasswordHash,
            email: 'admin@trueface.local',
            created_at: new Date(),
            last_login: null
        });
        print('✅ Created default admin user (username: admin, password: admin123)');
        print('⚠️  IMPORTANT: Change the default admin password in production!');
    } else {
        print('✅ Default admin user already exists');
    }
} catch (error) {
    print('❌ Error creating default admin user:', error.message);
}

print('🎉 TrueFace MongoDB initialization completed!');
print('');
print('📊 Database Summary:');
print('  - Database: trueface_prod');
print('  - Collections: users, sessions, logs, admin_users');
print('  - Users: trueface_app (read/write), trueface_readonly (read-only)');
print('  - Indexes: Created for optimal query performance');
print('  - Validation: Schema validation enabled for data integrity');
print('');
print('🔐 Security Notes:');
print('  - Change default passwords in production');
print('  - Use environment variables for sensitive data');
print('  - Enable SSL/TLS for MongoDB connections');
print('  - Regularly backup your database');
print('');
