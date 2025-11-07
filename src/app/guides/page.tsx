export default function GuidesPage() {
  return (
    <div className="max-w-2xl mx-auto p-8 text-white">
      <h1 className="text-3xl font-bold mb-4">Guides Feature Removed</h1>
      <p className="text-gray-400 mb-4">The guides authoring and collaboration system has been discontinued.</p>
      <ul className="list-disc list-inside text-gray-500 text-sm mb-4 space-y-1">
        <li>Existing data is no longer accessible via the UI</li>
        <li>Team & collaborative editing endpoints now return 410 Gone</li>
        <li>Focus is on AI model access and per-model usage limits</li>
      </ul>
      <p className="text-gray-500 text-sm">See the Usage & Limits page for your remaining requests.</p>
    </div>
  );
}
