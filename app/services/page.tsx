import { ServiceManager } from "@/features/repairs/components/ServiceManager";

export default function ServicesPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Service Fees</h1>
        <p className="text-muted-foreground">
          Manage the services and prices available during repairs.
        </p>
      </div>

      <ServiceManager />
    </div>
  );
}