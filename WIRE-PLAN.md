# GapLens FE↔BE Wiring Plan

## Production Decisions

### Q1: Question Bank list endpoint
**Decision:** Build `GET /questions` on backend with filters.
**Why:** Backend only has `GET /questions/{id}`. Question bank UI needs list+filter+paginated view. No workaround is clean.
**Spec:** `GET /api/v1/questions?node_id=&difficulty=&status=&search=&limit=&offset=` → `{ items: QuestionDetail[], total: int }`

### Q2: Student ID source
**Decision:** `studentId = authUser.id` from `GET /auth/me`. Store in AuthContext.
**Why:** Backend routes use `student_id` as path param. `fetchMe()` returns the user record. No separate student profile table exists in contract. Teacher role has no `studentId`.
**Implementation:** `AuthContext` provides `{ user, studentId }` where `studentId = user.role === 'student' ? user.id : null`.

### Q3: Dashboard query strategy
**Decision:** Split into individual hooks per endpoint. Use composite `GET /agents/dashboard-insights` only for the AI summary card.
**Why:**
- Individual hooks → partial loading (priority queue loads fast, gap radar loads slow — don't block both)
- Better cache granularity (refetch priority queue without invalidating gap radar)
- Each endpoint maps 1:1 to a UI component → clean data flow
- Composite endpoint is AI-generated, slower, used only by AIInsightCard
- Fallback: if individual endpoint fails, other sections still render

### Q4: Difficulty encoding
**Decision:** Add adapter layer. FE keeps `'Easy'|'Medium'|'Hard'` strings for UI. API layer converts to/from `1|2|3` integers.
**Why:** FE components render difficulty badges with string labels. Backend stores `smallint 1|2|3`. Adapter at API boundary keeps both sides clean.

### Q5: Create Test flow
**Decision:** Wire to `POST /tests` (auto-compose from bank) + `POST /tests/{id}/assign`. Skip AI generation for MVP.
**Why:** `POST /tests` with `auto_compose` pulls questions from bank by node+difficulty. AI generation endpoint doesn't exist. Upload→OCR pipeline is separate (Section 6).
**Flow:** Teacher picks class + nodes + count → `POST /tests` → `POST /tests/{id}/assign`.

---

## Phase 1: Student Hub (already ~80% done)

### 1.1 Auth context studentId
- `frontend/src/modules/auth/AuthContext.tsx` — expose `studentId: string | null`
- `frontend/src/modules/auth/types.ts` — ensure `AuthUser` has `id`, `role`
- All student-facing hooks use `useAuth().studentId`

### 1.2 Verify existing hooks use real studentId
- `useStudentTests` — already calls `fetchStudentTests(studentId)` ✅
- `useStudentResults` — already calls `fetchStudentResults(studentId)` ✅
- `useMyKnowledgeState` — already calls `fetchMyKnowledgeState(studentId)` ✅
- `useLearningPathProgress` — verify it calls `fetchMyLearningPath(studentId)`

### 1.3 Wire RevisionCta action
- `RevisionCta.tsx` — on click, call `generateRevisionTest(studentId, nodeId)` → navigate to `/assessment/:id`

### 1.4 Wire ScoreTrendChart
- `ScoreTrendChart` receives `history` from `useStudentResults` — verify shape matches `StudentResultHistoryItem[]`

**Files to touch:**
- `frontend/src/modules/auth/AuthContext.tsx`
- `frontend/src/modules/auth/types.ts`
- `frontend/src/modules/learningPath/hooks/useLearningPathProgress.ts`
- `frontend/src/modules/revision/components/RevisionCta.tsx`
- `frontend/src/pages/StudentHub.tsx`

---

## Phase 2: Question Bank CRUD

### 2.1 Backend: Add `GET /questions` list endpoint
- `backend/app/api/v1/content.py` — add `GET /questions` with query params
- `backend/app/schemas/content.py` — add `QuestionListResponse`
- Support filters: `node_id`, `difficulty`, `status`, `search` (text LIKE), `limit`, `offset`

### 2.2 Frontend: Replace mock with real calls
- `questionBankApi.ts`:
  - `fetchQuestionBank()` → `http.get('/questions')`
  - `fetchQuestionBankItem(id)` → `http.get('/questions/{id}')`
  - `createQuestionBankItem()` → `http.post('/content/uploads', formData)` then approve
  - `updateQuestionBankItem()` → `http.patch('/questions/{id}', body)`

### 2.3 Frontend: Align types
- `questionBank/types.ts`:
  - `QuestionBankDifficulty` stays `'easy'|'medium'|'hard'` (FE strings)
  - Add `toBackendDifficulty(d): 1|2|3` and `fromBackendDifficulty(n): QuestionBankDifficulty` adapters
- `questionBank/constants.ts`:
  - Replace biology nodes with Vietnamese curriculum nodes from `docs/curriculum_nodes.json`
  - Or: fetch nodes from backend if/when node-catalog endpoint exists

### 2.4 Wire hooks
- `useGetQuestionBank.ts` — already uses `useQuery`, just verify `queryFn` points to new API
- `useMutateCreateQuestion.ts` — verify mutation calls new API
- `useMutateUpdateQuestion.ts` — verify mutation calls new API

**Files to touch:**
- `backend/app/api/v1/content.py` (new endpoint)
- `backend/app/schemas/content.py` (new response model)
- `frontend/src/modules/question-bank/services/questionBankApi.ts`
- `frontend/src/modules/question-bank/types.ts`
- `frontend/src/modules/question-bank/constants.ts`

---

## Phase 3: Teacher Dashboard

### 3.1 Create individual hooks
New files in `frontend/src/modules/dashboard/hooks/queries/`:
- `usePriorityQueue.ts` → `GET /teacher/classes/{classId}/priority-queue`
- `useGapRadar.ts` → `GET /teacher/classes/{classId}/gap-radar`
- `useGroups.ts` → `GET /teacher/classes/{classId}/groups`
- `useInterventions.ts` → `GET /teacher/classes/{classId}/interventions`
- `useClassProgress.ts` → `GET /teacher/classes/{classId}/progress-timeline`
- `useClassResults.ts` → `GET /teacher/classes/{classId}/results`
- `useStudentResultsTeacher.ts` → `GET /teacher/students/{studentId}/results`

### 3.2 Create API functions
- `dashboardApi.ts` — add real API functions alongside existing mocks:
  - `fetchPriorityQueue(classId)` → `http.get('/teacher/classes/{classId}/priority-queue')`
  - `fetchGapRadar(classId)` → `http.get('/teacher/classes/{classId}/gap-radar')`
  - `fetchGroups(classId)` → `http.get('/teacher/classes/{classId}/groups')`
  - `fetchInterventions(classId)` → `http.get('/teacher/classes/{classId}/interventions')`
  - `applyIntervention(id, note?)` → `http.post('/teacher/interventions/{id}/apply', { note })`
  - `fetchClassProgressTimeline(classId)` → `http.get('/teacher/classes/{classId}/progress-timeline')`
  - `fetchClassResults(classId, testId)` → `http.get('/teacher/classes/{classId}/results', { test_id })`
  - `fetchStudentResultsTeacher(studentId)` → `http.get('/teacher/students/{studentId}/results')`
  - Keep `fetchTeacherOverview()` as composite for backward compat

### 3.3 Align types
- `dashboard/types.ts` — add backend response types:
  - `PriorityQueueItem` (studentId, fullName, urgency: float, reason, weakNodeIds)
  - `GapRadarItem` (nodeId, nodeName, weakRatio, avgMastery)
  - `GroupItem` (groupId, nodeIds, nodeNames, studentIds)
  - `InterventionItem` (id, type, nodeId, targetStudentIds, rationale, status)
  - `ClassProgressPoint` (period, avgMastery, testsCompleted, studentsImproved)
- Keep existing FE types as UI-facing, add adapter functions

### 3.4 Refactor TeacherDashboard.tsx
- Replace single `useGetTeacherOverview()` with parallel hooks:
  ```
  const classId = selectedClassId;
  const priorityQueue = usePriorityQueue(classId);
  const gapRadar = useGapRadar(classId);
  const groups = useGroups(classId);
  const interventions = useInterventions(classId);
  ```
- Each section renders independently with its own loading state

### 3.5 Wire components
- `PriorityAlerts.tsx` — map `PriorityQueueItem` → `PriorityAlertStudent` (urgency float → severity enum)
- `ClassKnowledgeGaps.tsx` — map `GapRadarItem[]` → display
- `PerformanceChart.tsx` — wire to `useClassProgress`
- `AIInsightCard.tsx` — wire to `GET /agents/dashboard-insights`
- `StudentInsights.tsx` — wire to `GET /teacher/students/{id}/results`

**Files to touch:**
- `frontend/src/modules/dashboard/services/dashboardApi.ts`
- `frontend/src/modules/dashboard/types.ts`
- `frontend/src/modules/dashboard/hooks/queries/*.ts` (7 new files)
- `frontend/src/pages/TeacherDashboard.tsx`
- `frontend/src/modules/dashboard/components/PriorityAlerts.tsx`
- `frontend/src/modules/dashboard/components/ClassKnowledgeGaps.tsx`
- `frontend/src/modules/dashboard/components/PerformanceChart.tsx`
- `frontend/src/modules/dashboard/components/AIInsightCard.tsx`
- `frontend/src/pages/StudentInsights.tsx`

---

## Phase 4: Create Test + Upload Pipeline

### 4.1 Wire test creation
- `assessmentApi.ts` — replace `publishAssessment` mock:
  - `publishAssessment(draftId, classId, title, type)` → `POST /tests` with `auto_compose`
  - `assignTest(testId, classId)` → `POST /tests/{test_id}/assign`
- `CreateTest.tsx` — wire class selector to real `fetchClasses()`, remove mock grade filter

### 4.2 Upload → OCR pipeline
- New: `frontend/src/modules/upload/services/uploadApi.ts`
  - `uploadFile(file)` → `POST /content/uploads` (FormData)
  - `getUploadStatus(uploadId)` → `GET /content/uploads/{id}` (poll)
  - `approveUploads(uploadId, questions[])` → `POST /content/uploads/{id}/approve`
- `QuestionFileImportCard.tsx` — wire file upload → poll status → display parsed questions → approve

### 4.3 Bubble sheet OCR
- New: `frontend/src/modules/ocr/services/ocrApi.ts`
  - `scanBubbleSheet(file)` → `POST /ocr/scan`
  - `getScanResult(scanId)` → `GET /ocr/scan/{id}` (poll)
  - `confirmScan(scanId, studentId, answers[])` → `POST /ocr/scan/{id}/confirm`

**Files to touch:**
- `frontend/src/modules/assessment/services/assessmentApi.ts`
- `frontend/src/pages/CreateTest.tsx`
- New: `frontend/src/modules/upload/services/uploadApi.ts`
- New: `frontend/src/modules/ocr/services/ocrApi.ts`
- `frontend/src/modules/assessment/components/QuestionFileImportCard.tsx`

---

## Phase 5: Student Insights + Assign

### 5.1 Wire student insights
- `useGetStudentInsight.ts` → `GET /agents/dashboard-insights` (AI composite)
- `useMutateAiUpdateStudentPath.ts` → `POST /agents/learning-path`
- `PathEditorPanel.tsx` — adapt to `LearningPathResponse` tiers (nodeIds not steps)
- `StudentInsights.tsx` — wire to real endpoints

### 5.2 Wire test assign
- `testsApi.ts` — add `assignTest(testId, classId, studentIds?)` → `POST /tests/{id}/assign`
- `TestEdit.tsx` or new dialog — wire assign button

**Files to touch:**
- `frontend/src/modules/dashboard/hooks/queries/useGetStudentInsight.ts`
- `frontend/src/modules/dashboard/hooks/queries/useMutateAiUpdateStudentPath.ts`
- `frontend/src/modules/dashboard/components/PathEditorPanel.tsx`
- `frontend/src/pages/StudentInsights.tsx`
- `frontend/src/modules/tests/services/testsApi.ts`
- `frontend/src/pages/TestEdit.tsx`

---

## Execution Timeline

| Day | Phase | Hours | Deliverable |
|-----|-------|-------|-------------|
| Day 1 AM | Phase 1 | 1.5h | Student hub fully live |
| Day 1 PM | Phase 2 | 2h | Question bank CRUD live (needs BE list endpoint) |
| Day 2 AM | Phase 3 | 2.5h | Teacher dashboard fully live |
| Day 2 PM | Phase 4 | 2.5h | Create test + upload pipeline live |
| Day 3 AM | Phase 5 | 2h | Student insights + assign live |
| **Total** | | **10.5h** | **Full FE↔BE wiring** |
