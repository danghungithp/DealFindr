
"use client";

import type { WebProductInsightsOutput, ProductFinding } from "@/ai/flows/web-product-insights";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SearchCheck, ShoppingBag, ExternalLink, Info, FileText, List } from "lucide-react"; // Updated Icons

interface WebProductInsightsSectionProps {
  data: WebProductInsightsOutput | null;
  isLoading: boolean;
}

export function WebProductInsightsSection({ data, isLoading }: WebProductInsightsSectionProps) {
  const hasContent = data && data.productFindings && data.productFindings.length > 0;

  const affiliatePrefix = "https://go.isclix.com/deep_link/4725587962428837650";
  const utmParameters = "utm_source=dealfindr&utm_medium=web_search&utm_campaign=product_listing_targeted";
  const sub4Parameter = "sub4=oneatweb_targeted_search";

  return (
    <Card className="shadow-lg lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <SearchCheck className="mr-2 h-6 w-6 text-primary" /> 
          Kết Quả Tìm Kiếm Sản Phẩm
        </CardTitle>
        {data?.searchContext && !isLoading && (
          <CardDescription>
             {data.searchContext}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-3/4 mb-2" /> 
            <Skeleton className="h-10 w-full mb-1" />
            <Skeleton className="h-10 w-full mb-1" />
            <Skeleton className="h-10 w-full" />
          </>
        ) : hasContent && data?.productFindings ? (
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground/90">
              <List className="mr-2 h-5 w-5 text-primary" /> Danh Sách Sản Phẩm Tìm Thấy
            </h3>
            <div className="overflow-x-auto rounded-md border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">Sản Phẩm</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Giá Tham Khảo</TableHead>
                    <TableHead>Liên Kết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.productFindings.map((item: ProductFinding, index: number) => {
                    const purchaseLink = `${affiliatePrefix}?url=${encodeURIComponent(item.url)}&${utmParameters}&${sub4Parameter}`;
                    return (
                      <TableRow key={`product-${index}`}>
                        <TableCell className="font-medium align-top">
                          <div>{item.productName}</div>
                          {item.snippet && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-3 flex items-start">
                                <FileText className="h-3.5 w-3.5 mr-1.5 shrink-0 mt-0.5" />
                                <span className="flex-1">{item.snippet}</span>
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="align-top">{item.storeName || "Không rõ"}</TableCell>
                        <TableCell className="align-top">
                          {item.price > 0 ? item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : "Không rõ"}
                          {item.price === 0 && (
                            <p className="text-xs text-muted-foreground">(Giá không có sẵn)</p>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary hover:text-primary/80 text-xs">
                            <a href={purchaseLink} target="_blank" rel="noopener noreferrer" aria-label={`Xem ${item.productName} tại ${item.storeName}`}>
                              Đến trang <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground p-6 justify-center text-center">
            <Info className="mr-2 h-10 w-10 mb-3 text-primary/70" />
            <p className="font-medium text-lg">
                {data?.searchContext || "Không tìm thấy thông tin chi tiết hoặc không có sản phẩm nào khớp."}
            </p>
            <p className="text-sm">Hãy thử một từ khóa tìm kiếm khác hoặc kiểm tra lại sau.</p>
            {data?.originalSearchQuery && <p className="text-xs mt-2">Từ khóa đã tìm: "{data.originalSearchQuery}"</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
