import type { AxiosInstance, AxiosResponse } from "axios";

// Service Object Model wrapper for Supabase Auth REST endpoints. Each method
// returns the raw response so tests can assert both successful and negative
// service behavior.
export class AuthService {
  constructor(private readonly client: AxiosInstance) {}

  login(email: string, password: string): Promise<AxiosResponse> {
    return this.client.post("/auth/v1/token?grant_type=password", { email, password });
  }

  signUp(email: string, password: string): Promise<AxiosResponse> {
    return this.client.post("/auth/v1/signup", { email, password });
  }
}
