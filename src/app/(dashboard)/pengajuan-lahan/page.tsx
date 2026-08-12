import { getAuthContext } from "@/lib/auth/authorization";
import { listLandProposals } from "@/features/land-proposals/services/land-proposal-service";
import { ProposalList } from "@/features/land-proposals/components/proposal-list";

export const metadata = {
  title: "Pengajuan Lahan",
};

export default async function PengajuanLahanPage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    return <p className="text-sm text-muted-foreground">Tidak dapat memuat pengajuan.</p>;
  }

  const proposals = await listLandProposals(ctx);

  return <ProposalList proposals={proposals} currentUser={ctx} />;
}