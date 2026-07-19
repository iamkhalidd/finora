import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface BudgetPayload {
  category: string;
  limit: number;
}

export function useBudgets() {
  const queryClient = useQueryClient();

  const budgetsQuery = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const response = await api.get("/api/v1/budgets");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: BudgetPayload) => {
      const response = await api.post("/api/v1/budgets", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/v1/budgets/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
  });

  return {
    budgets: budgetsQuery.data || [],
    isLoading: budgetsQuery.isLoading,
    createBudget: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteBudget: deleteMutation.mutateAsync,
  };
}
