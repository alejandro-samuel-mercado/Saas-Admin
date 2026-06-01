import { redirect } from "next/navigation";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export const dynamicParams = false;

export default function LegacyManagementProductPage({ params }: { params: { id: string } }) {
  redirect(`/management/products/detail?id=${params.id}`);
}
