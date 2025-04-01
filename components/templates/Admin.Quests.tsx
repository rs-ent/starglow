"use client";

import { StoredImage } from "@prisma/client";
import AdminBannerImages from "@/components/organisms/Admin.BannerImages";

interface AdminQuestsProps {
    bannerImages: StoredImage[];
}

export default function AdminQuests({ bannerImages }: AdminQuestsProps) {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Page</h1>

            <div className="space-y-12">
                {/* 배너 이미지 관리 섹션 */}
                <section className="bg-white rounded-lg shadow p-6">
                    <AdminBannerImages initialImages={bannerImages} />
                </section>

                {/* 추후 다른 관리 섹션들을 여기에 추가할 수 있습니다 */}
            </div>
        </div>
    );
}
