"use client";

import { useParams } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import { ErrorState, Skeleton } from "@/components/ui/States";
import TransactionForm from "@/components/TransactionForm";
import { useTransaction } from "@/hooks/useTransactions";

export default function EditTransactionPage() {
  const id = Number(useParams<{ id: string }>().id);
  const { data, isLoading, isError, refetch } = useTransaction(id);

  return (
    <>
      <PageHeader title="Edit transaction" back />
      {isLoading ? (
        <div className="px-4 space-y-4">
          <Skeleton className="h-11" />
          <Skeleton className="h-16" />
          <Skeleton className="h-48" />
        </div>
      ) : isError || !data ? (
        <div className="px-4">
          <ErrorState message="This transaction couldn't be loaded. It may have been deleted." onRetry={() => refetch()} />
        </div>
      ) : (
        <TransactionForm existing={data} />
      )}
    </>
  );
}
