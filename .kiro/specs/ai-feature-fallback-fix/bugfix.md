# Bugfix Requirements Document

## Introduction

The AI Coach application exposes several AI-powered features (resume parsing, interview
question generation, answer evaluation, and voice/speech analysis) that are supposed to be
served by a configured AI provider (OpenAI or Gemini, selected via `AI_PROVIDER`). In
practice, the AI service (`backend/src/services/ai.service.ts`) and speech service
(`backend/src/services/speech.service.ts`) wrap every provider call in `try/catch` blocks and,
on any failure, silently return hardcoded default data (`getDefaultResumeData`,
`getDefaultQuestions`, `getDefaultEvaluation`, `[Transcription unavailable]`, zeroed speech
metrics). Even the "success" path in `evaluateAnswer` masks missing fields with `|| 70`.

The core defect class is **silent fallback**: when the real AI call fails (invalid/disabled
key, empty text extraction, JSON parse failure, or transcription failure), the failure is
swallowed and fabricated results are stored and returned. Features therefore appear to work
while producing generic, non-differentiated, or empty output. Users cannot tell whether a
result came from the real provider or a fabricated default, and operators get no meaningful
error signal.

This bugfix makes the real provider calls succeed for valid inputs, and makes failures
**explicit and observable** rather than masked as fabricated success. Any remaining fallback
behavior must be intentional, documented, and clearly distinguishable from real
provider-generated results.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a resume with clearly present skills/experience/education/projects is uploaded AND text extraction returns empty OR the AI call throws OR the response JSON fails to parse THEN the system silently returns `getDefaultResumeData()` (all empty arrays) and stores it as if parsing succeeded.

1.2 WHEN interview questions are requested for different roles (Software Engineer, Data Analyst, UI/UX Designer, Product Manager) AND the AI call throws OR returns unparseable/empty output THEN the system silently returns `getDefaultQuestions(role)`, which produces near-identical generic questions that are not meaningfully differentiated by role.

1.3 WHEN an interview answer is evaluated AND the AI call throws OR returns unparseable output THEN the system returns `getDefaultEvaluation()` with all metrics fixed at 70, so excellent, average, and poor answers all receive identical scores.

1.4 WHEN an interview answer is evaluated AND the AI response is parsed but individual metric fields are missing/zero THEN the success path coerces them with `|| 70`, fabricating a 70 for absent scores instead of surfacing the incomplete response.

1.5 WHEN a voice interview audio file is submitted AND transcription throws THEN the system returns the literal string `[Transcription unavailable]`, and `analyzeSpeech` then returns all-zero speech metrics, both stored as if analysis succeeded.

1.6 WHEN `AI_PROVIDER`, `OPENAI_API_KEY`, or `GEMINI_API_KEY` is missing, invalid, or disabled THEN the system does not surface a meaningful configuration/authentication error and instead returns fabricated default results from the affected feature.

1.7 WHEN any AI feature falls back to default data THEN the stored/returned result contains no indicator distinguishing fabricated fallback output from genuine provider-generated output.

### Expected Behavior (Correct)

2.1 WHEN a resume with clearly present skills/experience/education/projects is uploaded AND text extraction succeeds AND the configured provider is valid THEN the system SHALL return AI-parsed structured data reflecting the actual resume content, and SHALL NOT silently return empty arrays; if extraction yields empty text, the AI call fails, or JSON parsing fails, the system SHALL surface an explicit, observable error rather than storing fabricated empty data.

2.2 WHEN interview questions are requested for a given role THEN the system SHALL return provider-generated questions that are meaningfully differentiated by role, type, and difficulty; if the AI call fails or returns unusable output, the system SHALL surface an explicit, observable error rather than silently returning generic defaults.

2.3 WHEN interview answers of differing quality (excellent, average, poor) are evaluated THEN the system SHALL return provider-generated scores that vary according to answer quality, and SHALL NOT return identical all-70 evaluations; if the AI call fails, the system SHALL surface an explicit, observable error.

2.4 WHEN an AI evaluation response is parsed AND required metric fields are missing THEN the system SHALL treat the response as invalid and surface an explicit error, and SHALL NOT fabricate missing scores with a hardcoded `70` default.

2.5 WHEN a voice interview audio file is submitted AND the provider is valid THEN the system SHALL return a real transcription and speech metrics computed from that transcription; if transcription fails, the system SHALL surface an explicit, observable error rather than storing `[Transcription unavailable]` and zeroed metrics as a successful result.

2.6 WHEN `AI_PROVIDER` is switched between `openai` and `gemini` with valid keys THEN the system SHALL route calls to the selected provider with no code changes; WHEN the selected provider's key is missing, invalid, or disabled THEN the system SHALL surface a meaningful configuration/authentication error rather than fabricated default results.

2.7 WHEN any feature must fall back due to a failure THEN the fallback SHALL be explicit and documented (e.g. surfaced as an error or a clearly flagged fallback result) and SHALL NEVER be silently returned as if it were genuine provider output.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a resume is uploaded, the provider is valid, and text extraction succeeds THEN the system SHALL CONTINUE TO store and return structured resume data through the existing resume upload/parse endpoint and response shape.

3.2 WHEN questions are requested with valid provider configuration THEN the system SHALL CONTINUE TO return exactly the requested `count` of questions in the existing `{ text, type }` shape, respecting the requested interview type.

3.3 WHEN an answer shorter than the minimum length (fewer than 10 non-whitespace characters) is submitted THEN the system SHALL CONTINUE TO short-circuit without calling the provider, preserving the existing empty/short-answer handling.

3.4 WHEN a valid non-empty transcription and duration are provided to `analyzeSpeech` THEN the system SHALL CONTINUE TO compute filler-word count, speech rate, pause count, and confidence score using the existing calculation logic and `ISpeechAnalysis` shape.

3.5 WHEN the configured provider returns a valid, complete, parseable response THEN the system SHALL CONTINUE TO clamp numeric scores to the 0–100 range and return the existing response structure for each feature.

3.6 WHEN unrelated endpoints (authentication, analytics, storage, and non-AI controller logic) are exercised THEN the system SHALL CONTINUE TO behave exactly as before, unaffected by the fallback changes.

## Bug Condition Derivation

**Key Definitions**
- **F**: The current AI/speech service functions that swallow failures and return fabricated defaults.
- **F'**: The fixed functions that return real provider output on success and surface explicit errors on failure.

**Bug Condition Function** — identifies inputs/states that trigger silent fallback:

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type AIFeatureInvocation
    // X captures: feature (parseResume | generateQuestions | evaluateAnswer | transcribeAudio),
    // inputs (resume text, role/type/difficulty, question+answer, audio file),
    // and provider state (provider selection + key validity + provider response)
  OUTPUT: boolean

  // The bug is triggered whenever a genuine failure OR degenerate provider result
  // is masked as a successful, fabricated default instead of being surfaced.
  RETURN (X.extractedText is empty for a non-empty source)
      OR (X.providerCall throws)
      OR (X.providerResponse is unparseable OR missing required fields)
      OR (X.transcription = '[Transcription unavailable]')
      OR (X.providerKey is missing OR invalid OR disabled)
END FUNCTION
```

**Property: Fix Checking** — for buggy inputs, failures must be explicit, never fabricated:

```pascal
// Property: Fix Checking - No Silent Fallback
FOR ALL X WHERE isBugCondition(X) DO
  result ← F'(X)
  ASSERT surfaces_explicit_error(result)
     AND NOT returned_as_genuine(fabricated_default)
END FOR
```

**Property: Fix Checking** — for valid inputs, real provider output must be produced:

```pascal
// Property: Fix Checking - Real Provider Output & Differentiation
FOR ALL X WHERE NOT isBugCondition(X) AND provider_valid(X) DO
  result ← F'(X)
  ASSERT result reflects_actual_input(X)          // e.g. non-empty parsed resume
     AND result varies_with_input_quality(X)      // e.g. eval scores differ by answer quality
     AND result differentiated_by(role, type)     // e.g. questions differ per role
END FOR
```

**Preservation Goal** — non-buggy, valid-provider inputs behave exactly as before:

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

## Verification & Reproduction Expectations

- **Reproduce silent fallback (resume):** invoke `parseResume` with a valid resume while forcing the provider call to throw (or with an invalid key); observe that the current code returns all-empty arrays instead of an error.
- **Reproduce generic questions:** call `generateQuestions` for each of Software Engineer, Data Analyst, UI/UX Designer, Product Manager under a forced failure; observe identical generic default questions.
- **Reproduce identical scores:** call `evaluateAnswer` with excellent, average, and poor answers under a forced failure (and observe `|| 70` coercion on partial responses); confirm all metrics are 70.
- **Reproduce transcription fallback:** call `transcribeAudio` under a forced failure; observe `[Transcription unavailable]` and subsequent zeroed `analyzeSpeech` metrics stored as success.
- **Provider switch:** set `AI_PROVIDER=openai` then `AI_PROVIDER=gemini` with valid keys and confirm routing changes without code edits; set an invalid/disabled key and confirm a meaningful error is surfaced instead of defaults.
