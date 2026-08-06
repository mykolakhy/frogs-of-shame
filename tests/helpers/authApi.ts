import type { AxiosInstance, AxiosResponse } from "axios";

// Thin wrapper around Supabase's Auth REST endpoints. One method per
// endpoint/action, each returning the raw AxiosResponse — callers decide
// what counts as success (some tests want a 200, some deliberately assert on
// a 4xx), so this never throws on a non-2xx response itself.
export class AuthApi {
  constructor(private client: AxiosInstance) {}

  login(email: string, password: string): Promise<AxiosResponse> {
    return this.client.post("/auth/v1/token?grant_type=password", { email, password });
  }

  signUp(email: string, password: string): Promise<AxiosResponse> {
    return this.client.post("/auth/v1/signup", { email, password });
  }
}
