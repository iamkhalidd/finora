import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api.get<User>("/users/me")).data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProfileMutations() {
  const queryClient = useQueryClient();

  const updateName = useMutation({
    mutationFn: async (name: string) => (await api.put<User>("/users/me", { name })).data,
    onSuccess: (user) => queryClient.setQueryData(["profile"], user),
  });
  const changePassword = useMutation({
    mutationFn: async (payload: { current_password: string; new_password: string }) =>
      (await api.post("/users/me/password", payload)).data,
  });

  return { updateName, changePassword };
}
