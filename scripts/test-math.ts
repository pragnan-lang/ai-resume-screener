import {
  JOB_1_RUBRIC,
  DEFAULT_WEIGHTS,
  CandidateItemScores,
  RubricScaleValue,
} from "../src/types/rubric";
import {
  computeCandidateScores,
  assignExcelRanks,
  validateWeights,
} from "../src/lib/scoring";

interface FixtureCandidate {
  name: string;
  scores: {
    skills: RubricScaleValue[]; // 8 items
    experience: RubricScaleValue[]; // 3 items
    education: RubricScaleValue[]; // 1 item
    preferred: RubricScaleValue[]; // 3 items
    projects: RubricScaleValue[]; // 3 items
  };
  expected: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    preferredMatch: number;
    projectsMatch: number;
    totalScore: number;
    rank: number;
  };
}

const fixtureCandidates: FixtureCandidate[] = [
  {
    name: "Aarav Mehta",
    scores: {
      skills: [1, 1, 1, 0.5, 1, 1, 1, 0.25],
      experience: [1, 1, 1],
      education: [1],
      preferred: [1, 1, 1],
      projects: [1, 1, 0.25],
    },
    expected: {
      skillsMatch: 84.4,
      experienceMatch: 100.0,
      educationMatch: 100.0,
      preferredMatch: 100.0,
      projectsMatch: 75.0,
      totalScore: 90.3,
      rank: 1,
    },
  },
  {
    name: "Priya Raman",
    scores: {
      skills: [1, 1, 1, 0.5, 1, 0, 1, 0.5],
      experience: [1, 0.5, 0.5],
      education: [1],
      preferred: [0.5, 0, 0],
      projects: [1, 0.5, 0],
    },
    expected: {
      skillsMatch: 75.0,
      experienceMatch: 66.7,
      educationMatch: 100.0,
      preferredMatch: 16.7,
      projectsMatch: 50.0,
      totalScore: 61.7,
      rank: 2,
    },
  },
  {
    name: "Karthik Subramanian",
    scores: {
      skills: [0.5, 0.5, 0.5, 0, 1, 1, 1, 0],
      experience: [0.5, 0.5, 0.5],
      education: [1],
      preferred: [0, 0, 0],
      projects: [0.5, 1, 0],
    },
    expected: {
      skillsMatch: 56.3,
      experienceMatch: 50.0,
      educationMatch: 100.0,
      preferredMatch: 0.0,
      projectsMatch: 50.0,
      totalScore: 49.4,
      rank: 3,
    },
  },
  {
    name: "Sneha Kulkarni",
    scores: {
      skills: [0.5, 0.5, 0.5, 0, 0, 0, 0, 0],
      experience: [0.25, 0, 0],
      education: [1],
      preferred: [0.25, 0, 0],
      projects: [0.5, 0, 0],
    },
    expected: {
      skillsMatch: 18.8,
      experienceMatch: 8.3,
      educationMatch: 100.0,
      preferredMatch: 8.3,
      projectsMatch: 16.7,
      totalScore: 22.3,
      rank: 4,
    },
  },
  {
    name: "Rohit Verma",
    scores: {
      skills: [0.25, 0.25, 0, 0, 0, 0.25, 0.25, 0],
      experience: [0, 0, 0],
      education: [0.25],
      preferred: [0.25, 0.25, 0.25],
      projects: [0, 0, 0],
    },
    expected: {
      skillsMatch: 12.5,
      experienceMatch: 0.0,
      educationMatch: 25.0,
      preferredMatch: 25.0,
      projectsMatch: 0.0,
      totalScore: 10.0,
      rank: 5,
    },
  },
];

function buildItemScores(candidate: FixtureCandidate): CandidateItemScores {
  const itemScores: CandidateItemScores = {};

  JOB_1_RUBRIC.skills.forEach((item, i) => {
    itemScores[item.id] = { score: candidate.scores.skills[i], quote: "Mock evidence" };
  });
  JOB_1_RUBRIC.experience.forEach((item, i) => {
    itemScores[item.id] = { score: candidate.scores.experience[i], quote: "Mock evidence" };
  });
  JOB_1_RUBRIC.education.forEach((item, i) => {
    itemScores[item.id] = { score: candidate.scores.education[i], quote: "Mock evidence" };
  });
  JOB_1_RUBRIC.preferred.forEach((item, i) => {
    itemScores[item.id] = { score: candidate.scores.preferred[i], quote: "Mock evidence" };
  });
  JOB_1_RUBRIC.projects.forEach((item, i) => {
    itemScores[item.id] = { score: candidate.scores.projects[i], quote: "Mock evidence" };
  });

  return itemScores;
}

console.log("=== Testing Default Weights Validation ===");
const weightCheck = validateWeights(DEFAULT_WEIGHTS);
if (!weightCheck.isValid) {
  console.error("FAIL: Default weights do not sum to 100%!", weightCheck);
  process.exit(1);
} else {
  console.log("PASS: Weights sum to 100%");
}

console.log("\n=== Testing Scoring Math Against 5-Candidate Fixture ===");

const evaluatedList = fixtureCandidates.map((c) => {
  const itemScores = buildItemScores(c);
  const computed = computeCandidateScores(JOB_1_RUBRIC, itemScores, DEFAULT_WEIGHTS);
  return {
    candidate: c,
    computed,
    totalScore: computed.totalScore,
  };
});

const rankedList = assignExcelRanks(evaluatedList);

let allPassed = true;

for (const entry of rankedList) {
  const c = entry.candidate;
  const comp = entry.computed;
  const exp = c.expected;
  const rank = entry.rank;

  console.log(`\nChecking: ${c.name}`);
  console.log(
    `  Skills:      got ${comp.skillsMatch.toFixed(1)}, expected ${exp.skillsMatch.toFixed(1)} -> ${
      comp.skillsMatch === exp.skillsMatch ? "OK" : "MISMATCH"
    }`
  );
  console.log(
    `  Experience:  got ${comp.experienceMatch.toFixed(1)}, expected ${exp.experienceMatch.toFixed(1)} -> ${
      comp.experienceMatch === exp.experienceMatch ? "OK" : "MISMATCH"
    }`
  );
  console.log(
    `  Education:   got ${comp.educationMatch.toFixed(1)}, expected ${exp.educationMatch.toFixed(1)} -> ${
      comp.educationMatch === exp.educationMatch ? "OK" : "MISMATCH"
    }`
  );
  console.log(
    `  Preferred:   got ${comp.preferredMatch.toFixed(1)}, expected ${exp.preferredMatch.toFixed(1)} -> ${
      comp.preferredMatch === exp.preferredMatch ? "OK" : "MISMATCH"
    }`
  );
  console.log(
    `  Projects:    got ${comp.projectsMatch.toFixed(1)}, expected ${exp.projectsMatch.toFixed(1)} -> ${
      comp.projectsMatch === exp.projectsMatch ? "OK" : "MISMATCH"
    }`
  );
  console.log(
    `  Total Score: got ${comp.totalScore.toFixed(1)}, expected ${exp.totalScore.toFixed(1)} -> ${
      comp.totalScore === exp.totalScore ? "OK" : "MISMATCH"
    }`
  );
  console.log(
    `  Rank:        got ${rank}, expected ${exp.rank} -> ${
      rank === exp.rank ? "OK" : "MISMATCH"
    }`
  );

  if (
    comp.skillsMatch !== exp.skillsMatch ||
    comp.experienceMatch !== exp.experienceMatch ||
    comp.educationMatch !== exp.educationMatch ||
    comp.preferredMatch !== exp.preferredMatch ||
    comp.projectsMatch !== exp.projectsMatch ||
    comp.totalScore !== exp.totalScore ||
    rank !== exp.rank
  ) {
    allPassed = false;
  }
}

if (!allPassed) {
  console.error("\n❌ UNIT TEST FAILED: Some numbers did not match the fixture expectations!");
  process.exit(1);
} else {
  console.log("\n🎉 ALL 5 FIXTURE CANDIDATES MATCHED EXACT EXPECTED SCORES AND RANKS 100%!");
}
