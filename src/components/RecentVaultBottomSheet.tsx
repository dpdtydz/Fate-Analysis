import React, { useState, useEffect } from "react";
import { Clock, Users, Trash2, ArrowRight, Sparkles, FolderArchive, ShieldAlert } from "lucide-react";
import BottomSheet from "./BottomSheet";
import { getRecentRooms, removeRecentRoom, clearAllRecentRooms, getRecentPersonalProfile, RecentRoomItem } from "../lib/offlineVault";

interface RecentVaultBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return new Date(timestamp).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function RecentVaultBottomSheet({ isOpen, onClose }: RecentVaultBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<"rooms" | "profile">("rooms");
  const [rooms, setRooms] = useState<RecentRoomItem[]>([]);
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRooms(getRecentRooms());
      setProfile(getRecentPersonalProfile());
    }
  }, [isOpen]);

  const handleSelectRoom = (code: string) => {
    onClose();
    window.location.hash = `#/room/${code}`;
  };

  const handleRemoveRoom = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    const updated = removeRecentRoom(code);
    setRooms(updated);
  };

  const handleClearAll = () => {
    if (window.confirm("최근 열람한 모든 모임방 기록을 삭제하시겠습니까?")) {
      clearAllRecentRooms();
      setRooms([]);
    }
  };

  const handleGoToMySaju = () => {
    onClose();
    window.location.hash = "#/my-saju";
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      title={
        <div className="flex items-center gap-2">
          <FolderArchive className="w-5 h-5 text-seal" />
          <span>최근 보관함</span>
        </div>
      }
      subtitle="기기에 안전하게 캐시된 최근 모임과 사주 명식"
      showCloseButton={true}
    >
      {/* Segmented Control */}
      <div className="flex rounded-xl bg-sunken p-1 border border-line">
        <button
          onClick={() => setActiveTab("rooms")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "rooms"
              ? "bg-surface text-ink shadow-xs"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          최근 모임방 ({rooms.length})
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === "profile"
              ? "bg-surface text-ink shadow-xs"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          내 사주 명식 {profile ? "✓" : ""}
        </button>
      </div>

      {/* Tab 1: Recent Rooms */}
      {activeTab === "rooms" && (
        <div className="space-y-3">
          {rooms.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-ink-faint/60" />
              <p className="text-sm font-medium text-ink-soft">최근 방문한 모임방이 없습니다.</p>
              <p className="text-xs text-ink-faint">모임에 참여하거나 방을 생성하면 여기에 보관됩니다.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-1">
                {rooms.map((room) => (
                  <div
                    key={room.code}
                    onClick={() => handleSelectRoom(room.code)}
                    className="p-3.5 rounded-xl bg-sunken hover:bg-line/70 border border-line flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink text-sm truncate">
                          {room.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface text-ink-faint font-mono border border-line">
                          #{room.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-soft">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-ink-faint" />
                          {room.memberCount || 1}명
                        </span>
                        <span>·</span>
                        <span>{formatRelativeTime(room.lastVisitedAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleRemoveRoom(e, room.code)}
                        className="p-1.5 text-ink-faint hover:text-fire rounded-lg hover:bg-surface transition-colors cursor-pointer"
                        title="기록에서 삭제"
                        aria-label="기록에서 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ArrowRight className="w-4 h-4 text-ink-faint group-hover:text-seal group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-between items-center text-xs text-ink-faint">
                <span>오프라인 상태에서도 캐시 데이터로 즉시 열람 가능</span>
                <button
                  onClick={handleClearAll}
                  className="text-ink-soft hover:text-fire transition-colors cursor-pointer"
                >
                  기록 전체 삭제
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: My Saju Profile */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          {profile ? (
            <div className="p-4 rounded-xl bg-sunken border border-line space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-seal/10 text-seal flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-ink text-base">
                      {profile.name || profile.nickname || "나의 사주"}
                    </h4>
                    <p className="text-xs text-ink-soft">
                      {profile.birthDate} ({profile.calendarType || "양력"}) {profile.birthTime || "시간 미입력"}
                    </p>
                  </div>
                </div>
              </div>

              {profile.dayMaster && (
                <div className="p-2.5 bg-surface rounded-lg border border-line flex items-center justify-between text-xs">
                  <span className="text-ink-soft">일간 (본원)</span>
                  <span className="font-bold text-ink">{profile.dayMaster}</span>
                </div>
              )}

              <button
                onClick={handleGoToMySaju}
                className="w-full py-2.5 bg-ink text-white rounded-xl text-xs font-semibold hover:bg-seal transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>내 사주 및 소울 카드 보기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <Sparkles className="w-8 h-8 mx-auto text-ink-faint/60" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-ink-soft">저장된 내 사주 프로필이 없습니다.</p>
                <p className="text-xs text-ink-faint">
                  생년월일시를 한 번만 입력해 두면 모임 참여 시 매번 입력할 필요가 없어요.
                </p>
              </div>
              <button
                onClick={handleGoToMySaju}
                className="py-2.5 px-4 bg-seal text-white rounded-xl text-xs font-semibold hover:bg-seal-deep transition-colors cursor-pointer"
              >
                내 사주 분석하러 가기
              </button>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
