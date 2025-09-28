import DocsLayout from '@/components/DocsLayout';

export default function APIReferencePage() {
  return (
    <DocsLayout
      title="API Reference"
      description="Complete REST API documentation for TrueFace backend services"
    >
      <div className="docs-content max-w-none">
        <h2>Overview</h2>
        <p>
          The TrueFace API provides face recognition authentication services. All endpoints
          return JSON responses and use standard HTTP status codes.
        </p>

        <h3>Base URL</h3>
        <pre><code>http://localhost:8000  # Development
https://your-domain.com  # Production</code></pre>

        <h3>Authentication</h3>
        <p>
          Most endpoints require authentication using JWT Bearer tokens:
        </p>
        <pre><code>Authorization: Bearer &lt;your-jwt-token&gt;</code></pre>

        <h3>Content Types</h3>
        <ul>
          <li><strong>JSON requests</strong>: Content-Type: application/json</li>
          <li><strong>File uploads</strong>: Content-Type: multipart/form-data</li>
          <li><strong>Responses</strong>: Content-Type: application/json</li>
        </ul>

        <h2>Authentication Endpoints</h2>

        <h3>POST /api/auth/signup</h3>
        <p>Create a new user account with face enrollment.</p>
        
        <h4>Request:</h4>
        <pre><code>curl -X POST http://localhost:8000/api/auth/signup \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "image=@face_photo.jpg"</code></pre>

        <h4>Parameters:</h4>
        <ul>
          <li><code>name</code> (string, required): User's full name</li>
          <li><code>email</code> (string, required): Valid email address</li>
          <li><code>image</code> (file, required): Face image (JPEG, PNG, WebP, GIF)</li>
        </ul>

        <h4>Response:</h4>
        <pre><code>{`{
  "user_id": "507f1f77bcf86cd799439011",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}`}</code></pre>

        <h3>POST /api/auth/login</h3>
        <p>Authenticate user with face recognition.</p>

        <h4>Request:</h4>
        <pre><code>curl -X POST http://localhost:8000/api/auth/login \
  -F "image=@face_photo.jpg"</code></pre>

        <h4>Parameters:</h4>
        <ul>
          <li><code>image</code> (file, required): Face image for authentication</li>
        </ul>

        <h4>Response:</h4>
        <pre><code>{`{
  "match": {
    "user_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "confidence": 0.95,
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}`}</code></pre>

        <h3>POST /api/auth/logout</h3>
        <p>Revoke the current session.</p>

        <h4>Headers:</h4>
        <pre><code>Authorization: Bearer &lt;token&gt;</code></pre>

        <h4>Response:</h4>
        <pre><code>{`{
  "revoked": true
}`}</code></pre>

        <h2>User Management Endpoints</h2>

        <h3>GET /api/user/profile</h3>
        <p>Get the current user's profile information.</p>

        <h4>Headers:</h4>
        <pre><code>Authorization: Bearer &lt;token&gt;</code></pre>

        <h4>Response:</h4>
        <pre><code>{`{
  "profile": {
    "user_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "face_count": 2,
    "created_at": "2025-01-28T10:30:00Z"
  }
}`}</code></pre>

        <h3>GET /api/user/sessions</h3>
        <p>Get the user's active sessions.</p>

        <h4>Headers:</h4>
        <pre><code>Authorization: Bearer &lt;token&gt;</code></pre>

        <h4>Response:</h4>
        <pre><code>{`{
  "sessions": [
    {
      "session_id": "sess_123",
      "created_at": "2025-01-28T10:30:00Z",
      "expires_at": "2025-01-28T11:30:00Z",
      "current": true
    }
  ]
}`}</code></pre>

        <h3>POST /api/user/sessions/revoke-all</h3>
        <p>Revoke all sessions except the current one.</p>

        <h4>Headers:</h4>
        <pre><code>Authorization: Bearer &lt;token&gt;</code></pre>

        <h4>Response:</h4>
        <pre><code>{`{
  "revoked_count": 3,
  "message": "All other sessions revoked successfully"
}`}</code></pre>

        <h2>History & Analytics</h2>

        <h3>GET /api/user/history</h3>
        <p>Get user's authentication history.</p>

        <h4>Headers:</h4>
        <pre><code>Authorization: Bearer &lt;token&gt;</code></pre>

        <h4>Query Parameters:</h4>
        <ul>
          <li><code>limit</code> (optional): Number of records to return (default: 50)</li>
          <li><code>type</code> (optional): Filter by type ("login", "signup", "logout")</li>
        </ul>

        <h4>Response:</h4>
        <pre><code>{`{
  "history": [
    {
      "timestamp": "2025-01-28T10:30:00Z",
      "type": "login",
      "success": true,
      "confidence": 0.95
    }
  ]
}`}</code></pre>

        <h2>System Endpoints</h2>

        <h3>GET /health</h3>
        <p>Check system health status.</p>

        <h4>Response:</h4>
        <pre><code>{`{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-01-28T10:30:00Z"
}`}</code></pre>

        <h3>GET /metrics</h3>
        <p>Prometheus metrics endpoint (if enabled).</p>

        <h2>Error Handling</h2>
        <p>All endpoints use standard HTTP status codes:</p>
        <ul>
          <li><strong>200</strong> - Success</li>
          <li><strong>400</strong> - Bad Request (invalid parameters)</li>
          <li><strong>401</strong> - Unauthorized (invalid or missing token)</li>
          <li><strong>403</strong> - Forbidden (insufficient permissions)</li>
          <li><strong>404</strong> - Not Found</li>
          <li><strong>429</strong> - Too Many Requests (rate limited)</li>
          <li><strong>500</strong> - Internal Server Error</li>
        </ul>

        <h3>Error Response Format:</h3>
        <pre><code>{`{
  "error": "Invalid credentials",
  "code": "AUTH_FAILED",
  "timestamp": "2025-01-28T10:30:00Z"
}`}</code></pre>

        <h2>Rate Limits</h2>
        <p>API endpoints are rate-limited to prevent abuse:</p>
        <ul>
          <li><strong>Authentication endpoints</strong>: 10 requests/minute</li>
          <li><strong>File uploads</strong>: 5 requests/minute</li>
          <li><strong>General API</strong>: 100 requests/minute</li>
        </ul>

        <h2>Interactive Testing</h2>
        <p>
          For interactive API testing, visit the auto-generated Swagger UI at:
        </p>
        <pre><code>http://localhost:8000/docs</code></pre>
      </div>
    </DocsLayout>
  );
}
