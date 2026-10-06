"use client";

import { useParams } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import { ErrorState, Skeleton } from "@/components/ui/States";
import TradeForm from "@/components/TradeForm";
import { useTrade } from "@/hooks/useTrades";

export default function EditTradePage() {
  const id = Number(useParams<{ id: string }>().id);
  const { data, isLoading, isError, refetch } = useTrade(id);

  return (
    <>
      <PageHeader title="Edit trade" back />
      {isLoading ? (
        <div className="px-4 space-y-4"><Skeleton className="h-12" /><Skeleton className="h-11" /><Skeleton className="h-40" /></div>
      ) : isError || !data ? (
        <div className="px-4"><ErrorState message="This trade couldn't be loaded." onRetry={() => refetch()} /></div>
      ) : (
        <TradeForm existing={data} />
      )}
    </>
  );
}
