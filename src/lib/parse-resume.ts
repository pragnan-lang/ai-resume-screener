import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function extractResumeText(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const extension = fileName.split(".").pop()?.toLowerCase();

  try {
    if (extension === "pdf") {
      const data = await pdfParse(buffer);
      return data.text || "";
    } else if (extension === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } else if (extension === "txt") {
      return buffer.toString("utf-8");
    } else {
      throw new Error(`Unsupported file type: .${extension}. Please upload a PDF, DOCX, or TXT file.`);
    }
  } catch (error: any) {
    console.error("Error extracting text from resume:", error);
    throw new Error(`Failed to extract text from file (${fileName}): ${error.message}`);
  }
}

export function redactPII(
  text: string,
  candidateName?: string,
  candidateEmail?: string
): string {
  let sanitized = text;

  // 1. Redact explicit name if provided
  if (candidateName && candidateName.trim().length > 1) {
    const escapedName = candidateName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nameRegex = new RegExp(`\\b${escapedName}\\b`, "gi");
    sanitized = sanitized.replace(nameRegex, "[REDACTED_NAME]");
  }

  // 2. Redact explicit email if provided
  if (candidateEmail && candidateEmail.trim().length > 1) {
    const escapedEmail = candidateEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const emailRegex = new RegExp(`\\b${escapedEmail}\\b`, "gi");
    sanitized = sanitized.replace(emailRegex, "[REDACTED_EMAIL]");
  }

  // 3. Generic Email addresses
  sanitized = sanitized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    "[REDACTED_EMAIL]"
  );

  // 4. Phone numbers (standard international and US formats)
  sanitized = sanitized.replace(
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    "[REDACTED_PHONE]"
  );

  // 5. Demographics (gender, nationality, DOB, marital status, physical address lines)
  sanitized = sanitized.replace(
    /(?:Nationality|Gender|Sex|DOB|Date of Birth|Age|Marital Status|Address|Permanent Address|Current Address)\s*:\s*[^\r\n]+/gi,
    "[REDACTED_DEMOGRAPHICS]"
  );

  // 6. Common street / pin address patterns
  sanitized = sanitized.replace(
    /\b\d{1,5}\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Zip\s*Code|Postal\s*Code)\b[^\r\n]*/gi,
    "[REDACTED_ADDRESS]"
  );

  return sanitized;
}
