"use client";

import type { PriceComparisonOutput } from "@/ai/flows/price-comparison";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tag, Store, ExternalLink, TrendingDown, Info } from "lucide-react";

interface PriceComparisonSectionProps {
  data: PriceComparisonOutput | null;
  isLoading: boolean;
  attempted: boolean;
}

export function PriceComparisonSection({ data, isLoading, attempted }: PriceComparisonSectionProps) {
  if (!attempted && !data) return null;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Tag className="mr-2 h-6 w-6 text-primary" />
          So Sánh Giá
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        ) : data?.prices && data.prices.length > 0 ? (
          <>
            {data.cheapestStore && (
              <div className="mb-4 p-3 bg-primary/10 rounded-md border border-primary/30">
                <h3 className="text-lg font-semibold flex items-center text-primary">
                  <TrendingDown className="mr-2 h-5 w-5" />
                  Ưu Đãi Tốt Nhất
                </h3>
                <p className="text-foreground">
                  <strong>{data.cheapestStore}</strong> với giá <strong>${data.cheapestPrice?.toFixed(2)}</strong>
                </p>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Store className="inline-block mr-1 h-4 w-4" />Cửa Hàng</TableHead>
                  <TableHead><Tag className="inline-block mr-1 h-4 w-4" />Giá</TableHead>
                  <TableHead>Liên Kết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.prices.map((item, index) => (
                  <TableRow key={index} className={item.storeName === data.cheapestStore ? "bg-primary/5" : ""}>
                    <TableCell className="font-medium">{item.storeName}</TableCell>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary hover:text-primary/80">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`Xem sản phẩm tại ${item.storeName}`}>
                          Đến Cửa Hàng <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <div className="flex items-center text-muted-foreground">
            <Info className="mr-2 h-5 w-5" />
            <span>{attempted ? "Không có dữ liệu so sánh giá." : "Cung cấp liên kết sản phẩm để so sánh giá."}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
