import Layout from "../layout/Layout";
import ClinicAnalytics from "../features/dashboard/ClinicAnalytics";

export default function AnalyticsPage() {
  return (
    <Layout>
      <div className="mx-auto max-w-[1600px]">
        <ClinicAnalytics
          showVisitCounts
          description="Six-month clinic visit analytics for authorized clinical personnel."
        />
      </div>
    </Layout>
  );
}
