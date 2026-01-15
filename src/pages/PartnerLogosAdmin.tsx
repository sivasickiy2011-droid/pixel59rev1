import PartnersAdmin from '@/components/admin/PartnersAdmin';
import AdminLayout from '@/components/AdminLayout';

interface PartnerLogosAdminProps {
  isEmbedded?: boolean;
}

export default function PartnerLogosAdmin({ isEmbedded = false }: PartnerLogosAdminProps) {
  if (isEmbedded) {
    return <PartnersAdmin />;
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <PartnersAdmin />
      </div>
    </AdminLayout>
  );
}