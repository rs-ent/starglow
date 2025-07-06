export default function ModerationDashboard() {
    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                    Content Moderation
                </h1>
                <p className="text-gray-600">
                    Manage community content and enforce policies
                </p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Moderation System Status
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-green-800">
                            Bad Words Filter
                        </h3>
                        <p className="text-2xl font-bold text-green-600">
                            Active
                        </p>
                        <p className="text-sm text-green-600">
                            LDNOOBW integration enabled
                        </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-800">
                            Spam Detection
                        </h3>
                        <p className="text-2xl font-bold text-blue-600">
                            Active
                        </p>
                        <p className="text-sm text-blue-600">
                            Pattern-based filtering
                        </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-purple-800">
                            Auto Reports
                        </h3>
                        <p className="text-2xl font-bold text-purple-600">
                            Enabled
                        </p>
                        <p className="text-sm text-purple-600">
                            Automated violation reporting
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
