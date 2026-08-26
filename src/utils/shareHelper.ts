// Utility helper for KakaoTalk and Social Sharing

export interface ShareData {
  title: string;
  description: string;
  url: string;
  badge?: string;
  score?: number;
}

function showPCShareModal(text: string, url: string) {
  // 1. Remove existing share modal if present
  const existing = document.getElementById("pc-share-modal");
  if (existing) {
    existing.remove();
  }

  // 2. Create the modal container
  const modal = document.createElement("div");
  modal.id = "pc-share-modal";
  modal.className = "fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300";
  
  // 3. Inject premium, brand-aligned HTML with Zero-Trust styling (Warm/Neutral + Red Accent)
  modal.innerHTML = `
    <div class="bg-[#FCFAF6] border border-[#E7E1D6] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left relative transform transition-all duration-300 scale-95" style="font-family: inherit;">
      <div class="flex items-center justify-between border-b border-[#EFE9DF] pb-3">
        <h3 class="text-sm font-serif font-bold text-[#1E293B] flex items-center gap-2">
          <span>📋 초대 메시지 복사 완료!</span>
        </h3>
        <button id="pc-share-close-btn-top" class="text-[#8C7E74] hover:text-[#5C5046] transition cursor-pointer p-1">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <p class="text-xs text-[#5C5046] leading-relaxed">
        인연사주의 결과 및 초대 메시지가 클립보드에 안전하게 복사되었습니다.<br />
        <strong>카카오톡 대화방</strong>이나 단톡방, SNS 등에 <strong>붙여넣기(Ctrl+V / 길게 눌러 붙여넣기)</strong> 하시면 바로 전송할 수 있습니다!
      </p>

      <div class="space-y-1.5">
        <label class="text-[10px] font-bold text-[#8C7E74] uppercase tracking-wider">복사된 공유 내용</label>
        <div class="relative">
          <textarea id="pc-share-textarea" readonly class="w-full h-28 p-3 text-xs text-[#2C3E50] bg-[#F5EFE6] border border-[#E7E1D6] rounded-xl focus:outline-none resize-none leading-relaxed select-all" style="font-family: inherit;">${text}</textarea>
        </div>
      </div>

      <div class="flex gap-2.5 pt-1">
        <button id="pc-share-copy-btn" class="flex-1 py-2.5 px-4 bg-[#C0392B] hover:bg-[#A93226] text-white text-xs font-bold rounded-full transition active:scale-[0.98] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          <span>다시 복사하기</span>
        </button>
        <button id="pc-share-close-btn" class="py-2.5 px-4 bg-[#EFE9DF] hover:bg-[#E7E1D6] text-[#5C5046] text-xs font-bold rounded-full transition cursor-pointer border border-[#E7E1D6]">
          닫기
        </button>
      </div>
      
      <div id="pc-share-toast" class="absolute bottom-16 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md opacity-0 transition-opacity duration-300 pointer-events-none">
        클립보드에 다시 복사되었습니다!
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Trigger scale animation
  setTimeout(() => {
    const modalContent = modal.querySelector(".transform");
    if (modalContent) {
      modalContent.classList.remove("scale-95");
      modalContent.classList.add("scale-100");
    }
  }, 10);

  const closeBtnTop = document.getElementById("pc-share-close-btn-top");
  const closeBtn = document.getElementById("pc-share-close-btn");
  const copyBtn = document.getElementById("pc-share-copy-btn");
  const textarea = document.getElementById("pc-share-textarea") as HTMLTextAreaElement;
  const toast = document.getElementById("pc-share-toast");

  const closeModal = () => {
    const modalContent = modal.querySelector(".transform");
    if (modalContent) {
      modalContent.classList.remove("scale-100");
      modalContent.classList.add("scale-95");
    }
    modal.classList.add("opacity-0");
    setTimeout(() => {
      modal.remove();
    }, 200);
  };

  closeBtnTop?.addEventListener("click", closeModal);
  closeBtn?.addEventListener("click", closeModal);

  // Close when clicking backdrop
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  copyBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      if (textarea) {
        textarea.select();
        document.execCommand("copy");
      }
    }
    
    if (toast) {
      toast.classList.remove("opacity-0");
      toast.classList.add("opacity-100");
      setTimeout(() => {
        toast.classList.remove("opacity-100");
        toast.classList.add("opacity-0");
      }, 1500);
    }
  });
}

export function shareToKakaoOrClipboard(data: ShareData): Promise<{ success: boolean; method: "kakao" | "clipboard" | "web_share" }> {
  return new Promise(async (resolve) => {
    // 1. Check Web Share API (Mobile Browsers: Safari iOS, Chrome Android etc.)
    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: data.title,
          text: `${data.title}\n\n${data.description}\n\n👉 결과 확인하기:`,
          url: data.url,
        });
        resolve({ success: true, method: "web_share" });
        return;
      } catch (err: any) {
        // If user cancelled, don't fall through to error
        if (err.name === "AbortError") {
          resolve({ success: true, method: "web_share" });
          return;
        }
      }
    }

    // 2. Fallback: Copy structured viral message to clipboard
    const shareText = `[인연사주(因緣四柱)] ${data.title}\n\n${data.badge ? `✨ ${data.badge}\n` : ""}${data.score ? `💯 인연 지수: ${data.score}점\n` : ""}\n"${data.description}"\n\n🔮 나와의 궁합 & 사주 확인하기:\n${data.url}`;

    try {
      await navigator.clipboard.writeText(shareText);
      // Show the beautiful PC sharing notification modal
      showPCShareModal(shareText, data.url);
      resolve({ success: true, method: "clipboard" });
    } catch (e) {
      // Fallback for older browsers / strict iframe sandboxing
      const textarea = document.createElement("textarea");
      textarea.value = shareText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      
      // Also show the modal for user safety
      showPCShareModal(shareText, data.url);
      resolve({ success: true, method: "clipboard" });
    }
  });
}

