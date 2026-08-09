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
  support/services/           # Service Objects (SOM) and test environment guards

e2e/
  pages/                      # Page Objects
  screens/                    # Screen/component Objects
  fixtures/                   # Playwright fixtures
  specs/                      # Browser-level user journeys
```

## POM and SOM rule

Page Objects and reusable UI component objects belong only in `e2e/`:

- `e2e/pages/` contains Page Objects (POM) that represent navigable application pages.
- `e2e/components/` contains reusable UI component objects composed by Page Objects.

Service Objects belong in `tests/support/services/`:

- Service Objects (SOM) encapsulate calls to external services such as Supabase Auth and REST endpoints.
- API and integration tests may use Service Objects, but the tests own the assertions about the response and business behavior.
- Unit and component tests should test the smallest useful scope directly and should not depend on browser or live-service abstractions.

E2E Page and component objects should expose user/business actions such as `searchFor()` and `login()`, use accessible locators first, and avoid wrappers around individual `click()` calls.
