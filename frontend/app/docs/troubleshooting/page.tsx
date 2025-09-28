import DocsLayout from '@/components/DocsLayout';
import Link from 'next/link';

export default function TroubleshootingPage() {
  return (
    <DocsLayout
      title="Troubleshooting"
      description="Common issues and their solutions for TrueFace deployment and development"
    >
      <div className="space-y-8">
        <div className="docs-content max-w-none">
          <h2>Overview</h2>
          <p>
            This troubleshooting guide covers common issues you might encounter when installing, 
            developing, or deploying TrueFace. Solutions are organized by category and include 
            step-by-step instructions.
          </p>

          <h3>Quick Diagnosis</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h4 className="text-lg font-medium text-blue-900 mb-3">Before You Start</h4>
            <ul className="text-blue-800 space-y-2 list-disc pl-6">
              <li>Check system requirements: Python 3.11+, Node.js 18.x</li>
              <li>Verify network connectivity and firewall settings</li>
              <li>Review error messages in terminal output</li>
              <li>Check Docker and container status if using Docker</li>
              <li>Try development mode: <code className="bg-blue-100 px-2 py-1 rounded text-sm">DEV_MODE_NO_DB=true</code></li>
            </ul>
          </div>

          <h2>Installation Issues</h2>

          <h3>Python Version Error</h3>
          <p><strong>Problem:</strong> Python version 3.11+ required</p>
          <p><strong>Symptoms:</strong></p>
          <ul>
            <li>Error during backend setup</li>
            <li>Package installation failures</li>
            <li>Import errors in Python code</li>
          </ul>
          
          <p><strong>Solutions:</strong></p>
          <h4>Check Current Version:</h4>
          <pre><code>{`python --version
python3 --version`}</code></pre>

          <h4>Install Python 3.11+ (Ubuntu/Debian):</h4>
          <pre><code>{`sudo apt update
sudo apt install software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt install python3.11 python3.11-venv python3.11-dev`}</code></pre>

          <h4>Install Python 3.11+ (macOS):</h4>
          <pre><code>{`# Using Homebrew
brew install python@3.11

# Using pyenv (recommended)
pyenv install 3.11.0
pyenv global 3.11.0`}</code></pre>

          <h3>Node.js Version Error</h3>
          <p><strong>Problem:</strong> Node.js 18.x required for Next.js</p>
          
          <h4>Install Node Version Manager:</h4>
          <pre><code>{`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc`}</code></pre>

          <h4>Install and Use Node.js 18:</h4>
          <pre><code>{`nvm install 18
nvm use 18
nvm alias default 18
node --version  # Should show v18.x.x`}</code></pre>

          <h2>Runtime Issues</h2>

          <h3>Database Connection Failed</h3>
          <p><strong>Problem:</strong> Database unavailable. Please start MongoDB or check MONGO_URI</p>
          
          <h4>1. Use Development Mode (Quick Fix):</h4>
          <pre><code>DEV_MODE_NO_DB=true uvicorn main:app --reload</code></pre>

          <h4>2. Install Local MongoDB:</h4>
          <pre><code>{`# Ubuntu/Debian
sudo apt install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
sudo systemctl status mongodb

# macOS
brew install mongodb-community
brew services start mongodb-community
brew services list | grep mongodb`}</code></pre>

          <h4>3. Use Docker MongoDB:</h4>
          <pre><code>{`docker run -d -p 27017:27017 --name mongo mongo:6.0
docker ps  # Verify container is running`}</code></pre>

          <h3>Face Recognition Errors</h3>
          <p><strong>Problem:</strong> No face detected or Invalid image format</p>
          
          <p><strong>Solutions:</strong></p>
          <h4>1. Check Image Requirements:</h4>
          <ul>
            <li><strong>Supported formats:</strong> JPEG, PNG, WebP, GIF</li>
            <li><strong>Maximum size:</strong> 10MB</li>
            <li><strong>Face visibility:</strong> Clear, well-lit face</li>
            <li><strong>Face position:</strong> Centered, not at extreme angles</li>
          </ul>

          <h4>2. Test with Known Good Image:</h4>
          <pre><code>{`# Use a clear, well-lit face photo
curl -X POST http://localhost:8000/api/auth/signup \\
  -F "image=@clear_face_photo.jpg" \\
  -F "name=Test User" \\
  -F "email=test@example.com"`}</code></pre>

          <h4>3. Enable Test Mode (Relaxed Validation):</h4>
          <pre><code>TEST_MODE=true uvicorn main:app --reload</code></pre>

          <h4>4. Check Camera Permissions:</h4>
          <ul>
            <li><strong>HTTPS Required:</strong> Browsers block camera on HTTP in production</li>
            <li><strong>User Permission:</strong> Browser will prompt for camera access</li>
            <li><strong>Supported Browsers:</strong> Chrome, Firefox, Safari, Edge</li>
            <li><strong>Development:</strong> localhost works without HTTPS</li>
          </ul>

          <h2>Docker Issues</h2>

          <h3>Container Build Failures</h3>
          <p><strong>Problem:</strong> Docker build fails or containers won&apos;t start</p>
          
          <h4>1. Check Docker Status:</h4>
          <pre><code>{`docker info
docker-compose version
systemctl status docker`}</code></pre>

          <h4>2. Build with Verbose Output:</h4>
          <pre><code>{`docker-compose build --no-cache --progress=plain
docker build -f backend/Dockerfile.prod -t trueface-backend:latest backend/ --no-cache`}</code></pre>

          <h4>3. Clean Docker System:</h4>
          <pre><code>{`# Remove unused containers, networks, images
docker system prune -a

# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune -a`}</code></pre>

          <h3>Port Conflicts</h3>
          <p><strong>Problem:</strong> Port already in use</p>
          
          <h4>1. Find Process Using Port:</h4>
          <pre><code>{`# Check what's using the port
lsof -i :3000
lsof -i :8000
netstat -tulpn | grep :3000`}</code></pre>

          <h4>2. Kill Process:</h4>
          <pre><code>{`# Kill process by PID
kill -9 <PID>

# Kill process by port (Linux)
sudo fuser -k 3000/tcp`}</code></pre>

          <h2>Getting Help</h2>

          <h3>Collecting Debug Information</h3>
          <p>When reporting issues, include:</p>
          <pre><code>{`# System information
uname -a
docker --version
docker-compose --version
python --version
node --version

# Resource usage
df -h
free -h
docker system df

# Application logs
docker-compose logs --tail=100 backend frontend

# System logs
journalctl -u docker --since "1 hour ago"`}</code></pre>

          <h3>Creating Bug Reports</h3>
          <p>Include in your bug report:</p>
          <ol>
            <li><strong>Environment Details</strong> - Operating system, versions, hardware</li>
            <li><strong>Steps to Reproduce</strong> - Exact commands and configuration</li>
            <li><strong>Expected vs Actual Behavior</strong> - What should vs what actually happens</li>
            <li><strong>Error Messages and Logs</strong> - Complete error messages and stack traces</li>
            <li><strong>Workarounds</strong> - Any temporary fixes or alternatives tried</li>
          </ol>

          <h2>Additional Resources</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
          <Link
            href="/docs/getting-started"
            className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all hover:border-blue-200 group"
          >
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 mb-2">
              Getting Started
            </h3>
            <p className="text-gray-800 group-hover:text-gray-900">
              Go back to installation and setup instructions.
            </p>
          </Link>

          <Link
            href="/docs"
            className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all hover:border-blue-200 group"
          >
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 mb-2">
              Documentation
            </h3>
            <p className="text-gray-800 group-hover:text-gray-900">
              Browse all documentation and guides.
            </p>
          </Link>
        </div>

        <div className="docs-content max-w-none">
          <h2>Community Support</h2>
          <p>
            If you can&apos;t find a solution here, search existing issues on GitHub, 
            create a detailed issue with reproduction steps, or join community discussions 
            for help from other users.
          </p>
          <p>
            Remember to search existing issues before creating new ones, and provide as 
            much detail as possible when asking for help!
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
