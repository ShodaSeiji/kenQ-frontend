"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useFormContext, allResearcherLevels } from "@/context/FormContext";
import UniversitySelect from "@/components/UniversitySelect";
import universitiesBySubregion from "@/data/universities_by_subregion.json";

// 業種の定数
const allIndustries = [
  "水産・農林業", "鉱業", "建設業", "食料品", "繊維製品", "パルプ・紙", "化学",
  "医薬品", "石油・石炭製品", "ゴム製品", "ガラス・土石製品", "鉄鋼", "非鉄金属",
  "金属製品", "機械", "電気機器", "輸送用機器", "精密機器", "その他製品",
  "電気・ガス業", "陸運業", "海運業", "空運業", "倉庫・運輸関連業", "情報・通信業",
  "卸売業", "小売業", "銀行業", "証券、商品先物取引業", "保険業", "その他金融業",
  "不動産業", "サービス業"
];

type FormDataType = {
  title: string;
  background: string;
  industry: string;        // ✅追加
  businessDescription: string; // ✅追加
  university: string[];      // ✅追加
  researchField: string;
  researcherLevel: string[];
  deadline: string;
};

type RequestFormProps = {
  onSubmit?: (data: FormDataType) => void;
  onStatusChange?: (isProcessing: boolean) => void;
};

export default function RequestForm({ onSubmit, onStatusChange }: RequestFormProps) {
  const t = useTranslations('register');
  const tCommon = useTranslations('common');
  const tLevels = useTranslations('register.researcherLevels');
  const tIndustries = useTranslations('register.industries');
  const locale = useLocale();
  const router = useRouter();
  const { formData, setFormData } = useFormContext();
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false); // ←診断中に「しばらくお待ちください。」を表示するため
  const [validationError, setValidationError] = useState<string | null>(null); // ←AIアシストのため５つの項目すべてに入力してもらう注意を表示するため

  // ✅ モーダル表示と診断結果を管理
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);

  // ✅ AIリサーチ実行確認モーダル
  const [showResearchConfirmModal, setShowResearchConfirmModal] = useState(false);

  // ✅ 研究者マッチング状態管理
  const [isResearching, setIsResearching] = useState(false);
  const [researchCompleted, setResearchCompleted] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [researchResults, setResearchResults] = useState<any>(null);

  // ✅ formData をもとに selectedUniversities を初期化
  useEffect(() => {
    let universityArray =
      Array.isArray(formData.university)
        ? formData.university
        : formData.university
        ? [formData.university]
        : [];

    // ✅ "全大学" が含まれていたら、85校に展開
    if (universityArray.includes("全大学")) {
      const universityList85 = Object.values(universitiesBySubregion).flat();
      setSelectedUniversities(universityList85);
    } else {
      setSelectedUniversities(universityArray);
    }
  }, [formData.university]);

  // ✅ 処理状態を親コンポーネントに通知
  useEffect(() => {
    onStatusChange?.(isResearching || showConfirmModal || loading || researchCompleted || showResearchConfirmModal);
  }, [isResearching, showConfirmModal, loading, researchCompleted, showResearchConfirmModal, onStatusChange]);

  const handleDiagnosis = () => {
    // 案件タイトルと案件内容のみ必須チェック
    if (
      !formData.title ||
      !formData.background
    ) {
      setValidationError(t('validationError.aiAssistRequiredFields'));
      return;
    }

    setShowConfirmModal(true);
  };

  const applyDiagnosisResult = () => {
    if (diagnosisResult) {
      setFormData(prev => ({ ...prev, background: diagnosisResult }));
      setShowModal(false);
    }
  };

  const executeDiagnosis = async () => {
    setShowConfirmModal(false);
    setLoading(true); // ← しばらくお待ちください。の表示のため

    try {
      const response = await fetch('/api/ai-diagnosis', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_title: formData.title,
          project_content: formData.background,
          industry_category: formData.industry,
          business_description: formData.businessDescription,
          //university: localFormData.university || "",
          university: Array.isArray(formData.university)
            ? formData.university
            : formData.university ? [formData.university] : [],
          preferred_researcher_level: Array.isArray(formData.researcherLevel)
            ? formData.researcherLevel
            : formData.researcherLevel ? [formData.researcherLevel] : [],
          application_deadline:
            formData.deadline && formData.deadline.trim() !== ""
              ? formData.deadline
              : "2099-12-31", // ←★ここが重要
          language: locale, // ← 言語設定を追加
          // company_user_idはサーバーサイドでセッションから取得
        }),
      });

      if (!response.ok) {
        const errText = await response.text(); // ←エラーメッセージの中身も取れるように
        throw new Error("AI診断APIエラー: " + errText);
      }

      const result = await response.json();

      // カギ括弧を除去する処理
      let cleanedResult = result.message || result || "診断結果が取得できませんでした";
      if (typeof cleanedResult === 'string') {
        // 先頭と末尾のカギ括弧を除去
        cleanedResult = cleanedResult.replace(/^「|」$/g, '').trim();
      }
      
      setDiagnosisResult(cleanedResult);
      setShowModal(true);
    } catch (error) {
      console.error("診断エラー:", error);
      setDiagnosisResult("診断中にエラーが発生しました");
      setShowModal(true);
    } finally {
      setLoading(false); // ← しばらくお待ちください。の表示のため
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // 文字数制限チェック
    let processedValue = value;
    if (name === 'title' && value.length > 40) {
      processedValue = value.slice(0, 40);
    } else if (name === 'background' && value.length > 2000) {
      processedValue = value.slice(0, 2000);
    } else if (name === 'businessDescription' && value.length > 100) {
      processedValue = value.slice(0, 100);
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (onSubmit) {
      onSubmit(formData);
      return;
    }

    // 必須項目のバリデーション
    const missingFields = [];
    if (!formData.title) missingFields.push(t('fields.projectTitle'));
    if (!formData.background) missingFields.push(t('fields.projectContent'));
    if (!formData.university || formData.university.length === 0) missingFields.push(t('fields.university'));
    if (!formData.researcherLevel || formData.researcherLevel.length === 0) missingFields.push(t('fields.researcherLevel'));

    if (missingFields.length > 0) {
      setValidationError(t('validationError.requiredFields', { fields: missingFields.join('、') }));
      return;
    }

    // AIリサーチ実行確認モーダルを表示
    setShowResearchConfirmModal(true);
  };

  const executeAIResearch = async () => {
    setShowResearchConfirmModal(false);
    setIsResearching(true);

    try {
      const response = await fetch('/api/project-registration', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // company_user_idはサーバーサイドでセッションから取得
          project_title: formData.title,
          project_content: formData.background,
          industry_category: formData.industry || "",
          business_description: formData.businessDescription || "",
          university: Array.isArray(formData.university) ? formData.university : [],
          preferred_researcher_level: Array.isArray(formData.researcherLevel) ? formData.researcherLevel : [],
        }),
      });

      if (!response.ok) {
        throw new Error("案件登録に失敗しました");
      }

      const result = await response.json();

      const projectId = result.project_id || result.id;
      setProjectId(projectId);
      setResearchResults(result);
      
      // マッチング結果をlocalStorageに保存
      localStorage.setItem(`project_${projectId}`, JSON.stringify({
        projectData: {
          id: projectId,
          title: formData.title,
          background: formData.background,
          industry: formData.industry,
          businessDescription: formData.businessDescription,
          university: formData.university,
          researcherLevel: formData.researcherLevel
        },
        matchingResults: result
      }));
      
      // リサーチ完了状態に移行（実際はバックエンドの処理完了を待つ）
      setTimeout(() => {
        setIsResearching(false);
        setResearchCompleted(true);
      }, 3000); // 仮の3秒待機

    } catch (error) {
      console.error("Registration error:", error);
      setValidationError(t('errors.registrationError'));
      setIsResearching(false);
    }
  };

  // リサーチ完了画面
  if (researchCompleted && researchResults) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t('researchComplete.title')}</h1>
          </div>

          <p className="text-gray-600 mb-6">
            {t('researchComplete.description')}
          </p>

          <div className="bg-blue-50 p-6 rounded-lg mb-8 text-left">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-semibold text-blue-800">{t('researchComplete.researchedProject')}</h3>
            </div>

            <h4 className="text-blue-600 font-medium mb-3">{researchResults.project_title}</h4>

            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <p><span className="font-medium">{t('fields.industry')}:</span> {
                  formData.industry ? tIndustries(formData.industry as any) : t('common.unspecified')
                }</p>
              </div>
              <div>
                <p><span className="font-medium">{t('fields.businessDescription')}:</span> {
                  formData.businessDescription || t('common.unspecified')
                }</p>
              </div>
              <div>
                <p><span className="font-medium">{t('fields.targetUniversity')}:</span> {
                  Array.isArray(formData.university) && formData.university.includes("全大学")
                    ? t('researchComplete.allUniversities', { count: Object.values(universitiesBySubregion).flat().length })
                    : Array.isArray(formData.university) && formData.university.length > 0
                    ? t('researchComplete.universityCount', { count: formData.university.length })
                    : t('common.unspecified')
                }</p>
              </div>
              <div>
                <p><span className="font-medium">{t('fields.researcherLevel')}:</span> {
                  Array.isArray(formData.researcherLevel) && formData.researcherLevel.length === 10
                    ? t('researchComplete.allLevels')
                    : Array.isArray(formData.researcherLevel) && formData.researcherLevel.length > 0
                    ? t('researchComplete.levelCount', { count: formData.researcherLevel.length })
                    : t('common.unspecified')
                }</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                if (projectId) {
                  router.push(`/projects/${projectId}`);
                }
              }}
              className="px-6 py-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500"
            >
              {t('researchComplete.viewResults')}
            </button>
          </div>
          
        </div>
      </div>
    );
  }

  // AIリサーチ実行中画面
  if (isResearching) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <svg
              className="animate-spin h-12 w-12 text-blue-500 mr-4"
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <h1 className="text-2xl font-bold text-gray-800">{t('researchInProgress.title')}</h1>
          </div>

          <p className="text-gray-600 mb-4">
            {t('researchInProgress.description')}
          </p>


          <div className="bg-blue-50 p-6 rounded-lg mb-8 text-left">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">{t('researchInProgress.researchingProject')}</h2>
            <h3 className="text-blue-600 font-medium mb-3">{formData.title}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">{t('fields.industry')}:</span> {
                formData.industry ? tIndustries(formData.industry as any) : t('common.unspecified')
              }</p>
              <p><span className="font-medium">{t('fields.businessDescription')}:</span> {
                formData.businessDescription || t('common.unspecified')
              }</p>
              <p><span className="font-medium">{t('fields.targetUniversity')}:</span> {
                Array.isArray(formData.university) && formData.university.includes("全大学")
                  ? t('researchInProgress.allUniversities', { count: Object.values(universitiesBySubregion).flat().length })
                  : t('researchInProgress.universityCount', { count: Array.isArray(formData.university) ? formData.university.length : 0 })
              }</p>
              <p><span className="font-medium">{t('fields.researcherLevel')}:</span> {
                Array.isArray(formData.researcherLevel) && formData.researcherLevel.length === 10
                  ? t('researchInProgress.allLevels')
                  : Array.isArray(formData.researcherLevel) && formData.researcherLevel.length > 0
                  ? t('researchInProgress.levelCount', { count: formData.researcherLevel.length })
                  : t('common.unspecified')
              }</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg">

      {/* === 上段ブロック: AI課題診断 === */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-md space-y-6 border border-blue-300">

        {/* 案件のタイトル */}
        <div>
          <label className="block text-sm font-medium mb-1">{t('fields.projectTitleLabel')} <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            maxLength={40}
            placeholder={t('placeholders.projectTitle')}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
          <div className="text-right -mt-1 mb-2">
            <span className="text-xs text-gray-400">
              {t('charCount.projectTitle', { current: formData.title.length, max: 40 })}
            </span>
          </div>
        </div>

      {/* 案件内容 */}
      <div>
        <label className="block text-sm font-medium mb-1">{t('fields.projectContentLabel')}<span className="text-red-500">*</span></label>
        <textarea
          name="background"
          value={formData.background}
          onChange={handleChange}
          placeholder={t('placeholders.projectContent')}
          maxLength={2000}
          className="w-full p-2 border border-gray-300 rounded-lg"
          rows={10}
        />
        <div className="text-right -mt-1 mb-2">
          <span className="text-xs text-gray-400">
            {t('charCount.projectContent', { current: formData.background.length, max: 2000 })}
          </span>
        </div>
      </div>

      {/* 業種 */}
      <div>
        <label className="block text-sm font-medium mb-1">{t('fields.industry')}</label>
        <select
          name="industry"
          value={formData.industry}
          onChange={handleChange}
          className="w-full p-2 pr-8 border border-gray-300 rounded-lg"
        >
          <option value="">{t('placeholders.selectIndustry')}</option>
          {allIndustries.map((industry) => (
            <option key={industry} value={industry}>
              {tIndustries(industry as any)}
            </option>
          ))}
        </select>
      </div>

      {/* 事業内容 */}
      <div className="relative">
        <label className="block text-sm font-medium mb-1">{t('fields.businessDescriptionLabel')}</label>
        <textarea
          name="businessDescription"
          value={formData.businessDescription}
          onChange={handleChange}
          placeholder={t('placeholders.businessDescription')}
          maxLength={100}
          className="w-full p-2 border border-gray-300 rounded-lg resize-none"
          rows={3}
        />
        <div className="text-right -mt-1 mb-2">
          <span className="text-xs text-gray-400">
            {t('charCount.businessDescription', { current: formData.businessDescription.length, max: 100 })}
          </span>
        </div>

        {/* 入力欄の外側・右下にボタンを配置 */}
        <div className="flex flex-col items-center mt-6 space-y-2">
          <p className="text-xs text-gray-800 text-center">
            {t('aiAssist.promotionText')}
          </p>
          <button
            type="button"
            onClick={handleDiagnosis}
            className="bg-blue-400 hover:bg-blue-500 text-white text-sm font-semibold py-1 px-3 rounded"
          >
            {t('aiAssist.buttonText')}
          </button>
        </div>

        {/* AI診断確認ポップアップ */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <span className="text-blue-600 text-xl mr-3">✨</span>
                <h2 className="text-lg font-semibold">{t('aiAssist.modal.confirmTitle')}</h2>
              </div>
              <p className="text-gray-700 text-sm mb-6">
                {t('aiAssist.modal.confirmDescription')}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  className="px-6 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition font-medium flex items-center gap-2"
                  onClick={executeDiagnosis}
                >
                  <span>✨</span>
                  {t('aiAssist.modal.executeButton')}
                </button>
                <button
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  onClick={() => setShowConfirmModal(false)}
                >
                  {tCommon('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4">
              <div className="flex items-center mb-4">
                <span className="text-blue-600 text-xl mr-3">✨</span>
                <h2 className="text-lg font-semibold">{t('aiAssist.modal.resultTitle')}</h2>
              </div>
              <div className="mb-4">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('aiAssist.modal.aiProposal')}</label>
                </div>
                <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 max-h-60 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-sm text-gray-800">{diagnosisResult}</p>
                </div>
                <div className="text-right mt-1">
                  <span className="text-xs text-gray-400">
                    {t('charCount.aiProposal', { current: diagnosisResult?.length || 0, max: 2000 })}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  className="px-6 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition font-medium"
                  onClick={applyDiagnosisResult}
                >
                  {t('aiAssist.modal.applyButton')}
                </button>
                <button
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  onClick={() => setShowModal(false)}
                >
                  {tCommon('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <span className="text-blue-600 text-xl mr-3">✨</span>
                <h2 className="text-lg font-semibold">{t('aiAssist.modal.loadingTitle')}</h2>
              </div>
              <p className="text-gray-700 text-sm mb-6">
                {t('aiAssist.modal.loadingDescription')}
              </p>
              <div className="flex flex-col items-center">
                <svg
                  className="animate-spin h-10 w-10 text-blue-500 mb-4"
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                <p className="text-gray-600 text-center">{t('aiAssist.modal.analyzing')}</p>
              </div>
            </div>
          </div>
        )}

        {validationError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
              <p className="text-lg font-medium mb-4 text-red-600">{validationError}</p>
              <button
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                onClick={() => setValidationError(null)}
              >
                {tCommon('ok')}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>

      {/* === 下段ブロック: 大学〜確認ボタン === */}
      {/* 大学 */}
      <div>
        <label className="block text-sm font-medium mb-1">{t('fields.university')} <span className="text-red-500">*</span></label>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
          <UniversitySelect
            value={formData.university || []}
            onChange={(value) => {
              const allUniversityNames = Object.values(universitiesBySubregion).flat();
              const isAllSelected = value.length === allUniversityNames.length;
              const updated = isAllSelected ? ["全大学"] : value;

              setFormData(prev => ({ ...prev, university: updated }));
              setSelectedUniversities(value); // Use the actual selected universities, not the compressed format
            }}
          />
        </div>
      </div>


      {/* 研究者階層 */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('fields.researcherLevel')} <span className="text-red-500">*</span>
        </label>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
          {/* 上段：すべて選択 */}
          <div className="mb-4 pb-4 border-b border-gray-300">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={formData.researcherLevel.length === allResearcherLevels.length}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  const updatedLevels = isChecked ? allResearcherLevels : [];
                  setFormData(prev => ({ ...prev, researcherLevel: updatedLevels }));
                }}
                className="w-4 h-4 accent-blue-500"
              />
              <span>{t('fields.selectAll')}</span>
            </label>
          </div>

          {/* 下段：研究者階層チェックボックス（2列レイアウト） */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {allResearcherLevels.map((level) => (
              <label key={level} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  name="researcherLevel"
                  value={level}
                  checked={formData.researcherLevel.includes(level)}
                  onChange={(e) => {
                    const value = e.target.value;
                    const isChecked = e.target.checked;
                    const updatedLevels = isChecked
                      ? [...formData.researcherLevel, value]
                      : formData.researcherLevel.filter(item => item !== value);

                    setFormData(prev => ({ ...prev, researcherLevel: updatedLevels }));
                  }}
                  className="w-4 h-4 accent-blue-500"
                />
                <span>{tLevels(level as any)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ボタン */}
      <div className="flex justify-center">
        <button type="submit" className="bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-800">
          {t('buttons.submitProject')}
        </button>
      </div>

      {/* AIリサーチ実行確認モーダル */}
      {showResearchConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-semibold">{t('aiResearch.modal.confirmTitle')}</h2>
            </div>
            <p className="text-gray-700 text-sm mb-6">
              {t('aiResearch.modal.confirmDescription')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                onClick={executeAIResearch}
              >
                {tCommon('yes')}
              </button>
              <button
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                onClick={() => setShowResearchConfirmModal(false)}
              >
                {tCommon('no')}
              </button>
            </div>
          </div>
        </div>
      )}

    </form>
  );
}


