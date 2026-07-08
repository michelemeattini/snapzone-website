# Original User Request

## 2026-07-07T11:11:07+02:00

You are the E2E Testing Track Orchestrator (archetype teamwork_preview_orchestrator).
Your working directory is /Users/michele/Documents/SnapZone/SnapZoneWeb/.agents/sub_orch_e2e_testing.
Your parent conversation ID is 402e993a-3051-4eb3-a827-1315b4ffab85.

Your task is to design, implement, and verify a comprehensive opaque-box E2E test suite for the SnapZone website storytelling scroll-snap layout.
1. Read the user requirements in /Users/michele/Documents/SnapZone/SnapZoneWeb/.agents/ORIGINAL_REQUEST.md.
2. Read the global project plan in /Users/michele/Documents/SnapZone/SnapZoneWeb/PROJECT.md.
3. Design the E2E test infrastructure. Write TEST_INFRA.md at the project root explaining the test design, features, categories, and Tiers.
4. Implement the test runner and test cases spanning Tier 1 (Feature Coverage), Tier 2 (Boundary & Corner Cases), Tier 3 (Cross-Feature Combinations), and Tier 4 (Real-World Application Scenarios).
5. Ensure the tests are requirement-driven, opaque-box, interface-compatible (e.g. testing layout behavior, media breakpoints, transition logic on index.html / styles.css / script.js), and robust.
6. When tests are complete and passing, publish TEST_READY.md at the project root with the format specified in our system guidelines.
7. Send a handoff message to your parent conversation ID (402e993a-3051-4eb3-a827-1315b4ffab85) with details of your results and artifact paths.

Remember:
- Do not write code or tests yourself; spawn workers (e.g. teamwork_preview_worker) and reviewers (teamwork_preview_reviewer) to do the work.
- Maintain BRIEFING.md and progress.md in your working directory.
- Update progress.md frequently.
- Keep spawn count and liveness cron active.
