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
    <div class="bg-surface rounded-xl max-w-md w-full p-6 shadow-lg space-y-4 text-left relative transform transition-all duration-300 scale-95" style="font-family: inherit;">
      <div class="flex items-center justify-between">
        <h3 class="font-serif text-lg font-semibold text-ink">공유 문구를 복사했습니다</h3>
        <button id="pc-share-close-btn-top" class="text-ink-faint hover:text-ink transition-colors cursor-pointer p-1" aria-label="닫기">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p class="text-sm text-ink-soft leading-relaxed">
        카카오톡 대화방이나 SNS에 붙여넣기(Ctrl+V) 하면 바로 보낼 수 있습니다.
      </p>

      <div class="space-y-1.5">
        <label class="text-xs text-ink-faint">복사된 내용</label>
        <textarea id="pc-share-textarea" readonly class="w-full h-28 p-3 text-sm text-ink bg-sunken rounded-xl focus:outline-none focus:ring-1 focus:ring-ink resize-none leading-relaxed select-all" style="font-family: inherit;">${text}</textarea>
      </div>

      <div class="flex gap-2 pt-1">
        <button id="pc-share-copy-btn" class="flex-1 py-3 px-4 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer">
          다시 복사하기
        </button>
        <button id="pc-share-close-btn" class="py-3 px-4 bg-sunken hover:bg-line text-ink text-sm font-semibold rounded-xl transition-colors cursor-pointer">
          닫기
        </button>
      </div>

      <div id="pc-share-toast" class="absolute bottom-16 left-1/2 -translate-x-1/2 bg-ink text-white text-xs font-medium px-3 py-2 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none">
        다시 복사했습니다
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
          text: `${data.title}\n\n${data.description}\n\n결과 확인하기:`,
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
    const shareText = `[인연사주] ${data.title}\n\n${data.badge ? `${data.badge}\n` : ""}${data.score ? `인연 지수 ${data.score}점\n` : ""}\n"${data.description}"\n\n궁합과 사주 확인하기:\n${data.url}`;

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

