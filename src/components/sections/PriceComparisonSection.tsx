
"use client";

import type { PriceComparisonOutput } from "@/ai/flows/price-comparison"; // This flow is deprecated
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tag, Store, ExternalLink, Info, List, FileText } from "lucide-react";

interface PriceComparisonSectionProps {
  data: PriceComparisonOutput | null;
  isLoading: boolean;
}

// This component is deprecated and will be replaced by WebProductInsightsSection.
export function PriceComparisonSection({ data, isLoading }: PriceComparisonSectionProps) {
  const affiliatePrefix = "https://go.isclix.com/deep_link/4725587962428837650";
  const utmParameters = "utm_source=<utm_source>&utm_medium=<utm_medium>&utm_campaign=<utm_campaign>&utm_content=<utm_content>";
  const sub4Parameter = "sub4=oneatweb";

  const hasData = data?.items && data.items.length > 0;

  if (isLoading || hasData) { // Only render if loading or has data to show it's being phased out
     // console.warn("[PriceComparisonSection DEPRECATED] This component is deprecated. Use WebProductInsightsSection instead.");
  }


  return (
    <Card className="shadow-lg hidden"> {/* Hidden by default as it's deprecated */}
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Tag className="mr-2 h-6 w-6 text-primary" />
          Kết Quả Tìm Kiếm Sản Phẩm (Cũ)
        </CardTitle>
        {data?.searchContext && !isLoading && (
          <CardDescription>{data.searchContext}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        ) : hasData ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><List className="inline-block mr-1 h-4 w-4" />Sản Phẩm</TableHead>
                <TableHead><Store className="inline-block mr-1 h-4 w-4" />Nguồn</TableHead>
                <TableHead><Tag className="inline-block mr-1 h-4 w-4" />Giá Ước Tính</TableHead>
                <TableHead>Liên Kết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item, index) => {
                const productUrl = item.url;
                const purchaseLink = `${affiliatePrefix}?url=${encodeURIComponent(productUrl)}&${utmParameters}&${sub4Parameter}`;
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium align-top">
                      <div>{item.productName}</div>
                      {item.snippet && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-start">
                          <FileText className="h-3.5 w-3.5 mr-1.5 shrink-0 mt-0.5" />
                          <span className="flex-1 line-clamp-3">{item.snippet}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-top">{item.storeName}</TableCell>
                    <TableCell className="align-top">
                      {item.price > 0 ? item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : "Không rõ"}
                      {item.price === 0 && (
                        <p className="text-xs text-muted-foreground">(Giá không có sẵn)</p>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary hover:text-primary/80">
                        <a href={purchaseLink} target="_blank" rel="noopener noreferrer" aria-label={`Xem ${item.productName} tại ${item.storeName}`}>
                          Đến Trang <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center text-muted-foreground p-4 justify-center">
            <Info className="mr-2 h-5 w-5" />
            <span>{data?.searchContext || "Không có kết quả tìm kiếm nào."}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
