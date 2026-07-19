import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface TradePayload {
  pair: string;
  direction: string;
  entry_price: number;
  exit_price?: number;
  lot_size: number;
  stop_loss?: number;
  take_profit?: number;
  session: string;
  strategy?: string;
  notes?: string;
  date?: string;
}

export function useTrades(limit?: number) {
  const queryClient = useQueryClient();

  const tradesQuery = useQuery({
    queryKey: ["trades", limit],
    queryFn: async () => {
      const response = await api.get("/api/v1/trades", { params: { limit } });
      return response.data;
    },
  });

  const statsQuery = useQuery({
    queryKey: ["trades-stats"],
    queryFn: async () => {
      const response = await api.get("/api/v1/trades/stats");
      return response.data;
    },
  });

  const analyticsQuery = (period: string) => {
    return useQuery({
      queryKey: ["trades-analytics", period],
      queryFn: async () => {
        const response = await api.get("/api/v1/trades/analytics", { params: { period } });
        return response.data;
      },
    });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: TradePayload) => {
      const response = await api.post("/api/v1/trades", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["trades-stats"] });
      queryClient.invalidateQueries({ queryKey: ["trades-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/v1/trades/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["trades-stats"] });
      queryClient.invalidateQueries({ queryKey: ["trades-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
  });

  return {
    trades: tradesQuery.data || [],
    isLoading: tradesQuery.isLoading,
    stats: statsQuery.data || { win_rate: 0, total_p_l: 0, avg_rr: 0, total_trades: 0 },
    isStatsLoading: statsQuery.isLoading,
    useAnalytics: analyticsQuery,
    createTrade: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteTrade: deleteMutation.mutateAsync,
  };
}
