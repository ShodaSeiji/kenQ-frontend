"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';
import universitiesBySubregion from "@/data/universities_by_subregion.json";
import { useLocale, useTranslations } from 'next-intl';

//export default function MatchedResearchers({ projectId }: { projectId: string }) {
export default function MatchedResearchers({
  projectId,
  setLoading,
}: {
  projectId: string;
  setLoading: (value: boolean) => void;
}) {
  const locale = useLocale();
  const t = useTranslations('researcher');
  const tProject = useTranslations('project');
  const tRegister = useTranslations('register');
  const tUniversities = useTranslations('register.universities');
  const tIndustries = useTranslations('register.industries');
  const [researchers, setResearchers] = useState<any[]>([]);
  const [researchersEn, setResearchersEn] = useState<Record<string, any>>({});
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
        // APIから研究者マッチング結果を取得（ロケール付き）
        const response = await fetch(`/api/matching-results?project_id=${projectId}&locale=${locale}`, {
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
        setResearchers(researchers);

        // バックエンドからのお気に入り状態を初期化
        const initialFavorites = researchers
          .filter((r: any) => r.favorite_status === true)
          .map((r: any) => (r.researcher_info?.researcher_id || r.matching_id).toString());

        setFavorites(initialFavorites);

        // 英語ロケールの場合、英語版研究者データを取得
        if (locale === 'en' && researchers.length > 0) {
          const researcherIds = researchers.map((r: any) =>
            r.researcher_info?.researcher_id || r.matching_id
          ).filter(Boolean);

          if (researcherIds.length > 0) {
            const enResponse = await fetch('/api/researchers-en', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ researcher_ids: researcherIds }),
            });

            if (enResponse.ok) {
              const enData = await enResponse.json();
              setResearchersEn(enData.researchers || {});
            } else {
              console.error('Failed to fetch English researcher data');
            }
          }
        }
      } catch (error) {
        console.error("研究者データの取得エラー:", error);
      } finally {
        setLoading(false); // ローディング解除
      }
    };
    fetchResearchers();
  }, [projectId, locale]);

  // 研究者情報を取得する関数（多言語対応）
  const getResearcherInfo = (researcher: any, field: string) => {
    const researcherId = researcher.researcher_info?.researcher_id || researcher.matching_id;

    if (locale === 'en' && researchersEn[researcherId]) {
      const enInfo = researchersEn[researcherId];
      switch (field) {
        case 'name':
          return enInfo.researcher_name || researcher.researcher_info?.researcher_name || "―";
        case 'affiliation':
          return enInfo.affiliation || researcher.researcher_info?.researcher_affiliation_current || "―";
        case 'department':
          return enInfo.department || researcher.researcher_info?.researcher_department_current || "―";
        case 'position':
          return enInfo.position || researcher.researcher_info?.researcher_position_current || "―";
        case 'research_field':
          return enInfo.research_field || researcher.researcher_info?.researcher_field || "―";
        default:
          return "―";
      }
    }

    // 日本語または英語データがない場合は日本語版を使用
    switch (field) {
      case 'name':
        return researcher.researcher_info?.researcher_name || "―";
      case 'affiliation':
        return researcher.researcher_info?.researcher_affiliation_current || "―";
      case 'department':
        return researcher.researcher_info?.researcher_department_current || "―";
      case 'position':
        return researcher.researcher_info?.researcher_position_current || "―";
      case 'research_field':
        return researcher.researcher_info?.researcher_field || "―";
      default:
        return "―";
    }
  };

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
    if (researchers.length === 0) {
      alert(tProject('noExportData'));
      return;
    }

    // 全大学数を計算
    const totalUniversityCount = Object.values(universitiesBySubregion).flat().length;

    // 新しいワークブックを作成
    const wb = XLSX.utils.book_new();

    // 案件情報のワークシート
    const projectInfo = [
      [tProject('projectInfo')],
      [tProject('projectTitle'), projectData?.title || ""],
      [tProject('projectContent'), projectData?.background || ""],
      [tProject('industry'), tIndustries(projectData?.industry as any) || tProject('unspecified')],
      [tProject('businessDescription'), projectData?.businessDescription || tProject('unspecified')],
      [tProject('university'),
        typeof projectData?.university === "string" && projectData.university
          ? projectData.university === "全大学" || projectData.university.includes("全大学")
            ? tProject('allUniversities', { count: totalUniversityCount })
            : `${projectData.university.split(',').map((u: string) => tUniversities(u.trim() as any)).join('/')}（${projectData.university.split(',').length}校）`
          : Array.isArray(projectData?.university) && projectData.university.length > 0
          ? projectData.university.includes("全大学")
            ? tProject('allUniversities', { count: totalUniversityCount })
            : `${projectData.university.map((u: string) => tUniversities(u as any)).join("/")}（${projectData.university.length}校）`
          : tProject('allUniversities', { count: totalUniversityCount })
      ],
      [tProject('researcherLevel'),
        typeof projectData?.researcherLevel === "string" && projectData.researcherLevel
          ? projectData.researcherLevel
          : Array.isArray(projectData?.researcherLevel) && projectData.researcherLevel.length === 10
          ? tProject('allLevels')
          : Array.isArray(projectData?.researcherLevel) && projectData.researcherLevel.length > 0
          ? projectData.researcherLevel.map((level: string) => tRegister(`researcherLevels.${level}` as any)).join("/")
          : tProject('allLevels')
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
    
    XLSX.utils.book_append_sheet(wb, projectWS, tProject('projectInfo'));

    // 研究者一覧のワークシート
    const researcherHeaders = [
      tProject('name'),
      tProject('currentAffiliation'),
      tProject('currentDepartment'),
      tProject('currentPosition'),
      t('researcherInfo'),
      t('matchingReason'),
      tProject('favoriteRegistration')
    ];

    const researcherRows = researchers.map((r) => {
      const researcherId = r.researcher_info?.researcher_id || r.matching_id;
      const kakenNumber = researcherId.toString().padStart(12, '0');
      const kakenUrl = `https://nrid.nii.ac.jp/ja/nrid/1${kakenNumber}`;
      const isFavorite = favorites.includes(researcherId.toString()) ? tProject('registered') : tProject('notRegistered');

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
    
    XLSX.utils.book_append_sheet(wb, researcherWS, tProject('researcherListSheet'));

    // ファイル名を新しい形式に変更
    const sanitizedTitle =
      projectTitle && projectTitle.trim() !== ""
        ? "_" + projectTitle.replace(/[\\/:*?"<>|]/g, "_").slice(0, 30)
        : "無題";

    const filename = `${projectId}${sanitizedTitle}.xlsx`;

    // Excelファイルをダウンロード
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="relative mb-4 mt-6">
      <div className="pl-6">
        <h3 className="text-xl font-bold">{t('researcherList')}</h3>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm border-collapse table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-4 text-left font-semibold text-gray-700 whitespace-nowrap w-[12%]">{t('name')}</th>
              <th className="px-4 py-4 text-left font-semibold text-gray-700 whitespace-nowrap w-[14%]">{t('affiliation')}</th>
              <th className="px-4 py-4 text-left font-semibold text-gray-700 whitespace-nowrap w-[12%]">{t('department')}</th>
              <th className="px-4 py-4 text-left font-semibold text-gray-700 whitespace-nowrap w-[8%]">{t('position')}</th>
              <th className="px-1 py-4 text-center font-semibold text-gray-700 whitespace-nowrap w-[8%] min-w-[120px]">{t('researcherInfo')}</th>
              <th className="pl-3 pr-1 py-4 text-left font-semibold text-gray-700 whitespace-nowrap w-[38%]">
                <div className="flex items-center">
                  <span>{t('matchingReason')}</span>
                  <button
                    onClick={toggleAllReasons}
                    className="ml-1 text-blue-500 hover:text-blue-700 transition text-base cursor-pointer"
                    title={allReasonsExpanded ? t('collapseAll') : t('expandAll')}
                  >
                    {allReasonsExpanded ? "−" : "＋"}
                  </button>
                </div>
              </th>
              <th className="pl-1 pr-2 py-4 text-center font-semibold text-gray-700 whitespace-nowrap w-[8%]">{t('favorite')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {researchers.map((researcher: any) => (
              <tr key={researcher.researcher_info?.researcher_id || researcher.matching_id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-gray-900">{getResearcherInfo(researcher, 'name')}</td>
                <td className="px-4 py-4 text-gray-700">
                  {getResearcherInfo(researcher, 'affiliation')}
                </td>
                <td className="px-4 py-4 text-gray-700">
                  <div className="min-w-[8em] max-w-[8em] break-words whitespace-normal leading-tight">
                    {getResearcherInfo(researcher, 'department')}
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-700">
                  {getResearcherInfo(researcher, 'position')}
                </td>
                <td className="px-1 py-4 text-center align-top pr-2">
                  <a
                    href={`https://nrid.nii.ac.jp/${locale}/nrid/1${(researcher.researcher_info?.researcher_id || researcher.matching_id).toString().padStart(12, '0')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-1 py-0.5 bg-blue-400 text-white rounded hover:bg-blue-500 transition whitespace-nowrap"
                    style={{ fontSize: '8px' }}
                  >
                    {t('profile')}
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
          {tProject('excelExport')}
        </button>
      </div>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-xs">
            <h2 className="text-xl font-bold mb-4">{tProject('offerSent')}</h2>
            <button
              onClick={() => router.push("/register")}
              className="w-full py-3 bg-gray-700 text-white rounded-lg shadow-md hover:bg-gray-800 transition duration-200"
            >
              {tProject('backToNewRegistration')}
            </button>
          </div>
        </div>
      )}

      {showReasonModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg text-gray-800">
            <h2 className="text-xl font-semibold mb-4">{t('matchingReason')}</h2>
            <p className="mb-6 whitespace-pre-wrap">{selectedReason}</p>
            <button
              onClick={() => setShowReasonModal(false)}
              className="w-full py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
            >
              {tProject('close')}
            </button>
          </div>
        </div>
      )}

      {showInfoModal && selectedResearcher && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full shadow-lg text-gray-800 overflow-y-auto max-h-[80vh]">
            <h2 className="text-xl font-semibold mb-4">{tProject('researcherInfoTitle')}</h2>
            <div className="space-y-2 text-sm whitespace-pre-wrap">
              <p><strong>{tProject('name')}：</strong>{selectedResearcher.researcher_name}（{selectedResearcher.researcher_name_kana}）</p>
              <p><strong>{tProject('currentAffiliation')}：</strong>{selectedResearcher.researcher_affiliation_current}</p>
              <p><strong>{tProject('currentDepartment')}：</strong>{selectedResearcher.researcher_department_current}</p>
              <p><strong>{tProject('currentPosition')}：</strong>{selectedResearcher.researcher_position_current || "―"}</p>
              <p><strong>{tProject('researchField')}：</strong>{selectedResearcher.research_field_pi}</p>
              <p><strong>{tProject('pastAffiliations')}：</strong>{selectedResearcher.researcher_affiliations_past}</p>
            </div>
            <button
              onClick={() => router.push(`/researcher/${selectedResearcher.researcher_id}`)}
              className="w-full py-2 bg-blue-400 text-white rounded hover:bg-blue-500 transition"
            >
              {tProject('viewDetails')}
            </button>
            <button
              onClick={() => setShowInfoModal(false)}
              className="mt-6 w-full py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
            >
              {tProject('close')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
