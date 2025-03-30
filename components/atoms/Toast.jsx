/// components/atoms/Toast.jsx

"use client";

import { Toaster } from "sonner";

export default function Toast() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                classNames: {
                    success: 'bg-green-500 text-white',
                    error: 'bg-red-500 text-white',
                    warning: 'bg-yellow-400 text-black',
                    info: 'bg-blue-500 text-white',
                },
                style: {
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    padding: '12px 16px',
                },
            }}
        />
    )
}