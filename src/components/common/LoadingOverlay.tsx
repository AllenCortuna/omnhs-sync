import React from "react";

const LoadingOverlay = () => {
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-sm flex justify-center items-center z-50 martian-mono">
            <div className="bg-white/80 rounded-2xl shadow-xl p-8 text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-spacing-8 border-t-primary border-r-base-100 border-b-primary border-l-base-100 animate-spin">
                        <div className="absolute inset-2 rounded-full border-8 border-t-base-100 border-r-primary border-b-base-100 border-l-primary animate-spin-slow">
                        </div>
                    </div>
                </div>
                <p className="text-sm font-bold bg-gradient-to-r from-neutral-700 to-neutral-800 bg-clip-text text-transparent animate-pulse">
                    Loading...
                </p>
            </div>
        </div>
    );
};

export default LoadingOverlay;