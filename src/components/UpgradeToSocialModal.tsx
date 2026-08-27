import React, { useState } from "react";
import { X, Chrome, CheckCircle2, ShieldAlert } from "lucide-react";
import { linkCurrentAccountWithGoogle, auth, getUserMembershipInfo } from "../lib/firebase";

interface UpgradeToSocialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  triggerReason?: "create_room" | "use_coupon" | "open_shop" | "profile_upgrade";
}

export default function UpgradeToSocialModal({
  isOpen,
  onClose,
  onSuccess,
  triggerReason = "create_room"
}: UpgradeToSocialModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const membership = getUserMembershipInfo(auth.currentUser);

  const getReasonInfo = () => {
    switch (triggerReason) {
      case "create_room":
        return {
          badge: "모임방 개설 안내",
          title: "Google 계정을 연동하면 모임방을 만들 수 있어요",
          desc: "모임방 개설과 관리(방장 권한)는 Google 연동 정회원에게 제공돼요."
        };
      case "use_coupon":
        return {
          badge: "쿠폰 사용 안내",
          title: "Google 계정을 연동하고 쿠폰 혜택을 받아 보세요",
          desc: "1회 확인권과 프로모션 쿠폰은 부정 사용 방지를 위해 Google 연동 정회원에게 지급돼요."
        };
      case "open_shop":
        return {
          badge: "상점 이용 안내",
          title: "상점 이용에는 Google 계정 연동이 필요해요",
          desc: "심층 리포트와 유료 패스는 계정 보안과 소장 관리를 위해 Google 연동 정회원에게 제공돼요."
        };
      default:
        return {
          badge: "정회원 전환 안내",
          title: "Google 계정을 연동하면 정회원으로 전환돼요",
          desc: "기존에 참여한 방 목록과 궁합 기록은 그대로 유지되고, 정회원 권한이 바로 적용돼요."
        };
    }
  };

  const reasonInfo = getReasonInfo();

  const handleLinkGoogle = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await linkCurrentAccountWithGoogle();
      setSuccessMsg(res.message);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Google 연동 중 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div
        className="bg-surface rounded-xl w-full max-w-md p-6 sm:p-7 shadow-lg space-y-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-xl text-ink-faint hover:text-ink hover:bg-sunken transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <p className="text-xs text-ink-faint">{reasonInfo.badge}</p>
          <h3 className="font-serif text-lg font-semibold text-ink leading-snug">
            {reasonInfo.title}
          </h3>
          <p className="text-xs text-ink-soft leading-relaxed">
            {reasonInfo.desc}
          </p>
        </div>

        {/* Current Account Status Box */}
        <div className="bg-sunken p-4 rounded-xl text-left space-y-2.5">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-line">
            <span className="text-ink-faint">현재 로그인 계정</span>
            <span className="font-medium text-ink truncate max-w-[180px]">
              {membership.email || `${membership.displayName} (일반회원)`}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-semibold text-ink block">
              Google 연동 시 활성화되는 혜택
            </span>
            <ul className="space-y-1.5 text-xs text-ink-soft">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-ink-soft shrink-0" />
                <span>팀·친구·동아리 모임방 생성 (방장 권한)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-ink-soft shrink-0" />
                <span>1회 확인권·프로모션 쿠폰 등록과 사용</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-ink-soft shrink-0" />
                <span>기존에 참여한 모임방 목록과 분석 기록 유지</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="flex items-start gap-2 bg-sunken text-seal text-xs p-3 rounded-xl">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 bg-sunken text-ink text-xs p-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-ink-soft mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleLinkGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-seal hover:bg-seal-deep text-white py-3 px-4 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Chrome className="w-4 h-4" />
            <span>{loading ? "Google 연동 중..." : "Google 계정 연동하고 정회원 전환"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs text-ink-soft hover:text-ink transition-colors cursor-pointer"
          >
            다음에 하기 (일반회원 유지)
          </button>
        </div>

      </div>
    </div>
  );
}
