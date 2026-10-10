# AI Resume Screener

A full-stack web application designed for recruiter workflows to screen and rank candidate resumes with a deterministic, explainable scoring engine.

## Key Features

1. **Deterministic Scoring Engine & Explainable Evidence Extraction**:
   - The LLM only evaluates individual rubric items (scores 0, 0.25, 0.5, 0.75, 1) and extracts verbatim quotes from the resume.
   - All component scores and totals are computed with pure deterministic math:
     $$\text{Component} = \frac{\sum \text{Item Scores}}{N} \times 100$$
     $$\text{Total Score} = \sum (\text{Component} \times \text{Weight})$$
   - Default weights: Skills 30%, Experience 25%, Education 10%, Preferred Skills 15%, Projects 20% (editable with sum validation to 100%).
   - Excel-style competition rank (`RANK.EQ`): descending total score; ties share the same rank.

2. **Public Application Portal (`/apply/[jobId]`)**:
   - Secure applicant submission form: Full Name, Email, Resume Upload (PDF, DOCX, TXT max 5 MB), Consent Checkbox.
   - Confirmation screen with unique candidate reference code (e.g., `J1-C1`).
   - Applicants never see scores or rankings.

3. **Recruiter Jobs Dashboard (`/dashboard/jobs`)**:
   - List and manage jobs with applicant counts.
   - "Create Job" modal with AI Rubric Generator (`generate-rubric`) or one-click Job 1 template loader.
   - "Reset Benchmark Data" button to instantly restore the 5 acceptance test candidates.

4. **Recruiter Results Dashboard (`/dashboard/jobs/[id]`)**:
   - Mandatory human review banner: *"Scores support human review and are not final hiring decisions."*
   - Table columns in exact required order:
     `Candidate ID | Candidate Name | Skills Match | Experience Match | Education Match | Preferred Skills | Projects Match | Total Score | Rank | Explanation | Missing Skills`
   - Sorted by `Rank` ascending.
   - Weights Editor: live sum validator with instant deterministic recalculation without LLM re-calls.
   - "Screen new resumes" button with candidate caching.
   - Clean CSV and XLSX export that imports seamlessly into Google Sheets.
   - Candidate Detail Drawer with per-item scores, verbatim evidence quotes, full explanation, and a "Delete candidate data" button (GDPR/privacy compliant).

---

## Acceptance Test Verification

The scoring engine has been verified with the 5 acceptance fixture candidates:

| Candidate | Skills | Experience | Education | Preferred | Projects | Total Score | Rank |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Aarav Mehta** | 84.4% | 100.0% | 100.0% | 100.0% | 75.0% | **90.3** | **1** |
| **Priya Raman** | 75.0% | 66.7% | 100.0% | 16.7% | 50.0% | **61.7** | **2** |
| **Karthik Subramanian** | 56.3% | 50.0% | 100.0% | 0.0% | 50.0% | **49.4** | **3** |
| **Sneha Kulkarni** | 18.8% | 8.3% | 100.0% | 8.3% | 16.7% | **22.3** | **4** |
| **Rohit Verma** (Keyword Stuffer) | 12.5% | 0.0% | 25.0% | 25.0% | 0.0% | **10.0** | **5** |

Run the unit test suite:
```bash
npm run test:math
```

---

## Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Set your Gemini API key in `.env`:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```
*(Note: If no API key is set, the app includes a fallback evidence heuristic matcher so the UI and testing operate seamlessly out-of-the-box).*

### 3. Initialize & Seed Database
```bash
npx prisma db push
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the recruiter dashboard or [http://localhost:3000/apply/1](http://localhost:3000/apply/1) for the candidate submission portal.
