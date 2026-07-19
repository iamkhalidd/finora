import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useStore } from "@/hooks/useStore";
import { useEffect } from "react";

export function useAlerts(category?: string) {
  const queryClient = useQueryClient();
  const setNotificationCount = useStore((state) => state.setNotificationCount);

  const alertsQuery = useQuery({
    queryKey: ["alerts", category],
    queryFn: async () => {
      const response = await api.get("/api/v1/alerts", { params: { category } });
      return response.data;
    },
  });

  const readMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.put(`/api/v1/alerts/${id}`, { is_read: true });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/api/v1/alerts/read-all");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  // Keep global store sync for notification bell pulse counting
  useEffect(() => {
    if (alertsQuery.data) {
      const unreadCount = alertsQuery.data.filter((a: any) => !a.is_read).length;
      setNotificationCount(unreadCount);
    }
  }, [alertsQuery.data, setNotificationCount]);

  return {
    alerts: alertsQuery.data || [],
    isLoading: alertsQuery.isLoading,
    markAsRead: readMutation.mutateAsync,
    markAllAsRead: readAllMutation.mutateAsync,
  };
}
