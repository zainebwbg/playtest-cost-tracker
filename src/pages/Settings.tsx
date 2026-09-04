export function Settings() {
  return (
    <div>
      <div className="px-8 py-6 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Configure your Airtable connection
        </p>
      </div>

      <div className="px-8 py-6 space-y-6 max-w-2xl">
        {/* Airtable setup */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            Airtable Configuration
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            This app reads from Airtable via environment variables set at build
            time. To update credentials:
          </p>
          <ol className="space-y-3 text-sm text-gray-700 list-decimal pl-4">
            <li>
              Copy{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">.env.example</code>{" "}
              to{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">.env</code> in
              the project root.
            </li>
            <li>
              Create a Personal Access Token at{" "}
              <a
                href="https://airtable.com/account"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                airtable.com/account
              </a>{" "}
              → Developer hub → Personal access tokens. Required scopes:{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">
                data.records:read
              </code>
              ,{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">
                data.records:write
              </code>
              ,{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">
                schema.bases:read
              </code>
              .
            </li>
            <li>
              Set{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">
                VITE_AIRTABLE_API_KEY
              </code>{" "}
              and{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">
                VITE_AIRTABLE_BASE_ID
              </code>{" "}
              in your <code className="bg-gray-100 px-1 rounded text-xs">.env</code>{" "}
              file.
            </li>
            <li>
              Run{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">npm run dev</code>{" "}
              locally or rebuild and redeploy for production.
            </li>
          </ol>
        </div>

        {/* Airtable schema */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            Required Airtable Schema
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Create the following tables in your Airtable base with these exact
            field names:
          </p>
          {[
            {
              table: "Games",
              fields: [
                "Name (Single line text)",
                "Description (Long text)",
                "Status (Single select: Active, On Hold, Shipped, Cancelled)",
                "Current Phase (Single select: Discovery, Pre-Alpha, Alpha, Beta, Gold, Launch)",
                "Studio (Single line text)",
                "Target Launch Date (Date)",
              ],
            },
            {
              table: "Product Goals",
              fields: [
                "Name (Single line text)",
                "Description (Long text)",
                "Game (Link to Games table)",
                "Priority (Single select: High, Medium, Low)",
              ],
            },
            {
              table: "Player Experience Goals",
              fields: [
                "Name (Single line text)",
                "Description (Long text)",
                "Product Goal (Link to Product Goals table)",
                "Development Phase (Single select: Discovery, Pre-Alpha, Alpha, Beta, Gold, Launch)",
                "Status (Single select: Not Started, Planning, In Progress, Measuring, Complete)",
                "Forecasted Cost (Currency)",
                "Notes (Long text)",
              ],
            },
            {
              table: "Studies",
              fields: [
                "Name (Single line text)",
                "Player Experience Goal (Link to Player Experience Goals table)",
                "Type (Single select: Playtest, Survey, Interview, Diary Study, Analytics Review, Heuristic Evaluation)",
                "Status (Single select: Planned, In Progress, Complete, Cancelled)",
                "Date (Date)",
                "Actual Cost (Currency)",
                "Forecasted Cost (Currency)",
                "Insights (Long text)",
                "Participants (Number)",
              ],
            },
          ].map((t) => (
            <div key={t.table} className="mb-5 last:mb-0">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {t.table}
              </h3>
              <ul className="space-y-1">
                {t.fields.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-blue-400 mt-0.5">·</span>
                    <code className="leading-relaxed">{f}</code>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Current env status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">
            Current Configuration Status
          </h2>
          {[
            {
              key: "VITE_AIRTABLE_API_KEY",
              value: import.meta.env.VITE_AIRTABLE_API_KEY as string,
            },
            {
              key: "VITE_AIRTABLE_BASE_ID",
              value: import.meta.env.VITE_AIRTABLE_BASE_ID as string,
            },
          ].map(({ key, value }) => {
            const set = Boolean(value && !value.includes("XXXX"));
            return (
              <div
                key={key}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <code className="text-xs text-gray-700">{key}</code>
                <span
                  className={`text-xs font-medium ${
                    set ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {set ? "Configured" : "Not set"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
