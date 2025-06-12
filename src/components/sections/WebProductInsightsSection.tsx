
"use client";

import type { WebProductInsightsOutput, ProductFinding } from "@/ai/flows/web-product-insights";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Youtube, ExternalLink, Info, FileText, List } from "lucide-react"; 

interface WebProductInsightsSectionProps {
  data: WebProductInsightsOutput | null;
  isLoading: boolean;
}

export function WebProductInsightsSection({ data, isLoading }: WebProductInsightsSectionProps) {
  const hasContent = data && data.productFindings && data.productFindings.length > 0;

  const affiliatePrefix = "https://go.isclix.com/deep_link/4725587962428837650";
  const utmParameters = "utm_source=dealfindr&utm_medium=youtube_search&utm_campaign=video_listing";
  const sub4Parameter = "sub4=oneatweb_youtube_search";

  return (
    <Card className="shadow-lg lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Youtube className="mr-2 h-6 w-6 text-primary" /> 
          Video Đánh Giá & Giới Thiệu (YouTube)
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
              <List className="mr-2 h-5 w-5 text-primary" /> Danh Sách Video Tìm Thấy
            </h3>
            <div className="overflow-x-auto rounded-md border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">Tiêu Đề Video</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Mô Tả Ngắn</TableHead>
                    <TableHead>Xem Video</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.productFindings.map((item: ProductFinding, index: number) => {
                    const videoLink = `${affiliatePrefix}?url=${encodeURIComponent(item.url)}&${utmParameters}&${sub4Parameter}`;
                    return (
                      <TableRow key={`video-${index}`}>
                        <TableCell className="font-medium align-top">
                          <div>{item.productName}</div>
                        </TableCell>
                        <TableCell className="align-top">{item.storeName || "YouTube"}</TableCell>
                        <TableCell className="align-top">
                           {item.snippet && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-3 flex items-start">
                                <FileText className="h-3.5 w-3.5 mr-1.5 shrink-0 mt-0.5" />
                                <span className="flex-1">{item.snippet}</span>
                            </p>
                          )}
                          {!item.snippet && <span className="text-xs text-muted-foreground">Không có mô tả.</span>}
                        </TableCell>
                        <TableCell className="align-top">
                          <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary hover:text-primary/80 text-xs">
                            <a href={videoLink} target="_blank" rel="noopener noreferrer" aria-label={`Xem video ${item.productName} trên YouTube`}>
                              Xem trên YouTube <ExternalLink className="ml-1 h-3 w-3" />
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
                {data?.searchContext || "Không tìm thấy video nào trên YouTube cho sản phẩm này."}
            </p>
            <p className="text-sm">Hãy thử một từ khóa tìm kiếm khác hoặc kiểm tra lại sau.</p>
            {data?.originalSearchQuery && <p className="text-xs mt-2">Từ khóa đã tìm: "{data.originalSearchQuery}"</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
