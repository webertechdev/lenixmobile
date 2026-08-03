import { checkImeiExists, createRepair } from './repair-service';

export async function importRepairsFromCsv(rows: any[], userId: number) {
  const results = {
    success: 0,
    failed: 0,
    duplicates: 0,
    errors: [] as string[]
  };

  for (const row of rows) {
    try {
      const imei = row.imei?.toString().trim();
      if (!imei) {
        results.failed++;
        results.errors.push(`Row missing IMEI`);
        continue;
      }

      const exists = await checkImeiExists(imei);
      if (exists) {
        results.duplicates++;
        results.errors.push(`Duplicate IMEI: ${imei}`);
        continue;
      }

      await createRepair({
        customerId: parseInt(row.customerId),
        deviceModel: row.deviceModel,
        imei,
        phoneNumber: row.phoneNumber,
        city: row.city,
        region: row.region,
        complaint: row.complaint,
        faultType: row.faultType,
        repairType: row.repairType,
        financialService: row.financialService,
        warrantyStatus: row.warrantyStatus,
        dateReceived: new Date(row.dateReceived || new Date()),
        status: 'open'
      }, userId);

      results.success++;
    } catch (error: any) {
      results.failed++;
      results.errors.push(`Error importing row: ${error.message}`);
    }
  }

  return results;
}
