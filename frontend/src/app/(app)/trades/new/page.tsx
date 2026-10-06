"use client";

import PageHeader from "@/components/ui/PageHeader";
import TradeForm from "@/components/TradeForm";

export default function NewTradePage() {
  return (
    <>
      <PageHeader title="Log a trade" back />
      <TradeForm />
    </>
  );
}
