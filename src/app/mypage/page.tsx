"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Project {
  project_id: string;
  project_title: string;
  favorite_count: number;
  registration_date: string;
  company_user_name: string;
}

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [companyProjects, setCompanyProjects] = useState<Project[]>([]);
  const [companyUsers, setCompanyUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 全案件データを取得する関数
  const fetchAllProjects = async () => {
    try {
      const response = await fetch('/api/all-projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const projects = data.projects || data || [];
        const sortedProjects = projects.sort((a: Project, b: Project) => {
          return parseInt(b.project_id) - parseInt(a.project_id);
        });
        setAllProjects(sortedProjects);

        // company_user_nameの一覧を作成（全案件から）
        const uniqueUsers: string[] = Array.from(new Set(sortedProjects.map((project: Project) => project.company_user_name).filter((name: string) => name)));
        setCompanyUsers(uniqueUsers);
      } else {
        console.error('全案件取得エラー:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('全案件API呼び出しエラー:', error);
    }
  };

  // 個人案件データを取得する関数
  const fetchCompanyProjects = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/projects?company_id=${session.user.company_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const projects = data.projects || data || [];
        const sortedProjects = projects.sort((a: Project, b: Project) => {
          return parseInt(b.project_id) - parseInt(a.project_id);
        });
        setCompanyProjects(sortedProjects);
      } else {
        console.error('個人案件取得エラー:', response.status, response.statusText);
        setCompanyProjects([]);
      }
    } catch (error) {
      console.error('個人案件API呼び出しエラー:', error);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      setLoading(true);
      // ログインユーザー名をデフォルト選択に設定
      if (session?.user?.name) {
        setSelectedUser(session.user.name);
      }
      Promise.all([fetchAllProjects(), fetchCompanyProjects()])
        .finally(() => {
          setLoading(false);
          setIsInitialLoading(false);
        });
    }
  }, [session?.user?.id]);

  // フィルタリング処理
  useEffect(() => {
    if (selectedUser === "全案件") {
      setProjects(allProjects);
    } else {
      const filteredProjects = allProjects.filter(project => project.company_user_name === selectedUser);
      setProjects(filteredProjects);
    }
  }, [selectedUser, allProjects]);

  // 初期表示の設定
  useEffect(() => {
    if (allProjects.length > 0 && selectedUser) {
      if (selectedUser === "全案件") {
        setProjects(allProjects);
      } else {
        const filteredProjects = allProjects.filter(project => project.company_user_name === selectedUser);
        setProjects(filteredProjects);
      }
    }
  }, [allProjects, selectedUser]);

  if (isInitialLoading || (status === "loading" && !session)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">リサーチ案件一覧</h1>

          {/* フィルターボックス */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="relative">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  {/* ログインユーザーを最初に表示 */}
                  {session?.user?.name && (
                    <option value={session.user.name}>{session.user.name}</option>
                  )}
                  {/* 全案件を2番目に表示 */}
                  <option value="全案件">全案件</option>
                  {/* 他のユーザーを表示（ログインユーザー以外） */}
                  {companyUsers
                    .filter(user => user !== session?.user?.name)
                    .map((user) => (
                      <option key={user} value={user}>{user}</option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 案件カード一覧 */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">読み込み中...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {projects.map((project, index) => (
                <div key={project.project_id || index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col h-full">
                  <div className="mb-4 flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No.{project.project_id || index + 1}
                    </h3>
                    <h4 className="text-base text-gray-800 leading-relaxed">
                      {project.project_title || "タイトル未設定"}
                    </h4>
                  </div>

                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="text-blue-600">
                      お気に入りの研究者数: {project.favorite_count || 0}名
                    </div>
                    <div>登録日: {project.registration_date ? new Date(project.registration_date).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '/').replace(',', '') : "未設定"}</div>
                    <div>登録者: {project.company_user_name || "未設定"}</div>
                  </div>

                  <Link
                    href={`/projects/${project.project_id}`}
                    className="block w-full py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors text-center"
                  >
                    詳細
                  </Link>
                </div>
              ))}
            </div>
          )}

          {!loading && projects.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-600">案件が見つかりませんでした。</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}