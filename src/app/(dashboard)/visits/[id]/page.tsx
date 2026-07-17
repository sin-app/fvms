import { VisitDetail } from "@/features/visits";

export default async function VisitDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return <VisitDetail id={id} />;
}
