/// app/admin/boards/page.tsx

import { Suspense } from "react";

import { AdminBoardsContents } from "@/components/admin/boards/Admin.Boards.Contents";

export default function AdminBoardsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">보드 관리</h1>
                <p className="text-gray-400">
                    게시판과 보상 시스템을 관리합니다
                </p>
            </div>

            <Suspense
                fallback={
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                }
            >
                <AdminBoardsContents />
            </Suspense>
        </div>
    );
}
