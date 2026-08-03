import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export function generateJobCard(repair: any) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('LENIX MOBILE - REPAIR JOB CARD', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Repair Number: ${repair.repairNumber}`, 20, 40);
  doc.text(`Date: ${new Date(repair.dateReceived).toLocaleDateString()}`, 150, 40);
  
  // Customer Info
  doc.line(20, 45, 190, 45);
  doc.text('CUSTOMER INFORMATION', 20, 55);
  doc.setFontSize(10);
  doc.text(`Name: ${repair.customerName || 'N/A'}`, 20, 65);
  doc.text(`Phone: ${repair.phoneNumber}`, 20, 72);
  doc.text(`City/Region: ${repair.city || 'N/A'}, ${repair.region || 'N/A'}`, 20, 79);
  
  // Device Info
  doc.setFontSize(12);
  doc.text('DEVICE INFORMATION', 110, 55);
  doc.setFontSize(10);
  doc.text(`Model: ${repair.deviceModel}`, 110, 65);
  doc.text(`IMEI: ${repair.imei}`, 110, 72);
  doc.text(`Warranty: ${repair.warrantyStatus}`, 110, 79);
  
  // Repair Details
  doc.line(20, 85, 190, 85);
  doc.setFontSize(12);
  doc.text('REPAIR DETAILS', 20, 95);
  doc.setFontSize(10);
  doc.text('Complaint:', 20, 105);
  doc.text(doc.splitTextToSize(repair.complaint, 160), 20, 112);
  
  doc.text('Financial Service:', 20, 135);
  doc.text(repair.financialService.toUpperCase(), 60, 135);
  
  // Footer / Signatures
  doc.line(20, 250, 80, 250);
  doc.text('Customer Signature', 30, 255);
  
  doc.line(130, 250, 190, 250);
  doc.text('Technician Signature', 140, 255);
  
  doc.save(`JobCard-${repair.repairNumber}.pdf`);
}
