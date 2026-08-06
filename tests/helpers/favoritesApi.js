// Same idea as AuthApi, for the `favorites` table's REST endpoints.
export class FavoritesApi {
  constructor(client) {
    this.client = client;
  }

  list(frogId) {
    return this.client.get(frogId ? `/rest/v1/favorites?frog_id=eq.${frogId}` : "/rest/v1/favorites");
  }

  insert(userId, frogId) {
    return this.client.post("/rest/v1/favorites", { user_id: userId, frog_id: frogId });
  }

  delete(frogId) {
    return this.client.delete(`/rest/v1/favorites?frog_id=eq.${frogId}`);
  }
}
