export type RubricScaleValue = 0 | 0.25 | 0.5 | 0.75 | 1;

export interface RubricItem {
  id: string; // e.g. "SK1", "EX1", etc.
  name: string; // human-readable name, e.g. "Python for modeling"
  description?: string;
  scoringGuide?: string;
}

export interface RubricComponent {
  id: "skills" | "experience" | "education" | "preferred" | "projects";
  name: string; // "Skills Match", "Experience Match", etc.
  items: RubricItem[];
}

export interface JobRubric {
  skills: RubricItem[];
  experience: RubricItem[];
  education: RubricItem[];
  preferred: RubricItem[];
  projects: RubricItem[];
}

export interface ComponentWeights {
  skills: number; // default: 30
  experience: number; // default: 25
  education: number; // default: 10
  preferred: number; // default: 15
  projects: number; // default: 20
}

export interface ItemEvaluationResult {
  score: RubricScaleValue;
  quote: string | null;
}

export type CandidateItemScores = Record<string, ItemEvaluationResult>;

export interface ComputedScores {
  skillsMatch: number; // 0 - 100 with one decimal
  experienceMatch: number;
  educationMatch: number;
  preferredMatch: number;
  projectsMatch: number;
  totalScore: number;
  missingSkills: string;
}

export const DEFAULT_WEIGHTS: ComponentWeights = {
  skills: 30,
  experience: 25,
  education: 10,
  preferred: 15,
  projects: 20,
};

export const JOB_1_RUBRIC: JobRubric = {
  skills: [
    {
      id: "SK1",
      name: "Python for modeling",
      description: "NumPy, Pandas, scikit-learn, PyTorch or TensorFlow",
    },
    {
      id: "SK2",
      name: "SQL for data extraction and wrangling",
      description: "Complex queries, joins, window functions",
    },
    {
      id: "SK3",
      name: "Core ML algorithms",
      description: "Regression, decision trees, random forests, XGBoost, K-Means",
    },
    {
      id: "SK4",
      name: "Math foundation",
      description: "Linear algebra, calculus, probability and statistics",
    },
    {
      id: "SK5",
      name: "API development",
      description: "FastAPI, Flask, REST endpoints",
    },
    {
      id: "SK6",
      name: "Containerization",
      description: "Docker, Docker Compose, containerized workflows",
    },
    {
      id: "SK7",
      name: "Cloud deployment",
      description: "AWS, GCP, Azure infrastructure and services",
    },
    {
      id: "SK8",
      name: "Version control",
      description: "Git, GitHub, GitLab, version branching",
    },
  ],
  experience: [
    {
      id: "EX1",
      name: "Hands-on ML experience",
      description:
        "1 = 3+ years; 0.5 = 1-3 years or 3+ years adjacent; 0.25 = <1 year (internship); 0 = none",
    },
    {
      id: "EX2",
      name: "Production deployment",
      description: "Independently deployed models to production environments",
    },
    {
      id: "EX3",
      name: "Scale and MLOps",
      description:
        "Data pipelines, large data volumes, retraining, monitoring, latency reduction",
    },
  ],
  education: [
    {
      id: "ED1",
      name: "Degree in CS, Data Science, Math, Stats or related field",
      description:
        "1 = bachelor's or master's in CS/DS/Math/Stats; 0.75 = non-technical degree with strong portfolio; 0.25 = non-technical degree with certificates only; 0 = none",
    },
  ],
  preferred: [
    {
      id: "PR1",
      name: "Deep learning",
      description: "CNNs for vision, Transformers for NLP / GenAI",
    },
    {
      id: "PR2",
      name: "Experiment tracking",
      description: "MLflow, Weights & Biases",
    },
    {
      id: "PR3",
      name: "Advanced data tools & testing",
      description: "Spark, Airflow, A/B testing",
    },
  ],
  projects: [
    {
      id: "PJ1",
      name: "End-to-end predictive model",
      description:
        "Data cleaning, feature engineering, robust evaluation (e.g. churn or price prediction)",
    },
    {
      id: "PJ2",
      name: "Containerized cloud app with API",
      description: "Containerized, cloud-hosted web app with an API endpoint",
    },
    {
      id: "PJ3",
      name: "GenAI app",
      description: "GenAI app such as a RAG chatbot connected to a vector database",
    },
  ],
};
