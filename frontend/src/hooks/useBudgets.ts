import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Budget } from "@/lib/types";

export function useBudgets(month: string) {
  return useQuery({
    queryKey: ["budgets", month],
    queryFn: async () => (await api.get<Budget[]>("/budgets/", { params: { month } })).data,
  });
}

export function useBudgetMutations(month: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["budgets"] });

  const create = useMutation({
    mutationFn: async (payload: { category: string; limit: number }) =>
      (await api.post<Budget>("/budgets/", payload, { params: { month } })).data,
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: async ({ id, limit }: { id: number; limit: number }) =>
      (await api.put<Budget>(`/budgets/${id}`, { limit }, { params: { month } })).data,
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/budgets/${id}`)).data,
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
