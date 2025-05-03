/// app/admin/assets/page.tsx

import AssetsDashboard from "@/components/admin/assets/Assets.Dashboard";
import { Card, CardContent } from "@/components/ui/card";

export default function AssetsPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-foreground">
                    Assets Management
                </h1>
            </div>
            <Card className="bg-card">
                <CardContent className="p-6">
                    <AssetsDashboard />
                </CardContent>
            </Card>
        </div>
    );
}
