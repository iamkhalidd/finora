import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Direction, Trade, TradeAnalytics, TradeStats } from "@/lib/types";

export interface TradePayload {
  pair: string;
  direction: Direction;
  entry_price: number;
  exit_price: number | null;
  lot_size: number;
  stop_loss: number | null;
  take_profit: number | null;
  session: string;
  strategy: string | null;
  notes: string | null;
  p_l: number | null;
  date: string;
}

export type TradeFilter = "all" | "open" | "closed";

export function useTrades(filter: TradeFilter = "all") {
  return useQuery({
    queryKey: ["trades", "list", filter],
    queryFn: async () =>
      (await api.get<Trade[]>("/trades/", { params: { status: filter === "all" ? undefined : filter } })).data,
  });
}

export function useTrade(id: number | undefined) {
  return useQuery({
    queryKey: ["trades", "detail", id],
    queryFn: async () => (await api.get<Trade>(`/trades/${id}`)).data,
    enabled: !!id,
  });
}

export function useTradeStats() {
  return useQuery({
    queryKey: ["trades", "stats"],
    queryFn: async () => (await api.get<TradeStats>("/trades/stats")).data,
  });
}

export function useTradeAnalytics(period: string) {
  return useQuery({
    queryKey: ["trades", "analytics", period],
    queryFn: async () => (await api.get<TradeAnalytics>("/trades/analytics", { params: { period } })).data,
  });
}

export function useTradeMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["trades"] });

  const create = useMutation({
    mutationFn: async (payload: TradePayload) => (await api.post<Trade>("/trades/", payload)).data,
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<TradePayload> & { id: number }) =>
      (await api.put<Trade>(`/trades/${id}`, payload)).data,
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/trades/${id}`)).data,
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
