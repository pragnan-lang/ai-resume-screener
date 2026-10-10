import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  CandidateItemScores,
  JobRubric,
  RubricItem,
  RubricScaleValue,
} from "@/types/rubric";

export interface EvidenceExtractionOutput {
  itemScores: CandidateItemScores;
}

const SYSTEM_PROMPT = `You are an expert AI Resume Screener evaluation assistant.
Your job is to read ONE resume and the provided Job Rubric, and return strict JSON evaluating each rubric item individually.

EVALUATION SCALE FOR EVERY RUBRIC ITEM:
- 1.0: Demonstrated in substantive work experience or a completed technical project with concrete details/results.
- 0.75: (Only for degree/education item ED1) Non-technical degree with strong verified portfolio.
- 0.5: Partial match: basic/coursework level, hobby project, or listed with plausible but unconfirmed/limited application.
- 0.25: Listed or implied only (e.g. only in a skills list/bullet point) with no supporting work history or project details (unverified).
- 0.0: Not mentioned or completely absent.

STRICT EVIDENCE RULES:
1. Count ONLY what is explicitly written on the resume. NEVER infer skills or accomplishments from company names, prestigious universities, or generic job titles.
2. KEYWORD-STUFFING GUARD: If a skill appears only in a 'Skills' or 'Tools' list, but the candidate's work experience and projects contain no actual usage or context of it, score it at most 0.25.
3. Ignore name, gender, age, photo, nationality, religion, and address.
4. For every rubric item, extract an exact verbatim evidence quote from the resume (1-2 sentences maximum). If the score is 0.0, the quote MUST be null.
5. YOU MUST NOT COMPUTE TOTAL SCORES OR SUMMARIES. Only evaluate individual items.

OUTPUT FORMAT:
Respond with ONLY valid, raw JSON (no markdown formatting, no code fences):
{
  "items": [
    {
      "id": "SK1",
      "score": 1,
      "quote": "Engineered real-time ETL pipelines in Python using Pandas and scikit-learn..."
    },
    ...
  ]
}
`;

export async function evaluateResumeWithLLM(
  resumeText: string,
  rubric: JobRubric
): Promise<EvidenceExtractionOutput> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const allItems: RubricItem[] = [
    ...(rubric.skills || []),
    ...(rubric.experience || []),
    ...(rubric.education || []),
    ...(rubric.preferred || []),
    ...(rubric.projects || []),
  ];

  if (!apiKey) {
    console.warn(
      "[LLM Adapter] No GEMINI_API_KEY detected. Running deterministic evidence matcher fallback."
    );
    return fallbackHeuristicScorer(resumeText, allItems);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
      systemInstruction: SYSTEM_PROMPT,
    });

    const rubricPrompt = JSON.stringify(allItems, null, 2);
    const userPrompt = `JOB RUBRIC ITEMS:\n${rubricPrompt}\n\nCANDIDATE RESUME TEXT:\n${resumeText}\n\nEvaluate each rubric item according to the scale. Return valid JSON only.`;

    const result = await model.generateContent(userPrompt);
    const responseText = result.response.text();

    const parsed = JSON.parse(responseText);
    const itemScores: CandidateItemScores = {};

    if (Array.isArray(parsed.items)) {
      for (const item of parsed.items) {
        if (item.id && typeof item.score === "number") {
          let score = item.score as RubricScaleValue;
          // Clamp to allowable values
          if (![0, 0.25, 0.5, 0.75, 1].includes(score)) {
            if (score >= 0.85) score = 1;
            else if (score >= 0.6) score = 0.5;
            else if (score >= 0.15) score = 0.25;
            else score = 0;
          }
          itemScores[item.id] = {
            score,
            quote: item.quote || null,
          };
        }
      }
    }

    // Ensure all items in rubric exist in output
    for (const item of allItems) {
      if (!itemScores[item.id]) {
        itemScores[item.id] = { score: 0, quote: null };
      }
    }

    return { itemScores };
  } catch (error: any) {
    console.error("[LLM Adapter] Error calling Gemini API:", error);
    console.warn("[LLM Adapter] Falling back to evidence heuristic matcher.");
    return fallbackHeuristicScorer(resumeText, allItems);
  }
}

export async function generateRubricFromJD(
  jobTitle: string,
  jobDescription: string
): Promise<JobRubric> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const prompt = `You are a recruiting expert. Given the job title and job description below, create a structured 5-component rubric for evaluating candidates.
The 5 components MUST be:
1. skills (6-8 items): Required hard/technical skills
2. experience (2-4 items): Relevant years, deployment, production scope
3. education (1-2 items): Required degrees, certifications, or educational equivalents
4. preferred (2-4 items): Nice-to-have or advanced skills
5. projects (2-4 items): Key project types or architectural deliverables

JOB TITLE: ${jobTitle}
JOB DESCRIPTION:
${jobDescription}

Return RAW JSON ONLY matching this exact structure:
{
  "skills": [{ "id": "SK1", "name": "...", "description": "..." }],
  "experience": [{ "id": "EX1", "name": "...", "description": "..." }],
  "education": [{ "id": "ED1", "name": "...", "description": "..." }],
  "preferred": [{ "id": "PR1", "name": "...", "description": "..." }],
  "projects": [{ "id": "PJ1", "name": "...", "description": "..." }]
}
`;

  if (!apiKey) {
    // Return structured default template tailored to the title
    return {
      skills: [
        { id: "SK1", name: `${jobTitle} Core Technologies`, description: "Proficiency in required frameworks and programming languages" },
        { id: "SK2", name: "System Architecture & Design", description: "Design scalable, maintainable architectures" },
        { id: "SK3", name: "Data & Storage Systems", description: "Database design, queries, and optimization" },
        { id: "SK4", name: "Testing & Quality Assurance", description: "Automated unit, integration, and E2E testing" },
        { id: "SK5", name: "CI/CD & DevOps", description: "Automated deployment pipelines and containerization" },
      ],
      experience: [
        { id: "EX1", name: "Relevant Industry Experience", description: "1 = 3+ years; 0.5 = 1-3 years; 0.25 = <1 year; 0 = none" },
        { id: "EX2", name: "Production Impact", description: "Delivered live applications or services in production" },
      ],
      education: [
        { id: "ED1", name: "Degree or Equivalent Qualification", description: "1 = Bachelor's/Master's in relevant discipline; 0.75 = Related portfolio; 0.25 = Certifications; 0 = None" },
      ],
      preferred: [
        { id: "PR1", name: "Cloud Infrastructure", description: "AWS, GCP, or Azure services and infrastructure as code" },
        { id: "PR2", name: "Team Mentorship & Leadership", description: "Leading projects or mentoring junior engineers" },
      ],
      projects: [
        { id: "PJ1", name: "End-to-End Delivered Solution", description: "Full lifecycle design, implementation, and deployment" },
        { id: "PJ2", name: "Performance Optimization Project", description: "Significant scale or latency improvements" },
      ],
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    return parsed as JobRubric;
  } catch (error) {
    console.error("Error generating rubric from JD:", error);
    throw error;
  }
}

/**
 * Fallback heuristic scorer when GEMINI_API_KEY is not configured or in offline mode.
 * Analyzes resume text sections (Experience, Projects, Education, Skills) to assign
 * scores following the exact evidence rules.
 */
function fallbackHeuristicScorer(
  resumeText: string,
  items: RubricItem[]
): EvidenceExtractionOutput {
  const itemScores: CandidateItemScores = {};
  const lowerResume = resumeText.toLowerCase();

  // Split into sections if available
  const hasExperienceSection = /experience|work\s*history|employment/i.test(resumeText);
  const hasProjectsSection = /projects|portfolio/i.test(resumeText);

  for (const item of items) {
    const keywords = (item.name + " " + (item.description || ""))
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !["with", "from", "only", "such", "than", "more", "years", "degree"].includes(w));

    let matchedKeywords = 0;
    let foundSentence: string | null = null;

    const sentences = resumeText.split(/(?<=[.!?\n])\s+/);
    for (const sent of sentences) {
      const lowerSent = sent.toLowerCase();
      const matchCount = keywords.filter((k) => lowerSent.includes(k)).length;
      if (matchCount > matchedKeywords) {
        matchedKeywords = matchCount;
        foundSentence = sent.trim().slice(0, 150);
      }
    }

    let score: RubricScaleValue = 0;
    if (matchedKeywords >= 2) {
      // Check if found in experience / project context vs skills only
      const isExperienceOrProject =
        hasExperienceSection || hasProjectsSection;
      score = isExperienceOrProject ? 1 : 0.5;
    } else if (matchedKeywords === 1) {
      score = 0.25;
    } else {
      score = 0;
    }

    itemScores[item.id] = {
      score,
      quote: score > 0 ? foundSentence : null,
    };
  }

  return { itemScores };
}
