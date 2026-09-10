import React, { useState, useMemo } from "react";
import { Sparkles, Search, BookOpen, Crown, ChevronRight, Filter } from "lucide-react";
import BottomSheet from "./BottomSheet";
import { IljuMeta, getAllSixtyIlju, getIljuMeta } from "../utils/iljuData";
import { Member } from "../types";
import ZodiacAvatar from "./ZodiacAvatar";

interface IljuEncyclopediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  myIlju?: string;            // e.g. "신묘" or "辛卯"
  groupMembers?: Member[];    // current room members if any
}

export default function IljuEncyclopediaModal({
  isOpen,
  onClose,
  myIlju,
  groupMembers = []
}: IljuEncyclopediaModalProps) {
  const [activeTab, setActiveTab] = useState<"group" | "all">(groupMembers.length > 0 ? "group" : "all");
  const [selectedElement, setSelectedElement] = useState<"전체" | "목" | "화" | "토" | "금" | "수">("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIlju, setSelectedIlju] = useState<IljuMeta | null>(null);

  const allIljuList = useMemo(() => getAllSixtyIlju(), []);

  // Map group members to their IljuMeta
  const memberIljuList = useMemo(() => {
    return groupMembers.map((m) => {
      const gan = m.saju?.daymaster?.gan || "무토";
      const stemChar = gan[0] || "무";
      const jiChar = m.saju?.pillars?.day?.ji || "진";
      const meta = getIljuMeta(`${stemChar}${jiChar}`);
      return {
        member: m,
        meta
      };
    });
  }, [groupMembers]);

  // My Ilju Meta
  const myIljuMeta = useMemo(() => {
    if (!myIlju) return null;
    return getIljuMeta(myIlju);
  }, [myIlju]);

  // Filtered all list
  const filteredAllList = useMemo(() => {
    return allIljuList.filter((item) => {
      const matchesElement = selectedElement === "전체" || item.element === selectedElement;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        item.code.includes(query) ||
        item.hanja.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.animal.includes(query);
      return matchesElement && matchesQuery;
    });
  }, [allIljuList, selectedElement, searchQuery]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      title={
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-seal" />
          <span>60간지 일주(日柱) 수호동물 도감</span>
        </div>
      }
      subtitle="태어난 날이 품은 고유한 동물 영수와 5행의 숨겨진 기질"
      showCloseButton={true}
    >
      {/* Detail View when an Ilju is selected */}
      {selectedIlju ? (
        <div className="space-y-4 text-left animate-fade-in">
          <button
            onClick={() => setSelectedIlju(null)}
            className="text-xs text-ink-soft hover:text-ink font-semibold flex items-center gap-1 cursor-pointer"
          >
            ← 도감 목록으로 돌아가기
          </button>

          {/* Ilju Detail Card */}
          <div
            className="p-5 rounded-2xl border border-line shadow-xs space-y-4"
            style={{
              background: `linear-gradient(135deg, ${selectedIlju.colorHex}10, transparent)`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xs shrink-0"
                  style={{ backgroundColor: `${selectedIlju.colorHex}20` }}
                >
                  {selectedIlju.animalEmoji}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-xl font-bold text-ink">{selectedIlju.title}</h3>
                    <span className="text-xs font-mono text-ink-faint">({selectedIlju.hanja})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: `${selectedIlju.colorHex}20`, color: selectedIlju.colorHex }}
                    >
                      {selectedIlju.element} 기운 · {selectedIlju.colorName}
                    </span>
                    <span className="text-xs text-ink-soft">{selectedIlju.animal}의 영수</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-sunken rounded-xl space-y-1">
              <p className="text-xs font-bold text-ink">{selectedIlju.tagline}</p>
              <p className="text-xs text-ink-soft leading-relaxed">{selectedIlju.summary}</p>
            </div>

            {/* Core Traits */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-ink-faint">대표 핵심 키워드</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedIlju.traits.map((trait, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-surface border border-line text-xs font-medium text-ink"
                  >
                    #{trait}
                  </span>
                ))}
              </div>
            </div>

            {/* Strength & Advice */}
            <div className="space-y-2 pt-2 border-t border-line text-xs">
              <div className="flex items-start gap-2">
                <span className="text-wood font-bold shrink-0">타고난 강점</span>
                <p className="text-ink leading-relaxed">{selectedIlju.strength}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-seal font-bold shrink-0">처세의 지혜</span>
                <p className="text-ink leading-relaxed">{selectedIlju.advice}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Segmented Controls */}
          <div className="flex rounded-xl bg-sunken p-1 border border-line">
            {groupMembers.length > 0 && (
              <button
                onClick={() => setActiveTab("group")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "group"
                    ? "bg-surface text-ink shadow-xs"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                우리 모임 동물 친구들 ({groupMembers.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-surface text-ink shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              60간지 전체 도감 (60)
            </button>
          </div>

          {/* TAB 1: Group Members Animals */}
          {activeTab === "group" && (
            <div className="space-y-3">
              <p className="text-xs text-ink-soft text-left">
                모임 멤버들이 각자 태어난 날(일주)에 깃든 수호동물 생태계입니다. 카드를 눌러 상세 기질을 확인해 보세요.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[52vh] overflow-y-auto pr-1">
                {memberIljuList.map(({ member, meta }) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedIlju(meta)}
                    className="p-3.5 rounded-xl bg-sunken hover:bg-line/70 border border-line flex items-center justify-between gap-3 transition-colors cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-xs shrink-0"
                          style={{ backgroundColor: `${meta.colorHex}15` }}
                        >
                          {meta.animalEmoji}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full overflow-hidden border border-surface bg-surface">
                          <ZodiacAvatar member={member} size={16} fallbackEmoji={member.character_emoji} />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-ink truncate">{member.nickname}</span>
                          <span className="text-[10px] text-ink-faint font-mono">({meta.hanja})</span>
                        </div>
                        <p className="text-xs font-semibold" style={{ color: meta.colorHex }}>
                          {meta.title}
                        </p>
                        <p className="text-[11px] text-ink-soft truncate">{meta.tagline}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-faint group-hover:text-ink group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Full 60 Ganzi Encyclopedia */}
          {activeTab === "all" && (
            <div className="space-y-3 text-left">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Element filter chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {(["전체", "목", "화", "토", "금", "수"] as const).map((elem) => (
                    <button
                      key={elem}
                      onClick={() => setSelectedElement(elem)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        selectedElement === elem
                          ? "bg-ink text-white"
                          : "bg-sunken text-ink-soft hover:text-ink"
                      }`}
                    >
                      {elem === "전체" ? "전체" : `${elem} (${
                        elem === "목" ? "청색" : elem === "화" ? "적색" : elem === "토" ? "황색" : elem === "금" ? "백색" : "흑색"
                      })`}
                    </button>
                  ))}
                </div>

                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-faint" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="간지(갑자, 신묘) 또는 동물 검색"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-sunken border border-line focus:outline-none focus:ring-1 focus:ring-ink"
                  />
                </div>
              </div>

              {/* Grid of 60 Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                {filteredAllList.map((meta) => {
                  const isMine = myIljuMeta?.code === meta.code;
                  return (
                    <div
                      key={meta.code}
                      onClick={() => setSelectedIlju(meta)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 group relative ${
                        isMine
                          ? "bg-seal/10 border-seal shadow-xs"
                          : "bg-surface hover:bg-sunken border-line"
                      }`}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shadow-xs shrink-0"
                        style={{ backgroundColor: `${meta.colorHex}15` }}
                      >
                        {meta.animalEmoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-ink truncate">{meta.code}</span>
                          <span className="text-[10px] text-ink-faint font-mono">({meta.hanja})</span>
                          {isMine && <Crown className="w-3 h-3 text-seal shrink-0 ml-auto" />}
                        </div>
                        <p className="text-[11px] truncate font-medium" style={{ color: meta.colorHex }}>
                          {meta.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center text-[11px] text-ink-faint pt-1">
                일주(日柱)는 사주 8글자 중 내가 태어난 날의 기운으로, 본인의 가장 원초적인 성향과 수호동물을 상징합니다.
              </div>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
