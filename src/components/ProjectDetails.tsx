"use client";

import { useEffect, useState } from "react";
import universitiesBySubregion from "@/data/universities_by_subregion.json";

//export default function ProjectDetails({ projectId }: { projectId: string }) {
export default function ProjectDetails({
  projectId,
  setLoading,
}: {
  projectId: string;
  setLoading: (value: boolean) => void;
}) {

  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        // APIからプロジェクトデータを取得
        const response = await fetch(`/api/projects?company_id=1`);
        if (response.ok) {
          const data = await response.json();
          const project = data.projects?.find((p: any) => p.project_id.toString() === projectId);
          if (project) {
            // APIレスポンスの形式に合わせて変換
            const projectData = {
              title: project.project_title,
              background: project.project_content,
              industry: project.industry_category,
              businessDescription: project.business_description,
              university: project.university || [],
              researcherLevel: project.preferred_researcher_level || []
            };
            setProject(projectData);
          } else {
            console.error("Project not found for ID:", projectId);
          }
        } else {
          console.error("Failed to fetch project data");
        }
      } catch (error) {
        console.error("プロジェクト情報取得エラー:", error);
      } finally {
        setLoading(false); // ここでローディング終了を通知
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  if (!project) {
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

  return (
    <div className="mb-8">
      {/* 案件情報の枠 */}
      <div className="border border-gray-300 rounded-lg p-6 bg-white">
        {/* 案件タイトル - 枠内上部に配置 */}
        <h1 className="text-xl font-bold text-black mb-4">{project.title}</h1>

        {/* 案件内容セクション */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">案件内容</h2>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm mb-4">{project.background}</p>
        </div>

        {/* 間仕切り線 */}
        <hr className="border-gray-300 mb-4" />

        {/* 詳細情報 - 2列レイアウト */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左列 */}
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">業種</h3>
              <p className="text-gray-700 text-sm">{project.industry || ''}</p>
            </div>
            
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">大学</h3>
              <p className="text-gray-700 text-sm">{
                Array.isArray(project.university) && project.university.includes("全大学")
                  ? `全大学（${Object.values(universitiesBySubregion).flat().length}校）`
                  : Array.isArray(project.university) && project.university.length > 0
                  ? `${project.university.join("/")}（${project.university.length}校）`
                  : "未指定"
              }</p>
            </div>
          </div>

          {/* 右列 */}
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">事業内容</h3>
              <p className="text-gray-700 text-sm">{project.businessDescription || ''}</p>
            </div>
            
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">研究者階層</h3>
              <p className="text-gray-700 text-sm">{
                Array.isArray(project.researcherLevel) && project.researcherLevel.length === 10
                  ? "全階層_教授／准教授／助教／講師／助教授／助手／研究員／特任助教／主任研究員／特任教授"
                  : Array.isArray(project.researcherLevel) && project.researcherLevel.length > 0
                  ? project.researcherLevel.join("/")
                  : "未指定"
              }</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

