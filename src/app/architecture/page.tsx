import hqData from '../../../data/hq-data.json';

export default function ArchitecturePage() {
  const { architecture } = hqData;

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Architecture & Data</h1>
        <p className="text-gray-400 mt-1">System overview and technical documentation</p>
      </div>

      {/* Overview */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">System Overview</h2>
        <p className="text-gray-300 mb-6">{architecture.overview}</p>

        <div className="bg-dark-bg rounded-lg p-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl mb-2">📱</div>
              <div className="font-medium">Mobile App</div>
              <div className="text-sm text-gray-400">React Native + Expo</div>
            </div>
            <div>
              <div className="text-3xl mb-2">🔥</div>
              <div className="font-medium">Backend</div>
              <div className="text-sm text-gray-400">Firebase + Cloud Functions</div>
            </div>
            <div>
              <div className="text-3xl mb-2">🖥️</div>
              <div className="font-medium">Admin Portal</div>
              <div className="text-sm text-gray-400">Next.js</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-dark-border">
            <div className="text-center">
              <div className="text-xl mb-2">🔄</div>
              <div className="font-medium">Marketplace Flow</div>
              <div className="text-sm text-gray-400 mt-2">
                Organizer ↔ Events ↔ Offers ↔ Provider
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Structure */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Directory Structure</h2>
        <div className="bg-dark-bg rounded-lg overflow-hidden">
          {architecture.directories.map((dir, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 px-4 py-3 border-b border-dark-border last:border-0"
            >
              <code className="text-accent font-mono text-sm min-w-[160px]">{dir.path}</code>
              <span className="text-gray-400 text-sm">{dir.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Firebase Collections */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Firebase Collections</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Collection</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Description</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Indexes</th>
              </tr>
            </thead>
            <tbody>
              {architecture.firebaseCollections.map((col, idx) => (
                <tr key={idx} className="border-b border-dark-border last:border-0">
                  <td className="px-4 py-3">
                    <code className="text-accent text-sm">{col.name}</code>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{col.description}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {col.indexes.map((idx, i) => (
                        <span key={i} className="text-xs bg-dark-bg px-2 py-0.5 rounded text-gray-400">
                          {idx}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Marketplace Category Model */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Marketplace Category Model</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hqData.marketplaceCategories.slice(0, 4).map((cat) => (
            <div key={cat.id} className="bg-dark-bg rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{cat.name}</span>
                <code className="text-xs text-gray-500">{cat.slug}</code>
              </div>
              {cat.subcategories && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {cat.subcategories.map((sub) => (
                    <span key={sub.id} className="text-xs bg-dark-card px-2 py-1 rounded">
                      {sub.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack Quick Reference */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Tech Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'React Native', version: '0.74.x', note: 'Expo SDK 51' },
            { name: 'TypeScript', version: '5.x', note: 'Strict mode' },
            { name: 'Firebase', version: '10.x', note: 'Modular SDK' },
            { name: 'Next.js', version: '14.x', note: 'App Router' },
          ].map((tech, idx) => (
            <div key={idx} className="bg-dark-bg rounded-lg p-4 text-center">
              <div className="font-medium">{tech.name}</div>
              <div className="text-accent text-sm">{tech.version}</div>
              <div className="text-xs text-gray-500 mt-1">{tech.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
