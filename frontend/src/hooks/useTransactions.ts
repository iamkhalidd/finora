import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface TransactionPayload {
  amount: number;
  type: string;
  category: string;
  notes?: string;
  date?: string;
}

export function useTransactions(filters?: { type?: string; from?: string; to?: string; limit?: number }) {
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      const response = await api.get("/api/v1/transactions", { params: filters });
      return response.data;
    },
  });

  const summaryQuery = useQuery({
    queryKey: ["transactions-summary", filters?.type],
    queryFn: async () => {
      const response = await api.get("/api/v1/transactions/summary");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: TransactionPayload) => {
      const response = await api.post("/api/v1/transactions", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/v1/transactions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transactions-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
  });

  return {
    transactions: transactionsQuery.data || [],
    isLoading: transactionsQuery.isLoading,
    summary: summaryQuery.data || { total_balance: 0, total_income: 0, total_expenses: 0, categories: [] },
    isSummaryLoading: summaryQuery.isLoading,
    createTransaction: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteTransaction: deleteMutation.mutateAsync,
  };
}
