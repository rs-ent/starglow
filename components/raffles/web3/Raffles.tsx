/// components/raffles/web3/Raffles.tsx

"use client";

import { memo } from "react";

function Raffles() {
    return (
        <div
            style={{
                padding: "20px",
                backgroundColor: "#1a1a1a",
                color: "white",
                minHeight: "100vh",
            }}
        >
            <h1>Test Page</h1>
            <p>Raffles component is working!</p>
            <p>If you see this, the basic component structure is fine.</p>
        </div>
    );
}

export default memo(Raffles);
