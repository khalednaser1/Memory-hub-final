import fs from "fs";
import path from "path";

export type PdfStatus = "extracted" | "scanned" | "protected" | "encrypted" | "error" | "empty";

export interface FileProcessResult {
  extractedText: string;
  wordCount: number;
  characterCount: number;
  supported: boolean;
  message: string;
  pdfStatus?: PdfStatus;
  pdfPageCount?: number;
}

// ─── PDF page count from raw bytes (fallback when pdf-parse fails) ─────────────
function countPdfPagesRaw(filePath: string): number {
  try {
    const buf = fs.readFileSync(filePath);
    const text = buf.toString("latin1");
    // Count "/Type /Page" occurrences (each page has this)
    const matches = text.match(/\/Type\s*\/Page[^s]/g);
    if (matches && matches.length > 0) return matches.length;
    // Fallback: count "Page" keyword refs
    const matches2 = text.match(/endobj\s+\d+\s+0\s+obj\s*<</g);
    return matches2 ? Math.max(1, Math.floor(matches2.length / 3)) : 0;
  } catch {
    return 0;
  }
}

// ─── Detect if PDF is encrypted from raw header ───────────────────────────────
function isPdfEncrypted(filePath: string): boolean {
  try {
    const buf = fs.readFileSync(filePath, { encoding: null });
    const header = buf.subarray(0, Math.min(4096, buf.length)).toString("latin1");
    return header.includes("/Encrypt") || header.includes("/Crypt");
  } catch {
    return false;
  }
}

// ─── Main extraction function ─────────────────────────────────────────────────
export async function extractTextFromFile(
  filePath: string,
  mimeType: string,
  originalName: string
): Promise<FileProcessResult> {
  const ext = path.extname(originalName).toLowerCase();

  // ── Plain text files ────────────────────────────────────────────────────────
  if (mimeType.startsWith("text/") || ext === ".txt" || ext === ".md" || ext === ".csv") {
    try {
      const text = fs.readFileSync(filePath, "utf-8");
      return {
        extractedText: text,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        characterCount: text.length,
        supported: true,
        message: "Текст успешно извлечён",
      };
    } catch {
      return { extractedText: "", wordCount: 0, characterCount: 0, supported: false, message: "Не удалось прочитать файл" };
    }
  }

  // ── PDF files ───────────────────────────────────────────────────────────────
  if (mimeType === "application/pdf" || ext === ".pdf") {
    // First: check for encryption in raw bytes
    const encrypted = isPdfEncrypted(filePath);

    try {
      const pdfParse = (await import("pdf-parse")).default;
      const buffer = fs.readFileSync(filePath);

      // pdf-parse options: suppress test mode warnings, allow more pages
      const data = await pdfParse(buffer, {
        max: 0, // parse all pages
      });

      const rawText = data.text || "";
      const text = rawText.replace(/\s+/g, " ").trim();
      const pageCount = data.numpages || 0;

      // Distinguish: parsed OK but no text → scanned PDF (image-based)
      if (!text || text.length < 20) {
        return {
          extractedText: "",
          wordCount: 0,
          characterCount: 0,
          supported: false,
          pdfStatus: "scanned",
          pdfPageCount: pageCount,
          message: pageCount > 0
            ? `Сканированный PDF (${pageCount} стр.) — текст хранится как изображения, требуется OCR`
            : "Сканированный PDF — текст хранится как изображения, требуется OCR",
        };
      }

      return {
        extractedText: text,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        characterCount: text.length,
        supported: true,
        pdfStatus: "extracted",
        pdfPageCount: pageCount,
        message: `PDF: ${pageCount} стр., извлечено ${text.split(/\s+/).filter(Boolean).length} слов`,
      };
    } catch (e: any) {
      const errMsg = (e?.message || "").toLowerCase();

      // Password / DRM protected
      if (encrypted || errMsg.includes("password") || errMsg.includes("encrypt") || errMsg.includes("decrypt")) {
        return {
          extractedText: "",
          wordCount: 0,
          characterCount: 0,
          supported: false,
          pdfStatus: "protected",
          pdfPageCount: countPdfPagesRaw(filePath),
          message: "PDF защищён паролем или DRM — скачайте файл для просмотра",
        };
      }

      // Try raw page count
      const rawPageCount = countPdfPagesRaw(filePath);

      // If we can count pages, the file is readable — likely scanned or complex format
      // rather than a true corruption. Treat as scanned for user clarity.
      if (rawPageCount > 0 && !encrypted) {
        return {
          extractedText: "",
          wordCount: 0,
          characterCount: 0,
          supported: false,
          pdfStatus: "scanned",
          pdfPageCount: rawPageCount,
          message: `Сканированный PDF (${rawPageCount} стр.) — текст хранится как изображения, требуется OCR`,
        };
      }

      return {
        extractedText: "",
        wordCount: 0,
        characterCount: 0,
        supported: false,
        pdfStatus: "error",
        pdfPageCount: rawPageCount,
        message: rawPageCount > 0
          ? `Не удалось извлечь текст из PDF (~${rawPageCount} стр.) — файл доступен для скачивания`
          : "Не удалось извлечь текст из PDF — файл доступен для скачивания",
      };
    }
  }

  // ── DOCX files ──────────────────────────────────────────────────────────────
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value.replace(/\s+/g, " ").trim();
      return {
        extractedText: text,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        characterCount: text.length,
        supported: true,
        message: "DOCX: текст успешно извлечён",
      };
    } catch {
      return { extractedText: "", wordCount: 0, characterCount: 0, supported: false, message: "Не удалось извлечь текст из DOCX" };
    }
  }

  // ── Images — metadata only ──────────────────────────────────────────────────
  if (mimeType.startsWith("image/")) {
    return {
      extractedText: "",
      wordCount: 0,
      characterCount: 0,
      supported: false,
      message: "Изображение сохранено (OCR не поддерживается)",
    };
  }

  return {
    extractedText: "",
    wordCount: 0,
    characterCount: 0,
    supported: false,
    message: `Тип файла (${ext}) не поддерживается для извлечения текста`,
  };
}
