"use client";

interface ActiveWalletsProps {
    walletsCount: number | null;
    isLoading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
    lastUpdated?: Date | null;
}

export default function ActiveWallets({
    walletsCount,
    isLoading = false,
    error = null,
    onRefresh,
    lastUpdated,
}: ActiveWalletsProps) {
    if (error) {
        return (
            <div className="bg-gradient-to-br from-red-900/90 to-red-800/90 rounded-2xl p-8 border border-red-700/50 backdrop-blur-sm max-w-md mx-auto shadow-2xl">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-red-200 mb-2">
                        Data Error
                    </h2>
                    <p className="text-red-300 text-sm mb-4">{error}</p>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors duration-200"
                        >
                            Retry
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm max-w-md mx-auto shadow-2xl">
            <div className="text-center">
                {/* Fixed header layout */}
                <div className="flex items-center justify-between mb-6 gap-4">
                    <div className="flex-1" />
                    <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                        ACTIVE WALLETS
                    </h2>
                    <div className="flex-1 flex justify-end">
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="group relative p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh Data"
                        >
                            <svg
                                className={`w-5 h-5 text-slate-300 group-hover:text-white transition-transform duration-200 ${
                                    isLoading
                                        ? "animate-spin"
                                        : "group-hover:rotate-180"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Icon and metrics section */}
                <div className="mb-6">
                    <div className="text-4xl font-bold text-white mb-2">
                        {walletsCount?.toLocaleString() || "0"}
                    </div>
                </div>

                {/* Footer section */}
                <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                        <p className="text-slate-400 text-xs">
                            Total active wallets
                        </p>
                        {lastUpdated && (
                            <div className="text-slate-500 text-xs">
                                {lastUpdated.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
