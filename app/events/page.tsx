import Events from "@/components/events/Events";

import type { Metadata } from "next";


export const metadata: Metadata = {
    title: "Events | Starglow",
    description: "Discover upcoming events, concerts, fanmeetings, and more",
};

export default function EventsPage() {
    return <Events />;
}
