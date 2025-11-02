"use client";
import React, { useState } from "react";
import universitiesBySubregion from "@/data/universities_by_subregion.json";

type UniversitySelectProps = {
    value: string[];
    onChange: (selected: string[], allSelected?: boolean) => void;
};


export default function UniversitySelect({ value, onChange }: UniversitySelectProps) {
    const allUniversities = Object.values(universitiesBySubregion).flat();
    
    const [selectionMode, setSelectionMode] = useState<'none' | 'all' | 'regions'>('none');
    
    // 現在の選択状態を value prop から算出
    const selectedUniversities = value?.includes("全大学") ? allUniversities : (value || []);
    const isAllSelected = selectedUniversities.length === allUniversities.length;

    const handleToggleUniversity = (univ: string) => {
        const newSelected = selectedUniversities.includes(univ)
            ? selectedUniversities.filter((u) => u !== univ)
            : [...selectedUniversities, univ];
        
        const allSelected = newSelected.length === allUniversities.length;
        const finalValue = allSelected ? ["全大学"] : newSelected;
        onChange(finalValue, allSelected);
    };

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectionMode('none');
            onChange([], false);
        } else {
            setSelectionMode('all');
            onChange(["全大学"], true);
        }
    };


    const handleSelectRegions = () => {
        if (selectionMode === 'regions') {
            setSelectionMode('none');
            onChange([], false);
        } else {
            setSelectionMode('regions');
            // Clear all selections when switching to regions mode
            onChange([], false);
        }
    };

    const handleToggleRegion = (_region: string, universities: string[]) => {
        const allRegionSelected = universities.every((u) => selectedUniversities.includes(u));
        const newSelected = new Set(selectedUniversities);
        
        if (allRegionSelected) {
            // 地域の選択を解除
            universities.forEach((u) => newSelected.delete(u));
        } else {
            // 地域を選択
            universities.forEach((u) => newSelected.add(u));
        }
        
        const finalSelected = Array.from(newSelected);
        const allSelected = finalSelected.length === allUniversities.length;
        const finalValue = allSelected ? ["全大学"] : finalSelected;
        onChange(finalValue, allSelected);
    };

    return (
        <div>
            {/* 選択オプション */}
            <div className="space-y-3">
                {/* 全大学を選択 */}
                <div>
                    <label className="flex items-center space-x-2 text-sm">
                        <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                            className="w-4 h-4 accent-blue-500"
                        />
                        <span>全大学を選択（{allUniversities.length}校）</span>
                    </label>
                </div>


                {/* エリアから選択 */}
                <div>
                    <label className="flex items-center space-x-2 text-sm">
                        <input
                            type="checkbox"
                            checked={selectionMode === 'regions'}
                            onChange={handleSelectRegions}
                            className="w-4 h-4 accent-blue-500"
                        />
                        <span>エリアから選択</span>
                    </label>
                </div>

                {/* エリア選択の詳細表示 */}
                {selectionMode === 'regions' && (
                    <div className="ml-6 mt-3 bg-white p-4 rounded border max-h-96 overflow-y-auto">
                        {Object.entries(universitiesBySubregion).map(([region, universities]) => {
                            const allRegionSelected = universities.every((u) =>
                                selectedUniversities.includes(u)
                            );

                            return (
                                <div key={region} className="mb-4">
                                    <div className="font-medium mb-2 flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={allRegionSelected}
                                            onChange={() => handleToggleRegion(region, universities)}
                                            className="w-4 h-4 accent-blue-500"
                                        />
                                        <span className="text-sm">{region}</span>
                                    </div>
                                    <div className="ml-6 grid grid-cols-3 gap-x-4 gap-y-1">
                                        {universities.map((univ) => {
                                            const isSelected = selectedUniversities.includes(univ);
                                            return (
                                                <label key={univ} className="flex items-center space-x-2 text-xs">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleUniversity(univ)}
                                                        className="w-3 h-3 accent-blue-500"
                                                    />
                                                    <span>{univ}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 選択された大学数 */}
            <div className="mt-6 pt-4 border-t border-gray-300">
                <p className="text-sm font-medium">
                    選択された大学: {selectedUniversities.length}校
                </p>
            </div>
        </div>
    );
}



