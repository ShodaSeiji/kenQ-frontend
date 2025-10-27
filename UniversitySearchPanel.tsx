"use client";
import { useEffect, useState } from "react";
import universitiesJson from "@/data/universities_by_subregion.json";

type Props = {
  value: string;
  onChange: (selected: string) => void;
};

export default function UniversitySearchPanel({ value, onChange }: Props) {
  const [mode, setMode] = useState<"none" | "all" | "area">("none");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>(
    value ? value.split(" / ") : []
  );

  const areas = Object.keys(universitiesJson);
  const universitiesByArea = (area: string) => universitiesJson[area as keyof typeof universitiesJson];
  const allUniversities = Object.values(universitiesJson).flat();

  const toggleArea = (area: string) => {
    const updated = selectedAreas.includes(area)
      ? selectedAreas.filter(a => a !== area)
      : [...selectedAreas, area];
    setSelectedAreas(updated);
  };

  const toggleUniversity = (name: string) => {
    const updated = selectedUniversities.includes(name)
      ? selectedUniversities.filter(n => n !== name)
      : [...selectedUniversities, name];
    setSelectedUniversities(updated);
  };

  // 🔁 university選択が変わったら親に文字列で通知
  useEffect(() => {
    onChange(selectedUniversities.join(" / "));
  }, [selectedUniversities]);

  return (
    <div className="space-y-4">
      {/* モード選択 */}
      <div className="flex gap-4">
        <label>
          <input
            type="radio"
            name="univMode"
            value="all"
            checked={mode === "all"}
            onChange={() => {
              setMode("all");
              setSelectedAreas([]);
              setSelectedUniversities(allUniversities);
              onChange(allUniversities.join(" / "));
            }}
          />
          <span className="ml-1">全大学</span>
        </label>
        <label>
          <input
            type="radio"
            name="univMode"
            value="area"
            checked={mode === "area"}
            onChange={() => {
              setMode("area");
              setSelectedUniversities([]);
              onChange(""); // リセット
            }}
          />
          <span className="ml-1">エリアから選ぶ</span>
        </label>
      </div>

      {/* 地域 & 大学の選択 */}
      {mode === "area" && (
        <>
          <div>
            <p className="font-semibold mb-2">地域を選択</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {areas.map((area) => (
                <label key={area}>
                  <input
                    type="checkbox"
                    checked={selectedAreas.includes(area)}
                    onChange={() => toggleArea(area)}
                  />
                  <span className="ml-1">{area}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedAreas.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold mb-2">大学</p>
              {selectedAreas.map((area) => (
                <div key={area} className="mb-4">
                  <p className="underline font-medium">{area}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mt-2 ml-2">
                    {universitiesByArea(area).map((uni: string) => (
                      <label key={uni} className="block whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUniversities.includes(uni)}
                          onChange={() => toggleUniversity(uni)}
                        />
                        <span className="ml-1">{uni}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 選択された大学の一覧 */}
      {selectedUniversities.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <p className="font-semibold mb-2">検索結果（{selectedUniversities.length}校）</p>
          <ul className="list-disc pl-5 text-sm text-gray-800">
            {selectedUniversities.map((uni) => (
              <li key={uni}>{uni}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}



