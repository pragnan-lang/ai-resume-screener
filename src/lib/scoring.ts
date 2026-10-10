import {
  CandidateItemScores,
  ComponentWeights,
  ComputedScores,
  JobRubric,
  RubricItem,
} from "@/types/rubric";

export function roundToOneDecimal(num: number): number {
  return Math.round((num + Number.EPSILON) * 10) / 10;
}

export function validateWeights(weights: ComponentWeights): {
  isValid: boolean;
  sum: number;
  error?: string;
} {
  const sum =
    Number(weights.skills) +
    Number(weights.experience) +
    Number(weights.education) +
    Number(weights.preferred) +
    Number(weights.projects);

  // allow floating point small precision tolerance (e.g. 99.999999 to 100.000001)
  const isValid = Math.abs(sum - 100) < 0.001;
  return {
    isValid,
    sum: roundToOneDecimal(sum),
    error: isValid ? undefined : `Weights must sum to 100%. Current sum: ${roundToOneDecimal(sum)}%`,
  };
}

export function computeComponentAverage(
  items: RubricItem[],
  itemScores: CandidateItemScores
): { rawAverage: number; roundedAverage: number } {
  if (!items || items.length === 0) {
    return { rawAverage: 0, roundedAverage: 0 };
  }

  let totalScore = 0;
  for (const item of items) {
    const evalResult = itemScores[item.id];
    const scoreVal = evalResult ? evalResult.score : 0;
    totalScore += scoreVal;
  }

  const rawAverage = (totalScore / items.length) * 100;
  return {
    rawAverage,
    roundedAverage: roundToOneDecimal(rawAverage),
  };
}

export function computeCandidateScores(
  rubric: JobRubric,
  itemScores: CandidateItemScores,
  weights: ComponentWeights
): ComputedScores {
  const skillsComp = computeComponentAverage(rubric.skills, itemScores);
  const expComp = computeComponentAverage(rubric.experience, itemScores);
  const eduComp = computeComponentAverage(rubric.education, itemScores);
  const prefComp = computeComponentAverage(rubric.preferred, itemScores);
  const projComp = computeComponentAverage(rubric.projects, itemScores);

  // Total Score = Skills*w1 + Experience*w2 + Education*w3 + Preferred*w4 + Projects*w5
  // weights are percentages (e.g. 30 means 30%)
  const totalRaw =
    (skillsComp.rawAverage * (weights.skills / 100)) +
    (expComp.rawAverage * (weights.experience / 100)) +
    (eduComp.rawAverage * (weights.education / 100)) +
    (prefComp.rawAverage * (weights.preferred / 100)) +
    (projComp.rawAverage * (weights.projects / 100));

  const missingSkills = computeMissingSkills(rubric, itemScores);

  return {
    skillsMatch: skillsComp.roundedAverage,
    experienceMatch: expComp.roundedAverage,
    educationMatch: eduComp.roundedAverage,
    preferredMatch: prefComp.roundedAverage,
    projectsMatch: projComp.roundedAverage,
    totalScore: roundToOneDecimal(totalRaw),
    missingSkills,
  };
}

export function computeMissingSkills(
  rubric: JobRubric,
  itemScores: CandidateItemScores
): string {
  const missingItems: string[] = [];

  // Rubric items scored 0 or 0.25 (with human-readable item names)
  // Check all components (skills, experience, education, preferred, projects) or primary skills
  const allItems: RubricItem[] = [
    ...(rubric.skills || []),
    ...(rubric.preferred || []),
  ];

  for (const item of allItems) {
    const evalResult = itemScores[item.id];
    const score = evalResult ? evalResult.score : 0;

    if (score === 0) {
      missingItems.push(item.name);
    } else if (score === 0.25) {
      missingItems.push(`${item.name} (listed only)`);
    }
  }

  return missingItems.join("; ");
}

export function generateExplanation(
  candidateName: string,
  rubric: JobRubric,
  itemScores: CandidateItemScores,
  scores: ComputedScores
): string {
  // Check for strong items (score === 1.0)
  const strongItems: string[] = [];
  const gaps: string[] = [];
  const listedOnlyItems: string[] = [];

  const allItems: { item: RubricItem; category: string }[] = [
    ...rubric.skills.map((i) => ({ item: i, category: "Skills" })),
    ...rubric.experience.map((i) => ({ item: i, category: "Experience" })),
    ...rubric.education.map((i) => ({ item: i, category: "Education" })),
    ...rubric.preferred.map((i) => ({ item: i, category: "Preferred" })),
    ...rubric.projects.map((i) => ({ item: i, category: "Projects" })),
  ];

  for (const { item } of allItems) {
    const evalResult = itemScores[item.id];
    const score = evalResult ? evalResult.score : 0;

    if (score === 1) {
      strongItems.push(item.name);
    } else if (score === 0.25) {
      listedOnlyItems.push(item.name);
    } else if (score === 0) {
      gaps.push(item.name);
    }
  }

  // Sentence 1: Profile overview and overall standing
  let s1 = `${candidateName} demonstrates a Total Score of ${scores.totalScore.toFixed(1)}/100 with ${scores.skillsMatch.toFixed(1)}% skills match and ${scores.experienceMatch.toFixed(1)}% practical experience.`;

  // Sentence 2: Strongest evidence
  let s2 = "";
  if (strongItems.length > 0) {
    const topPicks = strongItems.slice(0, 3).join(", ");
    s2 = `Strongest verified capabilities include ${topPicks}, supported by substantive project and work experience.`;
  } else {
    s2 = `Candidate shows nascent background with limited direct verified evidence in primary job competencies.`;
  }

  // Sentence 3: Main gaps and keyword stuffing flag
  let s3 = "";
  const isKeywordStuffer =
    listedOnlyItems.length >= 3 && scores.experienceMatch <= 25;

  if (isKeywordStuffer) {
    s3 = `Flagged for potential keyword-stuffing: multiple skills (${listedOnlyItems.slice(0, 3).join(", ")}) are listed on the resume but lack verified production or project evidence.`;
  } else if (gaps.length > 0) {
    const gapPicks = gaps.slice(0, 3).join(", ");
    s3 = `Key gaps identified include ${gapPicks}, where no direct evidence was documented in the resume.`;
  } else {
    s3 = `Overall alignment is solid across the evaluated rubric requirements.`;
  }

  return `${s1} ${s2} ${s3}`;
}

export interface CandidateWithScore {
  candidateId: string;
  totalScore: number;
  [key: string]: any;
}

export function assignExcelRanks<T extends { totalScore: number }>(
  items: T[]
): (T & { rank: number })[] {
  // Sort descending by total score
  const sorted = [...items].sort((a, b) => b.totalScore - a.totalScore);

  let currentRank = 1;
  return sorted.map((item, index) => {
    if (index > 0) {
      const prev = sorted[index - 1];
      if (Math.abs(item.totalScore - prev.totalScore) < 0.001) {
        // Ties share the same rank (like Excel RANK)
        return {
          ...item,
          rank: currentRank,
        };
      } else {
        currentRank = index + 1;
        return {
          ...item,
          rank: currentRank,
        };
      }
    }
    return {
      ...item,
      rank: 1,
    };
  });
}
