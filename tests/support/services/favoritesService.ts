import type { AxiosInstance, AxiosResponse } from "axios";

// Service Object Model wrapper for the favorites REST service.
export class FavoritesService {
  constructor(private readonly client: AxiosInstance) {}

  list(frogId?: string): Promise<AxiosResponse> {
    return this.client.get(frogId ? `/rest/v1/favorites?frog_id=eq.${frogId}` : "/rest/v1/favorites");
  }

  insert(userId: string, frogId: string): Promise<AxiosResponse> {
    return this.client.post("/rest/v1/favorites", { user_id: userId, frog_id: frogId });
  }

  delete(frogId: string): Promise<AxiosResponse> {
    return this.client.delete(`/rest/v1/favorites?frog_id=eq.${frogId}`);
  }
}
