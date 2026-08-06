import type { AxiosInstance, AxiosResponse } from "axios";

// Same idea as AuthApi, for the `favorites` table's REST endpoints.
export class FavoritesApi {
  constructor(private client: AxiosInstance) {}

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
