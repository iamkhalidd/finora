"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import TransactionForm from "@/components/TransactionForm";

function NewTransaction() {
  const type = useSearchParams().get("type") === "income" ? "income" : "expense";
  return <TransactionForm initialType={type} />;
}

export default function NewTransactionPage() {
  return (
    <>
      <PageHeader title="New transaction" back />
      <Suspense>
        <NewTransaction />
      </Suspense>
    </>
  );
}
