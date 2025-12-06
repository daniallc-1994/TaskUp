import { api } from "./api";

export async function adminPaginated<T>(path: string, token: string, page: number, limit: number) {
  return api.get(`${path}?page=${page}&limit=${limit}`, token) as Promise<T>;
}
