import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import {
  DEFAULT_WEIGHTS,
  JOB_1_RUBRIC,
  RubricScaleValue,
  CandidateItemScores,
} from "../src/types/rubric";
import {
  computeCandidateScores,
  assignExcelRanks,
  generateExplanation,
} from "../src/lib/scoring";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

interface SampleCandidateData {
  candidateNumber: number;
  name: string;
  email: string;
  resumeFileName: string;
  resumeText: string;
  scores: {
    skills: RubricScaleValue[];
    experience: RubricScaleValue[];
    education: RubricScaleValue[];
    preferred: RubricScaleValue[];
    projects: RubricScaleValue[];
  };
  quotes: Record<string, string | null>;
}

const sampleCandidates: SampleCandidateData[] = [
  {
    candidateNumber: 1,
    name: "Aarav Mehta",
    email: "applicant@example.com", // Linked to default demo applicant user
    resumeFileName: "aarav_mehta_resume.txt",
    scores: {
      skills: [1, 1, 1, 0.5, 1, 1, 1, 0.25],
      experience: [1, 1, 1],
      education: [1],
      preferred: [1, 1, 1],
      projects: [1, 1, 0.25],
    },
    quotes: {
      SK1: "Engineered high-throughput ML pipelines in Python using NumPy, Pandas, and PyTorch.",
      SK2: "Optimized complex SQL analytical queries reducing query execution latency by 45%.",
      SK3: "Trained and tuned XGBoost and Random Forest models achieving 94% classification precision.",
      SK4: "Applied probability and multivariable calculus in stochastic loss functions.",
      SK5: "Designed and maintained asynchronous REST APIs using FastAPI with Redis caching.",
      SK6: "Containerized 10+ microservices using Docker and orchestrated via Docker Compose.",
      SK7: "Automated model deployments to AWS ECS and SageMaker with auto-scaling.",
      SK8: "Proficient in Git version control.",
      EX1: "4+ years of professional hands-on Machine Learning Engineering experience.",
      EX2: "Independently architected and deployed 4 real-time models to production serving 2M daily requests.",
      EX3: "Established MLOps infrastructure featuring automated retraining, drift monitoring, and CI/CD.",
      ED1: "B.Tech in Computer Science and Engineering from National Institute of Technology.",
      PR1: "Implemented Transformer-based LLM architectures and CNN image classifiers.",
      PR2: "Integrated MLflow and Weights & Biases for experiment tracking and metric visualization.",
      PR3: "Built Apache Spark ETL workflows and designed multi-variant A/B tests.",
      PJ1: "Developed end-to-end customer churn prediction pipeline with feature store and SHAP explainability.",
      PJ2: "Cloud-hosted containerized API serving real-time model inferences.",
      PJ3: "Prototyped enterprise knowledge-retrieval RAG chatbot with ChromaDB vector store.",
    },
    resumeText: `AARAV MEHTA
applicant@example.com | +1 555-019-2834 | San Francisco, CA

PROFESSIONAL SUMMARY
Senior Machine Learning Engineer with 4+ years of hands-on experience building, training, and deploying scalable ML systems and MLOps pipelines in cloud environments.

EXPERIENCE
Senior Machine Learning Engineer | DataCore Systems (2022 - Present)
- Architected and deployed 4 real-time predictive models to AWS production serving 2M+ daily requests.
- Engineered high-throughput ML pipelines in Python using NumPy, Pandas, scikit-learn, and PyTorch.
- Optimized complex SQL analytical queries reducing query execution latency by 45%.
- Implemented MLOps infrastructure featuring automated retraining, data drift monitoring, and latency reduction under 25ms.
- Built asynchronous REST APIs using FastAPI and containerized microservices using Docker.
- Integrated MLflow and Weights & Biases for experiment tracking and hyperparameter tuning.

Machine Learning Engineer | Apex Analytics (2020 - 2022)
- Trained core ML algorithms (XGBoost, Random Forest, K-Means clustering) for risk scoring with 94% precision.
- Built Apache Spark ETL workflows and designed multi-variant A/B tests for recommendation ranking.
- Implemented Transformer-based NLP pipelines for automated document classification.

EDUCATION
B.Tech in Computer Science and Engineering | National Institute of Technology (2016 - 2020)

PROJECTS
- End-to-End Customer Churn Prediction: Feature engineering, robust cross-validation, and SHAP explainability deployed as a containerized cloud API.
- Enterprise RAG Knowledge Assistant: Integrated LangChain, FastAPI, and ChromaDB vector database.
`,
  },
  {
    candidateNumber: 2,
    name: "Priya Raman",
    email: "priya@example.com",
    resumeFileName: "priya_raman_resume.txt",
    scores: {
      skills: [1, 1, 1, 0.5, 1, 0, 1, 0.5],
      experience: [1, 0.5, 0.5],
      education: [1],
      preferred: [0.5, 0, 0],
      projects: [1, 0.5, 0],
    },
    quotes: {
      SK1: "Built predictive models in Python utilizing Pandas, scikit-learn, and Statsmodels.",
      SK2: "Wrote daily SQL extraction pipelines across relational PostgreSQL databases.",
      SK3: "Developed regression and decision tree classification models for user retention.",
      SK4: "Coursework in linear algebra, multivariable calculus, and applied statistics.",
      SK5: "Developed lightweight Flask and FastAPI endpoints for internal model consumption.",
      SK6: null,
      SK7: "Provisioned AWS EC2 and S3 instances for batch model inference workloads.",
      SK8: "Collaborated on shared repositories using Git branching workflows.",
      EX1: "3.5 years of industry experience as a Data Scientist and ML Developer.",
      EX2: "Assisted senior engineers in model staging and production rollout.",
      EX3: "Maintained data preprocessing pipelines and basic model evaluation tracking.",
      ED1: "B.S. in Data Science and Statistics.",
      PR1: "Experimented with basic CNN image classification models during university research.",
      PR2: null,
      PR3: null,
      PJ1: "End-to-end housing price regression model with outlier filtering and hyperparameter tuning.",
      PJ2: "Cloud-hosted web API prototype on AWS.",
      PJ3: null,
    },
    resumeText: `PRIYA RAMAN
priya@example.com | Seattle, WA

EXPERIENCE
Machine Learning Developer | Horizon Software (2021 - Present)
- 3.5 years of experience building predictive models in Python utilizing Pandas, scikit-learn, and NumPy.
- Wrote daily SQL extraction pipelines across PostgreSQL databases for feature engineering.
- Developed regression and decision tree models for customer churn and lifetime value estimation.
- Built Flask and FastAPI endpoints for internal analytics tools.
- Provisioned AWS EC2 and S3 instances for batch inference workloads.
- Collaborated with engineering teams using Git version control.

EDUCATION
B.S. in Data Science and Statistics | University of Washington (2017 - 2021)
- Rigorous foundation in linear algebra, multivariable calculus, probability, and statistics.

PROJECTS
- Housing Price Prediction Model: Full feature engineering, cross-validation, and production-ready regression pipeline.
- Lightweight Prediction API: Deployed simple Flask server on AWS EC2.
`,
  },
  {
    candidateNumber: 3,
    name: "Karthik Subramanian",
    email: "karthik.s@example.com",
    resumeFileName: "karthik_subramanian_resume.txt",
    scores: {
      skills: [0.5, 0.5, 0.5, 0, 1, 1, 1, 0],
      experience: [0.5, 0.5, 0.5],
      education: [1],
      preferred: [0, 0, 0],
      projects: [0.5, 1, 0],
    },
    quotes: {
      SK1: "Used Python scripts for backend automation and basic scikit-learn clustering.",
      SK2: "Wrote standard SQL queries for backend database migrations.",
      SK3: "Implemented basic K-Means clustering algorithm for user segmentation.",
      SK4: null,
      SK5: "2 years building high-performance REST APIs in Python using FastAPI.",
      SK6: "Extensive Docker containerization experience with multi-stage builds.",
      SK7: "Managed GCP Cloud Run and Compute Engine deployments.",
      SK8: null,
      EX1: "2 years of software engineering experience with recent transition into ML.",
      EX2: "Deployed backend microservices and containerized ML services to production.",
      EX3: "Built scalable data ingestion pipelines and latency-monitored APIs.",
      ED1: "B.S. in Computer Science.",
      PR1: null,
      PR2: null,
      PR3: null,
      PJ1: "Customer segmentation clustering script with data preprocessing.",
      PJ2: "Containerized cloud-hosted web application with FastAPI endpoints deployed on GCP.",
      PJ3: null,
    },
    resumeText: `KARTHIK SUBRAMANIAN
karthik.s@example.com | Austin, TX

SUMMARY
Software Engineer with 2 years of experience building high-throughput APIs, containerized architectures, and cloud services on GCP, expanding into Machine Learning.

EXPERIENCE
Backend & Cloud Engineer | CloudStream Tech (2022 - Present)
- Developed and deployed high-performance REST APIs using FastAPI and Python.
- Containerized applications with Docker; managed GCP Cloud Run deployments.
- Implemented basic scikit-learn K-Means clustering for customer segmentation.
- Engineered automated data ingestion pipelines processing 500k daily records.

EDUCATION
B.S. in Computer Science | Texas A&M University (2018 - 2022)

PROJECTS
- Containerized Cloud API Service: Multi-stage Docker build deployed on GCP Cloud Run with automated CI/CD.
- User Segmentation Tool: Applied K-Means clustering to behavioral dataset.
`,
  },
  {
    candidateNumber: 4,
    name: "Sneha Kulkarni",
    email: "sneha.k@example.com",
    resumeFileName: "sneha_kulkarni_resume.txt",
    scores: {
      skills: [0.5, 0.5, 0.5, 0, 0, 0, 0, 0],
      experience: [0.25, 0, 0],
      education: [1],
      preferred: [0.25, 0, 0],
      projects: [0.5, 0, 0],
    },
    quotes: {
      SK1: "Python programming completed in academic coursework and data analysis labs.",
      SK2: "Wrote SQL queries during 4-month data analyst internship.",
      SK3: "Implemented linear regression in university academic assignments.",
      SK4: null,
      SK5: null,
      SK6: null,
      SK7: null,
      SK8: null,
      EX1: "4-month internship experience as a Junior Data Analyst.",
      EX2: null,
      EX3: null,
      ED1: "B.S. in Mathematics and Statistics, graduating top 10% of class.",
      PR1: "Mentioned interest in Deep Learning and completed an online course certificate.",
      PR2: null,
      PR3: null,
      PJ1: "Academic project: Linear regression analysis on student performance dataset.",
      PJ2: null,
      PJ3: null,
    },
    resumeText: `SNEHA KULKARNI
sneha.k@example.com | Boston, MA

EDUCATION
B.S. in Mathematics & Statistics | Boston University (2020 - 2024)
- Core courses: Probability Theory, Statistical Inference, Mathematical Modeling.

EXPERIENCE
Data Analyst Intern | Beacon Financial (Summer 2023, 4 months)
- Queried financial datasets using SQL for executive dashboards.
- Assisted with Python scripts for data cleaning and metric summaries.
- Modeled regression trends for departmental performance reviews.

PROJECTS & INTERESTS
- Academic Student Performance Predictor: Built linear regression model in Python using scikit-learn.
- Completed Coursera deep learning introduction course.
`,
  },
  {
    candidateNumber: 5,
    name: "Rohit Verma",
    email: "rohit.verma@example.com",
    resumeFileName: "rohit_verma_resume.txt",
    scores: {
      skills: [0.25, 0.25, 0, 0, 0, 0.25, 0.25, 0],
      experience: [0, 0, 0],
      education: [0.25],
      preferred: [0.25, 0.25, 0.25],
      projects: [0, 0, 0],
    },
    quotes: {
      SK1: "Listed in skills section: Python, NumPy, Pandas, PyTorch.",
      SK2: "Listed in skills section: SQL, MySQL.",
      SK3: null,
      SK4: null,
      SK5: null,
      SK6: "Listed in skills section: Docker.",
      SK7: "Listed in skills section: AWS Cloud.",
      SK8: null,
      EX1: null,
      EX2: null,
      EX3: null,
      ED1: "Non-technical Bachelor of Commerce with online certificates in AI.",
      PR1: "Listed in skills section: Deep Learning, CNN, Transformers.",
      PR2: "Listed in skills section: MLflow, Weights & Biases.",
      PR3: "Listed in skills section: Spark, Airflow.",
      PJ1: null,
      PJ2: null,
      PJ3: null,
    },
    resumeText: `ROHIT VERMA
rohit.verma@example.com | Chicago, IL

SKILLS
Python, NumPy, Pandas, scikit-learn, PyTorch, TensorFlow, SQL, MySQL, PostgreSQL, Docker, Kubernetes, AWS Cloud, GCP, Git, Deep Learning, CNN, Transformers, LLMs, MLflow, Weights & Biases, Apache Spark, Airflow, FastAPI, React, Node.js

EXPERIENCE
Customer Operations Specialist | RetailNet Inc. (2022 - 2024)
- Managed customer inquiry tickets and CRM data entry.
- Handled billing resolutions and customer support calls.
- Documented customer feedback and reported weekly resolution metrics.

EDUCATION & CERTIFICATIONS
Bachelor of Commerce | Midwest College (2018 - 2022)
- Online Certificate in Artificial Intelligence Foundations
`,
  },
];

async function main() {
  console.log("Seeding database with roles and users...");

  // 1. Ensure storage directory exists
  const storageDir = path.join(process.cwd(), "storage", "resumes");
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  // 2. Clean up existing records
  await prisma.evaluation.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.user.deleteMany({});

  // 3. Create Seed Users
  const recruiterUser = await prisma.user.create({
    data: {
      name: "Sarah Jenkins (Recruiter)",
      email: "recruiter@company.com",
      passwordHash: hashPassword("recruiter123"),
      role: "RECRUITER",
    },
  });
  console.log(`Created Recruiter: ${recruiterUser.email} (password: recruiter123)`);

  const applicantUser = await prisma.user.create({
    data: {
      name: "Aarav Mehta",
      email: "applicant@example.com",
      passwordHash: hashPassword("applicant123"),
      role: "APPLICANT",
    },
  });
  console.log(`Created Applicant: ${applicantUser.email} (password: applicant123)`);

  const applicantUser2 = await prisma.user.create({
    data: {
      name: "Priya Raman",
      email: "priya@example.com",
      passwordHash: hashPassword("applicant123"),
      role: "APPLICANT",
    },
  });

  // 4. Create Job 1: Machine Learning Engineer
  const job1 = await prisma.job.create({
    data: {
      id: 1,
      title: "Machine Learning Engineer",
      description:
        "We are looking for a Machine Learning Engineer to design, deploy, and scale production ML models and MLOps pipelines. Requires strong Python, SQL, core ML algorithms, Docker, cloud deployment, and API development.",
      rubric: JSON.stringify(JOB_1_RUBRIC),
      weights: JSON.stringify(DEFAULT_WEIGHTS),
    },
  });

  console.log(`Created Job ${job1.id}: ${job1.title}`);

  // 5. Create candidates and write resume files
  const candidatesCreated: Array<{
    id: string;
    candidateNumber: number;
    name: string;
    itemScores: CandidateItemScores;
    computed: ReturnType<typeof computeCandidateScores>;
    explanation: string;
  }> = [];

  for (const sample of sampleCandidates) {
    const resumePath = path.join(storageDir, sample.resumeFileName);
    fs.writeFileSync(resumePath, sample.resumeText, "utf-8");

    // Link userId if matches seed user
    let linkedUserId: string | null = null;
    if (sample.email === "applicant@example.com") linkedUserId = applicantUser.id;
    if (sample.email === "priya@example.com") linkedUserId = applicantUser2.id;

    const candidate = await prisma.candidate.create({
      data: {
        jobId: job1.id,
        candidateNumber: sample.candidateNumber,
        userId: linkedUserId,
        name: sample.name,
        email: sample.email,
        consentGiven: true,
        resumeFileName: sample.resumeFileName,
        resumeFilePath: resumePath,
        resumeText: sample.resumeText,
      },
    });

    const itemScores: CandidateItemScores = {};
    JOB_1_RUBRIC.skills.forEach((item, i) => {
      itemScores[item.id] = {
        score: sample.scores.skills[i],
        quote: sample.quotes[item.id] ?? null,
      };
    });
    JOB_1_RUBRIC.experience.forEach((item, i) => {
      itemScores[item.id] = {
        score: sample.scores.experience[i],
        quote: sample.quotes[item.id] ?? null,
      };
    });
    JOB_1_RUBRIC.education.forEach((item, i) => {
      itemScores[item.id] = {
        score: sample.scores.education[i],
        quote: sample.quotes[item.id] ?? null,
      };
    });
    JOB_1_RUBRIC.preferred.forEach((item, i) => {
      itemScores[item.id] = {
        score: sample.scores.preferred[i],
        quote: sample.quotes[item.id] ?? null,
      };
    });
    JOB_1_RUBRIC.projects.forEach((item, i) => {
      itemScores[item.id] = {
        score: sample.scores.projects[i],
        quote: sample.quotes[item.id] ?? null,
      };
    });

    const computed = computeCandidateScores(
      JOB_1_RUBRIC,
      itemScores,
      DEFAULT_WEIGHTS
    );

    const explanation = generateExplanation(
      sample.name,
      JOB_1_RUBRIC,
      itemScores,
      computed
    );

    candidatesCreated.push({
      id: candidate.id,
      candidateNumber: sample.candidateNumber,
      name: sample.name,
      itemScores,
      computed,
      explanation,
    });
  }

  // 6. Assign Excel-style ranks
  const rankedCandidates = assignExcelRanks(
    candidatesCreated.map((c) => ({
      ...c,
      totalScore: c.computed.totalScore,
    }))
  );

  // 7. Create Evaluation records
  for (const rc of rankedCandidates) {
    await prisma.evaluation.create({
      data: {
        candidateId: rc.id,
        itemScores: JSON.stringify(rc.itemScores),
        skillsMatch: rc.computed.skillsMatch,
        experienceMatch: rc.computed.experienceMatch,
        educationMatch: rc.computed.educationMatch,
        preferredMatch: rc.computed.preferredMatch,
        projectsMatch: rc.computed.projectsMatch,
        totalScore: rc.computed.totalScore,
        rank: rc.rank,
        explanation: rc.explanation,
        missingSkills: rc.computed.missingSkills,
        status: "COMPLETED",
      },
    });

    console.log(
      `Candidate J1-C${rc.candidateNumber} (${rc.name}): Total ${rc.computed.totalScore.toFixed(1)}, Rank ${rc.rank}`
    );
  }

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
