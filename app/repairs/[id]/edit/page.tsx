"use client"

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Upload, X } from 'lucide-react';
import { QRScanner } from '@/features/repairs/components/QRScanner';

export default function EditRepairPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    customerId: '',
    customerName: '',
    technicianId: '',
    deviceModel: '',
    imei: '',
    phoneNumber: '',
    city: '',
    region: '',
    complaint: '',
    faultType: '',
    repairType: 'hardware',
    financialService: 'cash',
    warrantyStatus: 'out_of_warranty',
    dateReceived: '',
    solution: '',
    status: 'open',
    photoFront: '',
    photoBack: '',
    photoRepair: '',
    photoFinalQA: '',
  });

  const [photoPreview, setPhotoPreview] = useState({
    photoFront: '',
    photoBack: '',
    photoRepair: '',
    photoFinalQA: '',
  });

  useEffect(() => {
    // Fetch technicians
    fetch('/api/technicians')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTechnicians(data);
      })
      .catch(err => console.error('Error fetching technicians:', err));

    // Fetch repair data
    fetch(`/api/repairs/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        
        setFormData({
  customerId: data.customerId,
  customerName: data.customerName || "",

  technicianId: data.technicianId
    ? String(data.technicianId)
    : "",

  deviceModel: data.deviceModel || "",
  imei: data.imei || "",
  phoneNumber: data.phoneNumber || "",
  city: data.city || "",
  region: data.region || "",
  complaint: data.complaint || "",
  faultType: data.faultType || "",
  repairType: data.repairType || "hardware",
  financialService: data.financialService || "cash",
  warrantyStatus: data.warrantyStatus || "out_of_warranty",
  solution: data.solution || "",
  status: data.status || "open",

  photoFront: data.photoFront || "",
  photoBack: data.photoBack || "",
  photoRepair: data.photoRepair || "",
  photoFinalQA: data.photoFinalQA || "",

  dateReceived: data.dateReceived
    ? new Date(data.dateReceived).toISOString().slice(0, 10)
    : "",
});

        // Set photo previews from URLs if they exist
        if (data.photoFront) setPhotoPreview(prev => ({ ...prev, photoFront: data.photoFront }));
        if (data.photoBack) setPhotoPreview(prev => ({ ...prev, photoBack: data.photoBack }));
        if (data.photoRepair) setPhotoPreview(prev => ({ ...prev, photoRepair: data.photoRepair }));
        if (data.photoFinalQA) setPhotoPreview(prev => ({ ...prev, photoFinalQA: data.photoFinalQA }));
      })
      .catch(err => {
        toast.error("Failed to load repair data");
        console.error(err);
      })
      .finally(() => setFetching(false));
  }, [id]);

  const handlePhotoChange = (field: string, file: File | null) => {
    if (!file) {
      setFormData({ ...formData, [field]: '' });
      setPhotoPreview({ ...photoPreview, [field]: '' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData({ ...formData, [field]: base64 });
      setPhotoPreview({ ...photoPreview, [field]: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submissionData = {
  ...formData,

  // ensure technicianId is a number
  technicianId:
  formData.technicianId === "unassigned"
    ? null
    : Number(formData.technicianId),

  // keep dates as strings (YYYY-MM-DD)
  dateReceived: formData.dateReceived || null,
};

const response = await fetch(`/api/repairs/${id}`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(submissionData),
});

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update repair');
      
      toast.success(`Repair updated successfully`);
      router.push(`/repairs/${id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const PhotoUploadField = ({ label, field }: { label: string; field: string }) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="file"
            id={field}
            accept="image/*"
            onChange={(e) => handlePhotoChange(field, e.target.files?.[0] || null)}
            className="hidden"
          />
          <label
            htmlFor={field}
            className="flex items-center justify-center w-full h-10 px-4 border border-input rounded-md bg-background hover:bg-accent cursor-pointer transition-colors"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span className="text-sm">Choose Photo</span>
          </label>
        </div>
        {photoPreview[field as keyof typeof photoPreview] && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handlePhotoChange(field, null)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {photoPreview[field as keyof typeof photoPreview] && (
        <div className="mt-2">
          <img
            src={photoPreview[field as keyof typeof photoPreview]}
            alt={label}
            className="h-24 w-24 object-cover rounded-md border border-input"
          />
        </div>
      )}
    </div>
  );

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Edit Repair: {formData.repairNumber}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Repair Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
            {/* Device Information */}
            <div className="space-y-2">
              <Label htmlFor="imei">IMEI Number *</Label>
              <div className="flex gap-2">
                <Input 
                  id="imei" 
                  value={formData.imei} 
                  onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                  placeholder="15-digit IMEI"
                  required
                />
                <QRScanner onScan={(text) => setFormData({ ...formData, imei: text })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviceModel">Device Model *</Label>
              <Input 
                id="deviceModel" 
                value={formData.deviceModel} 
                onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                placeholder="e.g. iPhone 13"
                required
              />
            </div>

            {/* Repair Type & Warranty */}
            <div className="space-y-2">
              <Label htmlFor="repairType">Repair Type *</Label>
              <Select 
                value={formData.repairType} 
                onValueChange={(value) => setFormData({ ...formData, repairType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warrantyStatus">Warranty Status *</Label>
              <Select 
                value={formData.warrantyStatus} 
                onValueChange={(value) => setFormData({ ...formData, warrantyStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_warranty">In Warranty</SelectItem>
                  <SelectItem value="out_of_warranty">Out of Warranty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status & Technician */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_parts">Waiting Parts</SelectItem>
                  <SelectItem value="quality_check">Quality Check</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="technicianId">Assigned Technician</Label>
              <Select 
                value={formData.technicianId} 
                onValueChange={(value) => setFormData({ ...formData, technicianId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
  Unassigned
</SelectItem>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id.toString()}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Financial Service & Fault Type */}
            <div className="space-y-2">
              <Label htmlFor="financialService">Financial Service *</Label>
              <Select 
                value={formData.financialService} 
                onValueChange={(value) => setFormData({ ...formData, financialService: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="faultType">Fault Category</Label>
              <Input 
                id="faultType" 
                value={formData.faultType || ''} 
                onChange={(e) => setFormData({ ...formData, faultType: e.target.value })}
                placeholder="e.g. Screen, Battery, Charging"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateReceived">Date Received</Label>
              <Input 
                id="dateReceived" 
                type="date"
                value={formData.dateReceived} 
                onChange={(e) => setFormData({ ...formData, dateReceived: e.target.value })}
                required
              />
            </div>

            {/* Complaint & Solution */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="complaint">Customer Complaint *</Label>
              <Textarea 
                id="complaint" 
                value={formData.complaint} 
                onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                required
                placeholder="Describe the issue..."
                rows={3}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="solution">Solution</Label>
              <Textarea 
                id="solution" 
                value={formData.solution || ''} 
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                placeholder="Describe the fix..."
                rows={3}
              />
            </div>

            {/* Photos */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Device Photos</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <PhotoUploadField label="Front Photo" field="photoFront" />
                <PhotoUploadField label="Back Photo" field="photoBack" />
                <PhotoUploadField label="Internal/Repair Photo" field="photoRepair" />
                <PhotoUploadField label="Final QA Photo" field="photoFinalQA" />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="md:col-span-2 flex flex-col md:flex-row justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} className="w-full md:w-auto">Cancel</Button>
              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Saving..." : "Update Repair Job"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
