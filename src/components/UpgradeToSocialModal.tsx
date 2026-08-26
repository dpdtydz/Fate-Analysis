import React, { useState } from "react";
import { X, Sparkles, Chrome, CheckCircle2, ShieldAlert, ArrowRight, Star, KeyRound, Lock } from "lucide-react";
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
          badge: "👑 모임방 개설 권한 안내",
          title: "Google 계정 연동 후 모임방을 개설하실 수 있습니다",
          desc: "호스트(방장)의 사주 분석 및 다인원 모임방 관리는 신뢰성 있는 Google 연동 정회원에게만 제공됩니다."
        };
      case "use_coupon":
        return {
          badge: "🎫 쿠폰 혜택 해금 안내",
          title: "Google 계정을 연동하고 쿠폰 혜택을 받으세요",
          desc: "1회 확인권 및 오픈베타 프로모션 쿠폰은 어뷰징 방지를 위해 Google 연동 정회원 전용으로 지급됩니다."
        };
      case "open_shop":
        return {
          badge: "🔒 유료 상점 이용 안내",
          title: "안전한 구매 및 소장을 위해 Google 연동이 필요합니다",
          desc: "AI 심층 리포트 및 유료 패스는 안전한 계정 보안과 영구 소장을 위해 Google 연동 정회원에게 제공됩니다."
        };
      default:
        return {
          badge: "🌟 정회원 승급 혜택",
          title: "Google 계정 연동으로 모든 기능 즉시 해금",
          desc: "기존에 참여했던 방 목록과 궁합 기록은 100% 안전하게 유지되며, 정회원 권한이 즉시 부여됩니다."
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
      setErrorMsg(err.message || "Google 연동 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-[#FFFDF9] border border-[#E0D8CC] rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gold Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#5C5046] hover:text-[#2C3E50] hover:bg-black/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-serif font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            {reasonInfo.badge}
          </div>
          <h3 className="font-serif font-black text-xl text-[#2C3E50] leading-snug">
            {reasonInfo.title}
          </h3>
          <p className="text-xs text-[#5C5046] leading-relaxed">
            {reasonInfo.desc}
          </p>
        </div>

        {/* Current Account Status Box */}
        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E0D0] text-left space-y-2.5">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E8E0D0]">
            <span className="text-[#5C5046]">현재 로그인 계정:</span>
            <span className="font-serif font-bold text-[#2C3E50] truncate max-w-[180px]">
              {membership.email || `${membership.displayName} (일반회원)`}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-serif font-bold text-amber-900 block text-[11px]">
              ✨ Google SNS 1초 연동 시 즉시 활성화되는 혜택:
            </span>
            <ul className="space-y-1.5 text-[11px] text-[#5A4D41]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>팀/친구/동아리 <strong>모임방 무제한 생성</strong> (방장 권한)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>1회 확인권 및 <strong>오픈베타 프로모션 쿠폰</strong> 등록・사용</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>기존 참여했던 <strong>모임방 목록 및 분석 기록 100% 보존</strong></span>
              </li>
            </ul>
          </div>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-2xl animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-2xl">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleLinkGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white py-3.5 px-4 rounded-2xl font-serif font-bold text-sm shadow-lg transition transform active:scale-98 disabled:opacity-50"
          >
            <Chrome className="w-4 h-4 text-white" />
            <span>{loading ? "Google 연동 처리 중..." : "🚀 1초만에 Google 연동하고 정회원 승급"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs text-[#5C5046] hover:text-[#2C3E50] transition font-sans"
          >
            다음에 하기 (현재 일반회원 유지)
          </button>
        </div>

      </div>
    </div>
  );
}
