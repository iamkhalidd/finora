import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ImportedTransaction, InboundAddress, TxType } from "@/lib/types";

export function useImports() {
  return useQuery({
    queryKey: ["imports"],
    queryFn: async () => (await api.get<ImportedTransaction[]>("/imports/")).data,
    // New alerts arrive in the background, so check again when the app comes back into view
    refetchOnWindowFocus: true,
  });
}

export function useInboundAddress() {
  return useQuery({
    queryKey: ["imports", "address"],
    queryFn: async () => (await api.get<InboundAddress>("/imports/address")).data,
    refetchOnWindowFocus: true,
  });
}

export function useImportMutations() {
  const queryClient = useQueryClient();
  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["imports"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["summary"] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
  };

  const approve = useMutation({
    mutationFn: async ({ id, ...body }: { id: number; category: string; type?: TxType; amount?: number; notes?: string | null; date?: string }) =>
      (await api.post(`/imports/${id}/approve`, body)).data,
    onSuccess: refreshAll,
  });
  const approveSuggested = useMutation({
    mutationFn: async () => (await api.post<{ approved: number }>("/imports/approve-suggested")).data,
    onSuccess: refreshAll,
  });
  const dismiss = useMutation({
    mutationFn: async (id: number) => (await api.post(`/imports/${id}/dismiss`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["imports"] }),
  });
  const paste = useMutation({
    mutationFn: async (text: string) =>
      (await api.post<{ duplicate: boolean; item: ImportedTransaction }>("/imports/paste", { text })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["imports"] }),
  });
  const rotate = useMutation({
    mutationFn: async () => (await api.post<InboundAddress>("/imports/address/rotate")).data,
    onSuccess: (data) => queryClient.setQueryData(["imports", "address"], data),
  });

  return { approve, approveSuggested, dismiss, paste, rotate };
}
