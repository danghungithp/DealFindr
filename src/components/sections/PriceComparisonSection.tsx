
"use client";

import type { PriceComparisonOutput } from "@/ai/flows/price-comparison";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tag, Store, ExternalLink, TrendingDown, Info, List } from "lucide-react";

interface PriceComparisonSectionProps {
  data: PriceComparisonOutput | null;
  isLoading: boolean;
}

export function PriceComparisonSection({ data, isLoading }: PriceComparisonSectionProps) {
  const affiliatePrefix = "https://go.isclix.com/deep_link/4725587962428837650";
  const utmParameters = "utm_source=<utm_source>&utm_medium=<utm_medium>&utm_campaign=<utm_campaign>&utm_content=<utm_content>";
  const sub4Parameter = "sub4=oneatweb";

  const hasData = data?.items && data.items.length > 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Tag className="mr-2 h-6 w-6 text-primary" />
          So Sánh Giá & Gợi Ý Sản Phẩm
        </CardTitle>
        {data?.searchContext && !isLoading && (
          <CardDescription>{data.searchContext}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4 mb-2" /> {/* For searchContext skeleton */}
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        ) : hasData ? (
          <>
            {data.cheapestStore && data.cheapestPrice !== undefined && (
              <div className="mb-4 p-3 bg-primary/10 rounded-md border border-primary/30">
                <h3 className="text-lg font-semibold flex items-center text-primary">
                  <TrendingDown className="mr-2 h-5 w-5" />
                  Ưu Đãi Tốt Nhất
                </h3>
                <p className="text-foreground">
                  <strong>{data.cheapestStore}</strong> với giá <strong>{data.cheapestPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</strong>
                </p>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><List className="inline-block mr-1 h-4 w-4" />Sản Phẩm</TableHead>
                  <TableHead><Store className="inline-block mr-1 h-4 w-4" />Cửa Hàng</TableHead>
                  <TableHead><Tag className="inline-block mr-1 h-4 w-4" />Giá</TableHead>
                  <TableHead>Liên Kết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item, index) => {
                  const productUrl = item.url;
                  const purchaseLink = `${affiliatePrefix}?url=${encodeURIComponent(productUrl)}&${utmParameters}&${sub4Parameter}`;
                  return (
                    <TableRow key={index} className={item.storeName === data.cheapestStore && item.price === data.cheapestPrice ? "bg-primary/5" : ""}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.storeName}</TableCell>
                      <TableCell>{item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</TableCell>
                      <TableCell>
                        <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary hover:text-primary/80">
                          <a href={purchaseLink} target="_blank" rel="noopener noreferrer" aria-label={`Xem ${item.productName} tại ${item.storeName}`}>
                            Đến Cửa Hàng <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        ) : (
          <div className="flex items-center text-muted-foreground p-4 justify-center">
            <Info className="mr-2 h-5 w-5" />
            <span>{data?.searchContext || "Không có dữ liệu so sánh giá hoặc gợi ý sản phẩm."}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

