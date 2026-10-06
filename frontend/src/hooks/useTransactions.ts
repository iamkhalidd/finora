import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Summary, Transaction, TxType } from "@/lib/types";

export interface TransactionPayload {
  amount: number;
  type: TxType;
  category: string;
  notes?: string | null;
  date?: string;
}

export function useTransactions(params: { month?: string; type?: TxType; limit?: number } = {}) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: async () => (await api.get<Transaction[]>("/transactions/", { params })).data,
  });
}

export function useTransaction(id: number | undefined) {
  return useQuery({
    queryKey: ["transactions", "detail", id],
    queryFn: async () => (await api.get<Transaction>(`/transactions/${id}`)).data,
    enabled: !!id,
  });
}

export function useSummary(month: string) {
  return useQuery({
    queryKey: ["summary", month],
    queryFn: async () => (await api.get<Summary>("/transactions/summary", { params: { month } })).data,
  });
}

export function useTransactionMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["summary"] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  };

  const create = useMutation({
    mutationFn: async (payload: TransactionPayload) => (await api.post<Transaction>("/transactions/", payload)).data,
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: async ({ id, ...payload }: TransactionPayload & { id: number }) =>
      (await api.put<Transaction>(`/transactions/${id}`, payload)).data,
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/transactions/${id}`)).data,
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
