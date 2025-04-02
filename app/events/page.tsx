import { Metadata } from "next";
import Events from "@/components/templates/Events";

export const metadata: Metadata = {
    title: "Events | Starglow",
    description: "Discover upcoming events, concerts, fanmeetings, and more",
};

export default function EventsPage() {
    return <Events events={[]} />;
}
