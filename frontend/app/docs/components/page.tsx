import DocsLayout from '@/components/DocsLayout';

export default function ComponentsDocsPage() {
  return (
    <DocsLayout
      title="Components"
      description="Reference for core UI components and hooks used in the TrueFace frontend"
    >
      <div className="docs-content max-w-none">
        <h2>Overview</h2>
        <p>
          This page documents the core components and hooks that power the TrueFace frontend.
          It focuses on usage, props, and best practices. Examples are simplified to avoid
          external dependencies and are safe to copy into your project.
        </p>

        <h2>Components</h2>

        <h3>CameraCapture</h3>
        <p>
          CameraCapture handles requesting camera permissions, rendering the live preview,
          capturing a frame as a base64 image, and emitting the data via a callback.
        </p>
        <h4>Usage</h4>
        <pre><code>{`import CameraCapture from '@/components/CameraCapture';

export default function SignupPage() {
  const handleCapture = (imageData) => {
    // imageData is a base64 data URL string
    console.log('Captured image length:', imageData?.length);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Enroll your face</h1>
      <CameraCapture onCapture={handleCapture} />
    </div>
  );
}`}</code></pre>
        <h4>Props</h4>
        <ul>
          <li><strong>onCapture</strong>: function(imageData: string) → void</li>
          <li><strong>screenshotFormat</strong>: "image/jpeg" | "image/png" | "image/webp" (default: "image/jpeg")</li>
          <li><strong>onError</strong>: function(message: string) → void</li>
        </ul>

        <h3>DocsLayout</h3>
        <p>
          Shared documentation layout that provides the sidebar, header, and consistent spacing.
        </p>
        <h4>Usage</h4>
        <pre><code>{`import DocsLayout from '@/components/DocsLayout';

export default function Page() {
  return (
    <DocsLayout title="My Doc" description="Example page">
      <div className="docs-content">
        <h2>Title</h2>
        <p>Content goes here...</p>
      </div>
    </DocsLayout>
  );
}`}</code></pre>

        <h2>Hooks</h2>

        <h3>useAuth</h3>
        <p>
          Access the current auth state, user info, and methods for login/logout.
        </p>
        <h4>Example</h4>
        <pre><code>{`import { useAuth } from '@/hooks/useAuth';

export function ProfileSummary() {
  const { user, logout, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;
  return (
    <div>
      <p>Name: {user.name}</p>
      <button onClick={logout} className="px-3 py-2 bg-gray-900 text-white rounded">Logout</button>
    </div>
  );
}`}</code></pre>

        <h3>useApi</h3>
        <p>
          Thin wrapper around fetch with auth headers, error handling, and strongly typed endpoints
          where available.
        </p>
        <h4>Example</h4>
        <pre><code>{`import { useApi } from '@/hooks/useApi';

export function SessionsList() {
  const { getSessions } = useApi();
  const [sessions, setSessions] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      const res = await getSessions();
      setSessions(res.sessions ?? []);
    })();
  }, [getSessions]);

  return (
    <ul>
      {sessions.map((s) => (
        <li key={s.session_id}>{s.session_id} — {s.current ? 'current' : 'other'}</li>
      ))}
    </ul>
  );
}`}</code></pre>

        <h2>Best Practices</h2>
        <ul>
          <li>Always handle camera permission errors and provide clear UI fallbacks.</li>
          <li>Validate image size and format before uploading.</li>
          <li>Use development mode without DB for quick iteration when needed.</li>
          <li>Keep components small and focused; lift API logic into hooks.</li>
        </ul>
      </div>
    </DocsLayout>
  );
}

