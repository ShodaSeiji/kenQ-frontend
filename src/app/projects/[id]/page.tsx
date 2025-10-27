"use client";

import { useEffect, useState } from "react";
import ProjectDetails from "@/components/ProjectDetails";
import MatchedResearchers from "@/components/MatchedResearchers";

export default function ProjectPage({ params }: { params: { id: string } }) {
    const projectId = params.id;
    const [projectData, setProjectData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                // 案件詳細を取得
                const response = await fetch(`/api/projects?company_id=1`);
                if (response.ok) {
                    const data = await response.json();
                    const project = data.projects?.find((p: any) => p.project_id.toString() === projectId);
                    if (project) {
                        setProjectData(project);
                    } else {
                        console.error("Project not found for ID:", projectId);
                    }
                } else {
                    console.error("Failed to fetch project data");
                }
            } catch (error) {
                console.error("Error fetching project data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjectData();
    }, [projectId]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                    <p className="text-lg font-medium mb-4">しばらくお待ちください</p>
                    <svg
                        className="animate-spin h-10 w-10 text-blue-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                    </svg>
                </div>
            </div>
        );
    }

    if (!projectData) {
        return (
            <div className="max-w-7xl mx-auto p-8 bg-white rounded-lg mt-10">
                <p>プロジェクトデータが見つかりません。</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 bg-white rounded-lg mt-10">
            {/* 上段：案件の詳細 */}
            <ProjectDetails projectId={projectId} setLoading={() => {}} />

            {/* 下段：おすすめの研究者リスト */}
            <MatchedResearchers projectId={projectId} setLoading={() => {}} />

            {/* 情報源の表示 */}
            <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                    *研究者情報は、国立情報学研究所が提供する KAKEN（科学研究費助成事業データベース）を基に作成しています。[<a href="https://kaken.nii.ac.jp/ja/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline">https://kaken.nii.ac.jp/ja/</a>]
                </p>
            </div>
        </div>
    );
}