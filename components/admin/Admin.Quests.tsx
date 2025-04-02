"use client";

import AdminBannerImages from "@/components/admin/Admin.BannerImages";

export default function AdminQuests() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-12">
                <section className=" rounded-lg shadow p-6 border-4">
                    <h1 className="text-4xl mb-4 p-4 bg-gradient-to-r from-purple-950 to-black/0">
                        Missions
                    </h1>
                    <AdminBannerImages />
                    <p className="border-t my-1 text-gray-500" />
                </section>

                {/* 추후 다른 관리 섹션들을 여기에 추가할 수 있습니다 */}
            </div>
        </div>
    );
}
