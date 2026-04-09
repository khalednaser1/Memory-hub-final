import fs from "fs";
import path from "path";

export interface FileProcessResult {
  extractedText: string;
  wordCount: number;
  characterCount: number;
  supported: boolean;
  message: string;
}

export async function extractTextFromFile(
  filePath: string,
  mimeType: string,
  originalName: string
): Promise<FileProcessResult> {
  const ext = path.extname(originalName).toLowerCase();

  // Plain text files
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
    } catch (e) {
      return { extractedText: "", wordCount: 0, characterCount: 0, supported: false, message: "Не удалось прочитать файл" };
    }
  }

  // PDF files
  if (mimeType === "application/pdf" || ext === ".pdf") {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      const text = data.text.replace(/\s+/g, " ").trim();
      return {
        extractedText: text,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        characterCount: text.length,
        supported: true,
        message: `PDF: ${data.numpages} стр., текст извлечён`,
      };
    } catch (e) {
      return { extractedText: "", wordCount: 0, characterCount: 0, supported: false, message: "Не удалось извлечь текст из PDF" };
    }
  }

  // DOCX files
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
    } catch (e) {
      return { extractedText: "", wordCount: 0, characterCount: 0, supported: false, message: "Не удалось извлечь текст из DOCX" };
    }
  }

  // Images — metadata only
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
