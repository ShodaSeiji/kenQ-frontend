"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';
import universitiesBySubregion from "@/data/universities_by_subregion.json";

//export default function MatchedResearchers({ projectId }: { projectId: string }) {
export default function MatchedResearchers({
  projectId,
  setLoading,
}: {
  projectId: string;
  setLoading: (value: boolean) => void;
}) {
  // console.log("📌 現在の project_id:", projectId); 
  const [researchers, setResearchers] = useState<any[]>([]);
  const [selectedResearchers, setSelectedResearchers] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [selectedResearcher, setSelectedResearcher] = useState<any | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectData, setProjectData] = useState<any>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [expandedReasons, setExpandedReasons] = useState<string[]>([]);
  const [allReasonsExpanded, setAllReasonsExpanded] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchResearchers = async () => {
      try {
        // APIから研究者マッチング結果を取得
        const response = await fetch(`/api/matching-results?project_id=${projectId}`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          }
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        console.log("🔍 APIレスポンス", data);
        console.log("🔍 プロジェクトタイトル:", data.project_title);
        console.log("🔍 研究者数:", data.matched_researchers?.length);

        setProjectTitle(data.project_title || "");

        // プロジェクトデータをExcel出力用に保存
        const projectInfo = {
          title: data.project_title || "",
          background: data.project_content || "",
          industry: data.industry_category || "",
          businessDescription: data.business_description || "",
          university: data.university || [],
          researcherLevel: data.preferred_researcher_level || []
        };
        setProjectData(projectInfo);

        // APIレスポンスの構造に合わせて直接matched_researchersを使用
        const researchers = data.matched_researchers || [];
        console.log("🔍 サンプル研究者データ:", researchers[0]);
        setResearchers(researchers);

        // バックエンドからのお気に入り状態を初期化
        const initialFavorites = researchers
          .filter((r: any) => r.favorite_status === true)
          .map((r: any) => (r.researcher_info?.researcher_id || r.matching_id).toString());

        console.log("🌟 初期お気に入り一覧:", initialFavorites);
        setFavorites(initialFavorites);
      } catch (error) {
        console.error("研究者データの取得エラー:", error);
      } finally {
        setLoading(false); // ローディング解除
      }
    };
    fetchResearchers();
  }, [projectId]);

  const handleInfoClick = (researcher: any) => {
    setSelectedResearcher(researcher);
    setShowInfoModal(true);
  };

  const handleCheckboxChange = (researcherId: string) => {
    setSelectedResearchers((prev) =>
      prev.includes(researcherId)
        ? prev.filter((id) => id !== researcherId)
        : [...prev, researcherId]
    );
  };

  const handleShowMatchingReason = (reason: string) => {
    setSelectedReason(reason);
    setShowReasonModal(true);
  };

  const handleOffer = async () => {
    if (selectedResearchers.length === 0) return;

    try {
      const response = await fetch('/api/offers', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: Number(projectId),
          researcher_ids: selectedResearchers.map(id => Number(id)),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send offers: ${response.statusText}`);
      }

      setShowPopup(true);
    } catch (error) {
      console.error("❌ オファー送信エラー:", error);
      alert("オファー送信に失敗しました。もう一度お試しください。");
    }
  };

  // CSV出力
  // マッチング理由の展開/折りたたみ
  const toggleReasonExpansion = (researcherId: string) => {
    setExpandedReasons(prev => 
      prev.includes(researcherId) 
        ? prev.filter(id => id !== researcherId)
        : [...prev, researcherId]
    );
  };

  // 全マッチング理由の一括展開/折りたたみ
  const toggleAllReasons = () => {
    if (allReasonsExpanded) {
      setExpandedReasons([]);
      setAllReasonsExpanded(false);
    } else {
      const allResearcherIds = researchers.map(r => 
        (r.researcher_info?.researcher_id || r.matching_id).toString()
      );
      setExpandedReasons(allResearcherIds);
      setAllReasonsExpanded(true);
    }
  };

  // 星マーククリック時にお気に入り状態を切り替え（API呼び出し）
  const handleToggleFavoriteLocal = async (researcherId: string) => {
    const researcher = researchers.find(r =>
      (r.researcher_info?.researcher_id || r.matching_id).toString() === researcherId
    );

    if (!researcher) return;

    const matchingId = researcher.matching_id || Number(researcherId);
    const currentStatus = favorites.includes(researcherId);
    const newStatus = !currentStatus;

    // UIを即座に更新（楽観的UI更新）
    setFavorites((prev) =>
      newStatus ? [...prev, researcherId] : prev.filter((id) => id !== researcherId)
    );

    try {
      const response = await fetch('/api/favorites', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matching_id: matchingId,
          favorite_status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle favorite: ${response.statusText}`);
      }
    } catch (error) {
      console.error("❌ お気に入り切り替えエラー:", error);
      // エラー時は元に戻す
      setFavorites((prev) =>
        currentStatus ? [...prev, researcherId] : prev.filter((id) => id !== researcherId)
      );
      alert("お気に入りの更新に失敗しました。");
    }
  };


  const handleExportExcel = () => {
    // console.log("📊 Excel出力開始 - researchers.length:", researchers.length);
    // console.log("📊 Researchers data:", researchers);

    if (researchers.length === 0) {
      // console.log("📊 研究者データが空のため、Excel出力をスキップ");
      alert("エクスポートする研究者データがありません。");
      return;
    }

    // 全大学数を計算
    const totalUniversityCount = Object.values(universitiesBySubregion).flat().length;

    // 新しいワークブックを作成
    const wb = XLSX.utils.book_new();

    // 案件情報のワークシート
    const projectInfo = [
      ["案件情報"],
      ["案件タイトル", projectData?.title || ""],
      ["案件内容", projectData?.background || ""],
      ["業種", projectData?.industry || "入力なし"],
      ["事業内容", projectData?.businessDescription || "入力なし"],
      ["大学",
        typeof projectData?.university === "string" && projectData.university
          ? projectData.university === "全大学" || projectData.university.includes("全大学")
            ? `全大学（${totalUniversityCount}校）`
            : `${projectData.university}（${projectData.university.split(',').length}校）`
          : Array.isArray(projectData?.university) && projectData.university.length > 0
          ? projectData.university.includes("全大学")
            ? `全大学（${totalUniversityCount}校）`
            : `${projectData.university.join("/")}（${projectData.university.length}校）`
          : `全大学（${totalUniversityCount}校）`
      ],
      ["研究者階層",
        typeof projectData?.researcherLevel === "string" && projectData.researcherLevel
          ? projectData.researcherLevel
          : Array.isArray(projectData?.researcherLevel) && projectData.researcherLevel.length > 0
          ? projectData.researcherLevel.join("/")
          : "教授／准教授／助教／講師／助教授／助手／研究員／特任教授／特任助教／主任研究員"
      ]
    ];
    
    const projectWS = XLSX.utils.aoa_to_sheet(projectInfo);
    
    // 案件情報シートのフォントを設定
    const projectRange = XLSX.utils.decode_range(projectWS['!ref'] || 'A1');
    for (let R = projectRange.s.r; R <= projectRange.e.r; ++R) {
      for (let C = projectRange.s.c; C <= projectRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (projectWS[cellAddress]) {
          if (!projectWS[cellAddress].s) projectWS[cellAddress].s = {};
          projectWS[cellAddress].s.font = {
            name: "游ゴシック",
            sz: 11,
            family: 1,
            charset: 128
          };
        }
      }
    }
    
    XLSX.utils.book_append_sheet(wb, projectWS, "案件情報");

    // 研究者一覧のワークシート
    const researcherHeaders = [
      "氏名",
      "所属",
      "部署",
      "職位",
      "研究者情報",
      "マッチング理由",
      "お気に入り登録"
    ];

    const researcherRows = researchers.map((r) => {
      const researcherId = r.researcher_info?.researcher_id || r.matching_id;
      const kakenNumber = researcherId.toString().padStart(12, '0');
      const kakenUrl = `https://nrid.nii.ac.jp/ja/nrid/1${kakenNumber}`;
      const isFavorite = favorites.includes(researcherId.toString()) ? "登録済み" : "未登録";

      return [
        r.researcher_info?.researcher_name || "―",
        r.researcher_info?.researcher_affiliation_current || "―",
        r.researcher_info?.researcher_department_current || "―",
        r.researcher_info?.researcher_position_current || "―",
        kakenUrl,
        r.matching_reason || r.researcher_info?.explanation || r.explanation || "―",
        isFavorite
      ];
    });

    const researcherData = [researcherHeaders, ...researcherRows];
    const researcherWS = XLSX.utils.aoa_to_sheet(researcherData);
    
    // 研究者一覧シートのフォントを設定
    const researcherRange = XLSX.utils.decode_range(researcherWS['!ref'] || 'A1');
    for (let R = researcherRange.s.r; R <= researcherRange.e.r; ++R) {
      for (let C = researcherRange.s.c; C <= researcherRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (researcherWS[cellAddress]) {
          if (!researcherWS[cellAddress].s) researcherWS[cellAddress].s = {};
          researcherWS[cellAddress].s.font = {
            name: "游ゴシック",
            sz: 11,
            family: 1,
            charset: 128
          };
        }
      }
    }
    
    XLSX.utils.book_append_sheet(wb, researcherWS, "研究者一覧");

    // ファイル名を新しい形式に変更
    const sanitizedTitle =
      projectTitle && projectTitle.trim() !== ""
        ? "_" + projectTitle.replace(/[\\/:*?"<>|]/g, "_").slice(0, 30)
        : "無題";

    const filename = `${projectId}${sanitizedTitle}.xlsx`;

    // Excelファイルをダウンロード
    XLSX.writeFile(wb, filename);
  };

  // console.log("MatchedResearchers - render時のresearchers:", researchers);
  // console.log("MatchedResearchers - render時の研究者数:", researchers.length);
  
  // 最初の研究者のデータ構造を詳しく確認
  if (researchers.length > 0) {
    // console.log("📋 サンプル研究者の詳細データ構造:", JSON.stringify(researchers[0], null, 2));
    // console.log("📋 サンプル研究者のresearcher_info.explanation:", researchers[0].researcher_info?.explanation);
    // console.log("📋 サンプル研究者のexplanation:", researchers[0].explanation);
    // console.log("📋 サンプル研究者のmatching_reason:", researchers[0].matching_reason);
  }

  return (
    <div className="relative mb-4 mt-6">
      <div className="pl-6">
        <h3 className="text-xl font-bold">研究者一覧</h3>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm border-collapse table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-4 text-left font-semibold text-gray-700 whitespace-nowrap w-[12%]">氏名</th>
              <th className="px-4 py-4 text-left font-semibold text-gray-700 whitespace-nowrap w-[14%]">所属</th>
              <th className="px-4 py-4 text-left font-semibold text-gray-700 whitespace-nowrap w-[12%]">部署</th>
              <th className="px-4 py-4 text-left font-semibold text-gray-700 whitespace-nowrap w-[8%]">職位</th>
              <th className="px-1 py-4 text-center font-semibold text-gray-700 whitespace-nowrap w-[8%] min-w-[120px]">研究者情報</th>
              <th className="pl-3 pr-1 py-4 text-left font-semibold text-gray-700 whitespace-nowrap w-[38%]">
                <div className="flex items-center">
                  <span>マッチング理由</span>
                  <button 
                    onClick={toggleAllReasons}
                    className="ml-1 text-blue-500 hover:text-blue-700 transition text-base cursor-pointer"
                    title={allReasonsExpanded ? "すべて折りたたむ" : "すべて展開"}
                  >
                    {allReasonsExpanded ? "−" : "＋"}
                  </button>
                </div>
              </th>
              <th className="pl-1 pr-2 py-4 text-center font-semibold text-gray-700 whitespace-nowrap w-[8%]">お気に入り</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {researchers.map((researcher: any) => (
              <tr key={researcher.researcher_info?.researcher_id || researcher.matching_id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-gray-900">{researcher.researcher_info?.researcher_name || "―"}</td>
                <td className="px-4 py-4 text-gray-700">
                  {researcher.researcher_info?.researcher_affiliation_current || "―"}
                </td>
                <td className="px-4 py-4 text-gray-700">
                  <div className="min-w-[8em] max-w-[8em] break-words whitespace-normal leading-tight">
                    {researcher.researcher_info?.researcher_department_current || "―"}
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-700">
                  {researcher.researcher_info?.researcher_position_current || "―"}
                </td>
                <td className="px-1 py-4 text-center align-top pr-2">
                  <a
                    href={`https://nrid.nii.ac.jp/ja/nrid/1${(researcher.researcher_info?.researcher_id || researcher.matching_id).toString().padStart(12, '0')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-1 py-0.5 bg-blue-400 text-white rounded hover:bg-blue-500 transition whitespace-nowrap"
                    style={{ fontSize: '8px' }}
                  >
                    プロフィール
                    <svg className="ml-1 w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
                <td className="pl-3 pr-1 py-4 text-gray-700 text-xs align-top break-words">
                  {(() => {
                    const researcherId = (researcher.researcher_info?.researcher_id || researcher.matching_id).toString();
                    const fullReason = researcher.matching_reason ||
                                     researcher.researcher_info?.explanation ||
                                     researcher.explanation ||
                                     "―";
                    const isExpanded = expandedReasons.includes(researcherId);
                    
                    // 2行表示用のテキストを作成（1行30文字×2行）
                    const getPreviewText = (text: string) => {
                      if (text.length <= 60) return text;
                      const lines = [];
                      let currentLine = "";
                      const words = text.split("");
                      
                      for (let i = 0; i < words.length && lines.length < 2; i++) {
                        if (currentLine.length >= 30) {
                          lines.push(currentLine);
                          currentLine = words[i];
                        } else {
                          currentLine += words[i];
                        }
                      }
                      
                      if (currentLine && lines.length < 2) {
                        lines.push(currentLine);
                      }
                      
                      const result = lines.join("\n");
                      return result + (text.length > 60 ? "..." : "");
                    };
                    
                    const previewText = getPreviewText(fullReason);
                    
                    return (
                      <div className="relative">
                        <div className="flex items-start">
                          <span
                            className={
                              isExpanded
                                ? "whitespace-pre-wrap leading-tight break-words"
                                : "leading-tight break-words line-clamp-2"
                            }
                          >
                            {fullReason}
                          </span>
                          {fullReason.length > 60 && (
                            <button
                              onClick={() => toggleReasonExpansion(researcherId)}
                              className="ml-1 text-blue-500 hover:text-blue-700 transition text-sm flex-shrink-0"
                            >
                              {isExpanded ? "−" : "＋"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </td>
                <td className="pl-1 pr-2 py-4 text-center">
                  <button 
                    onClick={() => handleToggleFavoriteLocal((researcher.researcher_info?.researcher_id || researcher.matching_id).toString())}
                    className={`transition text-base ${
                      favorites.includes((researcher.researcher_info?.researcher_id || researcher.matching_id).toString())
                        ? "text-yellow-500 hover:text-yellow-600"
                        : "text-gray-400 hover:text-yellow-500"
                    }`}
                  >
                    {favorites.includes((researcher.researcher_info?.researcher_id || researcher.matching_id).toString()) ? "★" : "☆"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 下部ボタン */}
      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={handleExportExcel}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Excel出力
        </button>
      </div>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-xs">
            <h2 className="text-xl font-bold mb-4">オファーしました！</h2>
            <button
              onClick={() => router.push("/register")}
              className="w-full py-3 bg-gray-700 text-white rounded-lg shadow-md hover:bg-gray-800 transition duration-200"
            >
              新規登録に戻る
            </button>
          </div>
        </div>
      )}

      {showReasonModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg text-gray-800">
            <h2 className="text-xl font-semibold mb-4">マッチング理由</h2>
            <p className="mb-6 whitespace-pre-wrap">{selectedReason}</p>
            <button
              onClick={() => setShowReasonModal(false)}
              className="w-full py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {showInfoModal && selectedResearcher && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full shadow-lg text-gray-800 overflow-y-auto max-h-[80vh]">
            <h2 className="text-xl font-semibold mb-4">研究者情報</h2>
            <div className="space-y-2 text-sm whitespace-pre-wrap">
              <p><strong>氏名：</strong>{selectedResearcher.researcher_name}（{selectedResearcher.researcher_name_kana}）</p>
              <p><strong>所属：</strong>{selectedResearcher.researcher_affiliation_current}</p>
              <p><strong>部署：</strong>{selectedResearcher.researcher_department_current}</p>
              <p><strong>職位：</strong>{selectedResearcher.researcher_position_current || "―"}</p>
              <p><strong>専門分野：</strong>{selectedResearcher.research_field_pi}</p>
              <p><strong>過去の所属歴：</strong>{selectedResearcher.researcher_affiliations_past}</p>
            </div>
            <button
              onClick={() => router.push(`/researcher/${selectedResearcher.researcher_id}`)}
              className="w-full py-2 bg-blue-400 text-white rounded hover:bg-blue-500 transition"
            >
              詳細を見る
            </button>
            <button
              onClick={() => setShowInfoModal(false)}
              className="mt-6 w-full py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
