"use client";

import type { ProductSummaryOutput } from "@/ai/flows/product-summarization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Info } from "lucide-react";

interface ProductSummarySectionProps {
  data: ProductSummaryOutput | null;
  isLoading: boolean;
  attempted: boolean; 
}

export function ProductSummarySection({ data, isLoading, attempted }: ProductSummarySectionProps) {
  if (!attempted && !data) return null; 

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <FileText className="mr-2 h-6 w-6 text-primary" />
          Tóm Tắt Sản Phẩm
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : data?.summary ? (
          <p className="text-foreground/90 whitespace-pre-line">{data.summary}</p>
        ) : (
          <div className="flex items-center text-muted-foreground">
            <Info className="mr-2 h-5 w-5" />
            <span>{attempted ? "Không có tóm tắt cho sản phẩm hoặc đầu vào này." : "Cung cấp liên kết sản phẩm để xem tóm tắt."}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
