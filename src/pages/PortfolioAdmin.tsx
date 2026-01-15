import AdminLayout from "@/components/AdminLayout";
import PortfolioAdminComponent from "@/components/admin/PortfolioAdmin";

interface PortfolioAdminProps {
  isEmbedded?: boolean;
}

const PortfolioAdmin = ({ isEmbedded = false }: PortfolioAdminProps) => {
  if (isEmbedded) {
    return <PortfolioAdminComponent />;
  }

  return (
    <AdminLayout>
      <PortfolioAdminComponent />
    </AdminLayout>
  );
};

export default PortfolioAdmin;