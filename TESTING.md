# Testing Strategy

The repository follows a layered test strategy. A test's level is determined by its scope and real dependencies; the interface (UI, API, or database) is tracked separately.

## Test commands

```bash
npm run test:fast         # Unit and component/module tests
npm run test:api          # Live Supabase REST API tests
npm run test:integration  # Live Supabase SDK and RLS integration tests
npm run test:contracts    # Public frog-catalog contract tests
npm run test:e2e          # Playwright browser tests
npm run test:count        # Count test cases by category
npm test                  # Existing full Vitest suite
```

API and integration suites require the BWS-injected Supabase and dedicated test-user secrets described in the README. E2E tests use the same credentials when available; set `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD` to use a separate browser test account.

## Repository layout

```text
src/
  auth/                       # Component/module tests colocated with React code
  frogs/
    frogSearch.ts             # Pure catalog search logic
    frogSearch.test.ts        # Unit tests
    frogCatalog.ts            # Runtime catalog shape validation
    frogCatalog.test.ts       # Unit tests

tests/
  api/                        # API/service tests
  integration/                # Real Supabase SDK and RLS tests
  contracts/                  # Public data/interface contracts
  support/api/                # Reusable API clients and test environment guards

e2e/
  pages/                      # Page Objects
  screens/                    # Screen/component Objects
  fixtures/                   # Playwright fixtures
  specs/                      # Browser-level user journeys
```

## POM/SOM rule

Page and Screen Objects belong only in `e2e/`. Unit, component, API, contract, and integration tests should test the smallest useful scope directly and should not hide their behavior behind browser-oriented abstractions.

E2E objects should expose user/business actions such as `searchFor()` and `login()`, use accessible locators first, and avoid wrappers around individual `click()` calls.
