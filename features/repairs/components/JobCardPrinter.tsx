"use client"

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { generateJobCard } from '../services/pdf-service';

export function JobCardPrinter({ repair }: { repair: any }) {
  return (
    <Button onClick={() => generateJobCard(repair)}>
      <Printer className="mr-2 h-4 w-4" />
      Print Job Card
    </Button>
  );
}
