import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export interface PdfExportOptions {
  filename?: string;
  quality?: number;
  scale?: number;
  backgroundColor?: string;
}

/**
 * Directly exports an HTML DOM element into a downloadable PDF document
 * using html2canvas and jsPDF with pagination support.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const scale = options.scale || 2;
    const quality = options.quality || 0.95;
    const backgroundColor = options.backgroundColor || "#FCFAF6";
    const filename = options.filename || `사주명식_정밀감정서_${new Date().toISOString().slice(0, 10)}.pdf`;

    // 1. Render element to high-res canvas
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      backgroundColor,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc, clonedElement) => {
        // 1. Copy all dynamic style tags from original head to cloned head
        try {
          const originalStyles = document.querySelectorAll("style");
          originalStyles.forEach((styleTag) => {
            clonedDoc.head.appendChild(styleTag.cloneNode(true));
          });
        } catch (e) {
          console.warn("Failed to clone style tags in PDF generator:", e);
        }

        // 2. Explicitly serialize rules from linked stylesheets safely
        let compiledCss = "";
        try {
          for (let i = 0; i < document.styleSheets.length; i++) {
            try {
              const sheet = document.styleSheets[i];
              const rules = sheet.cssRules || sheet.rules;
              if (rules) {
                for (let j = 0; j < rules.length; j++) {
                  compiledCss += rules[j].cssText + "\n";
                }
              }
            } catch (sheetErr) {
              // Ignore SecurityError
            }
          }
        } catch (e) {
          console.warn("Failed to extract stylesheet rules in PDF generator:", e);
        }

        if (compiledCss) {
          try {
            const styleTag = clonedDoc.createElement("style");
            styleTag.innerHTML = compiledCss;
            clonedDoc.head.appendChild(styleTag);

            const innerStyleTag = clonedDoc.createElement("style");
            innerStyleTag.innerHTML = compiledCss;
            clonedElement.appendChild(innerStyleTag);
          } catch (e) {
            console.warn("Failed to inject style blocks in PDF generator:", e);
          }
        }
      }
    });

    // 2. Convert to JPEG image data
    const imgData = canvas.toDataURL("image/jpeg", quality);

    // 3. Create A4 jsPDF instance (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;

    // Subsequent pages if content overflows A4
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }

    // 4. Trigger download
    pdf.save(filename);

    return { success: true };
  } catch (err: any) {
    console.error("PDF Export Error in exportElementToPdf:", err);
    return {
      success: false,
      error: err.message || "PDF 파일 생성 중 오류가 발생했습니다."
    };
  }
}

/**
 * Directly exports an HTML DOM element into a downloadable PNG image.
 */
export async function exportElementToImage(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const scale = options.scale || 2;
    const backgroundColor = options.backgroundColor || "#FCFAF6";
    const filename = options.filename || `사주명식_정밀감정서_${new Date().toISOString().slice(0, 10)}.png`;

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      backgroundColor,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc, clonedElement) => {
        // 1. Copy all dynamic style tags from original head to cloned head
        try {
          const originalStyles = document.querySelectorAll("style");
          originalStyles.forEach((styleTag) => {
            clonedDoc.head.appendChild(styleTag.cloneNode(true));
          });
        } catch (e) {
          console.warn("Failed to clone style tags in Image generator:", e);
        }

        // 2. Explicitly serialize rules from linked stylesheets safely
        let compiledCss = "";
        try {
          for (let i = 0; i < document.styleSheets.length; i++) {
            try {
              const sheet = document.styleSheets[i];
              const rules = sheet.cssRules || sheet.rules;
              if (rules) {
                for (let j = 0; j < rules.length; j++) {
                  compiledCss += rules[j].cssText + "\n";
                }
              }
            } catch (sheetErr) {
              // Ignore SecurityError
            }
          }
        } catch (e) {
          console.warn("Failed to extract stylesheet rules in Image generator:", e);
        }

        if (compiledCss) {
          try {
            const styleTag = clonedDoc.createElement("style");
            styleTag.innerHTML = compiledCss;
            clonedDoc.head.appendChild(styleTag);

            const innerStyleTag = clonedDoc.createElement("style");
            innerStyleTag.innerHTML = compiledCss;
            clonedElement.appendChild(innerStyleTag);
          } catch (e) {
            console.warn("Failed to inject style blocks in Image generator:", e);
          }
        }
      }
    });

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (err: any) {
    console.error("Image Export Error in exportElementToImage:", err);
    return {
      success: false,
      error: err.message || "이미지 저장 중 오류가 발생했습니다."
    };
  }
}
