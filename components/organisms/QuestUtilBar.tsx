/// components/organisms/QuestUtilBar.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "../atoms/Icon";
import { Home } from "lucide-react";
import Funds from "../atoms/Funds";
import Popup from "../atoms/Popup";

export default function QuestUtilBar() {
    const [showPopup, setShowPopup] = useState(false);
    const router = useRouter();

    const handleHomeClick = () => setShowPopup(true);
    const handleConfirm = () => router.push("/");
    const handleCancel = () => setShowPopup(false);

    return (
        <>
            <div className="flex items-center justify-between w-full">
                <div>
                    <Icon
                        icon={Home}
                        onClick={handleHomeClick}
                        size={30}
                        className="text-foreground cursor-pointer"
                    />
                </div>
                <div className="flex items-center">
                    <Funds
                        funds={1000}
                        fundsLabel="Total Funds"
                        fundsIcon="/funds/point.svg"
                        frameSize={20}
                        textSize={15}
                        gapSize={10}
                    />
                </div>
            </div>

            <Popup width="350px" open={showPopup} onClose={handleCancel}>
                <div className="p-4 text-center">
                    <p className="text-lg font-semibold mb-4">Are you sure?</p>
                    <p className="text-sm text-muted-foreground mb-6">
                        Returning to the main screen.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                            onClick={handleConfirm}
                        >
                            Confirm
                        </button>
                        <button
                            className="px-4 py-2 bg-muted text-muted-foreground rounded-md"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Popup>
        </>
    );
}
