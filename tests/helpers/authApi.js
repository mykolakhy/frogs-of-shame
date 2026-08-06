// Thin wrapper around Supabase's Auth REST endpoints. One method per
// endpoint/action, each returning the raw { status, data } — callers decide
// what counts as success (some tests want a 200, some deliberately assert on
// a 4xx), so this never throws on a non-2xx response itself.
export class AuthApi {
  constructor(client) {
    this.client = client;
  }

  login(email, password) {
    return this.client.post("/auth/v1/token?grant_type=password", { email, password });
  }

  signUp(email, password) {
    return this.client.post("/auth/v1/signup", { email, password });
  }
}
