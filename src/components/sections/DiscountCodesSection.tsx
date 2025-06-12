"use client";

import type { FindDiscountCodesOutput } from "@/ai/flows/discount-hunter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Ticket, Info, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DiscountCodesSectionProps {
  data: FindDiscountCodesOutput | null;
  isLoading: boolean;
}

export function DiscountCodesSection({ data, isLoading }: DiscountCodesSectionProps) {
  const { toast } = useToast();

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: `Discount code "${code}" copied to clipboard.`,
    });
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Ticket className="mr-2 h-6 w-6 text-primary" />
          Discount Codes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
          </div>
        ) : data?.discountCodes && data.discountCodes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.discountCodes.map((code, index) => (
              <div key={index} className="relative group">
                <Badge variant="secondary" className="text-lg py-1 px-3 cursor-pointer" onClick={() => copyToClipboard(code)}>
                  {code}
                  <Copy className="ml-2 h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center text-muted-foreground">
            <Info className="mr-2 h-5 w-5" />
            <span>No discount codes found for this product.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
