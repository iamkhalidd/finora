import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface BookmarkPayload {
  title: string;
  description?: string;
  source?: string;
  url: string;
  image_url?: string;
  published_at?: string;
  category?: string;
}

export function useNews(category?: string) {
  const queryClient = useQueryClient();

  const newsQuery = useQuery({
    queryKey: ["news", category],
    queryFn: async () => {
      const response = await api.get("/api/v1/news", { params: { category } });
      return response.data;
    },
  });

  const bookmarksQuery = useQuery({
    queryKey: ["news-bookmarks"],
    queryFn: async () => {
      const response = await api.get("/api/v1/news/bookmarks");
      return response.data;
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post("/api/v1/news/bookmarks", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news-bookmarks"] });
    },
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/v1/news/bookmarks/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news-bookmarks"] });
    },
  });

  return {
    articles: newsQuery.data || [],
    isLoading: newsQuery.isLoading,
    bookmarks: bookmarksQuery.data || [],
    isBookmarksLoading: bookmarksQuery.isLoading,
    addBookmark: bookmarkMutation.mutateAsync,
    removeBookmark: removeBookmarkMutation.mutateAsync,
  };
}
