import DocsLayout from '@/components/DocsLayout';
import Link from 'next/link';

export default function GettingStartedPage() {
  return (
    <DocsLayout
      title="Getting Started"
      description="Step-by-step guide to install and run TrueFace locally"
    >
      <div className="space-y-8">
        <div className="prose prose-gray max-w-none">
          <h2>Quick Start</h2>
          <p>
            Get TrueFace running locally in under 10 minutes with face recognition authentication.
          </p>
          
          <h3>Prerequisites</h3>
          <ul>
            <li>Python 3.11+</li>
            <li>Node.js 18.x</li>
            <li>MongoDB (optional - dev mode available)</li>
            <li>Git</li>
            <li>Camera (for face recognition)</li>
          </ul>

          <h3>Installation Steps</h3>
          
          <h4>1. Clone the Repository</h4>
          <pre><code>{`git clone https://github.com/yourusername/TrueFace.git
cd TrueFace`}</code></pre>

          <h4>2. Backend Setup</h4>
          <pre><code>{`cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\\Scripts\\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Start backend (development mode - no database required)
DEV_MODE_NO_DB=true uvicorn main:app --reload`}</code></pre>

          <h4>3. Frontend Setup</h4>
          <p>Open a new terminal:</p>
          <pre><code>{`cd frontend

# Install dependencies
npm install

# Start development server
npm run dev`}</code></pre>

          <h4>4. Access the Application</h4>
          <ul>
            <li>Frontend: <a href="http://localhost:3000">http://localhost:3000</a></li>
            <li>Backend API: <a href="http://localhost:8000">http://localhost:8000</a></li>
            <li>API Documentation: <a href="http://localhost:8000/docs">http://localhost:8000/docs</a></li>
          </ul>

          <p>Need more help? Check our troubleshooting guide for more solutions.</p>
        </div>
      </div>
    </DocsLayout>
  );
}
