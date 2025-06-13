
"use client";

import type { WebProductInsightsOutput, ProductFinding, VideoFinding } from "@/ai/flows/web-product-insights";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info, FileText, List, Youtube, ShoppingBag, MessageSquareText } from "lucide-react"; 

interface WebProductInsightsSectionProps {
  data: WebProductInsightsOutput | null;
  isLoading: boolean;
}

export function WebProductInsightsSection({ data, isLoading }: WebProductInsightsSectionProps) {
  const hasProductFindings = data && data.productFindings && data.productFindings.length > 0;
  const hasVideoFindings = data && data.videoFindings && data.videoFindings.length > 0;

  const affiliatePrefix = "https://go.isclix.com/deep_link/4725587962428837650";
  const utmParametersWeb = "utm_source=dealfindr&utm_medium=web_product_search&utm_campaign=product_listing";
  const utmParametersVideo = "utm_source=dealfindr&utm_medium=youtube_listing&utm_campaign=video_listing";
  const sub4Parameter = "sub4=oneatweb_insights";

  const cardTitle = data?.analyzedProductName && data.analyzedProductName !== data.originalSearchQuery 
    ? `Thông Tin Sản Phẩm: ${data.analyzedProductName}` 
    : "Thông Tin Sản Phẩm Toàn Diện (Web & Video)";

  return (
    <Card className="shadow-lg lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <ShoppingBag className="mr-2 h-6 w-6 text-primary" /> 
          {isLoading && !data ? "Đang tải thông tin sản phẩm..." : cardTitle}
        </CardTitle>
        {data?.searchContext && !isLoading && (
          <CardDescription>
             {data.searchContext}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-8">
        {isLoading && !data ? ( // Show detailed skeleton only when initial loading and no data yet
          <>
            <Skeleton className="h-8 w-3/4 mb-2" /> {/* For AI Summary Title */}
            <Skeleton className="h-6 w-full mb-4" /> {/* For AI Summary Content */}
            
            <Skeleton className="h-6 w-1/2 mb-2" /> {/* For Product Findings Title */}
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" /> {/* Table Row Skeleton */}
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            <Skeleton className="h-6 w-1/2 mb-2 mt-6" /> {/* For Video Findings Title */}
             <div className="space-y-2">
              <Skeleton className="h-10 w-full" /> {/* Table Row Skeleton */}
              <Skeleton className="h-10 w-full" />
            </div>
          </>
        ) : data ? (
          <>
            {/* AI Summary Section */}
            {(data.overallSummary || (data.analyzedProductName && data.analyzedProductName !== data.originalSearchQuery)) && (
                 <div className="pb-4 border-b border-border/70">
                    <h3 className="font-semibold text-lg mb-1 flex items-center text-foreground/90">
                        <MessageSquareText className="mr-2 h-5 w-5 text-primary" />
                        Phân Tích Từ AI cho: <span className="text-primary ml-1">{data.analyzedProductName || data.originalSearchQuery}</span>
                    </h3>
                    {data.overallSummary ? 
                        <p className="text-sm text-muted-foreground italic">{data.overallSummary}</p> 
                        : <p className="text-sm text-muted-foreground italic">AI đang phân tích hoặc không có tóm tắt cụ thể.</p>
                    }
                 </div>
            )}

            {/* Product Findings Table */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center text-foreground/90">
                <List className="mr-2 h-5 w-5 text-primary" /> Sản Phẩm & Giá Tham Khảo Từ Web (Phân tích bởi AI)
              </h3>
              {isLoading && !hasProductFindings ? (
                <div className="space-y-2 p-4 border border-dashed rounded-md">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ): hasProductFindings ? (
                <div className="overflow-x-auto rounded-md border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Tên Sản Phẩm/Trang</TableHead>
                        <TableHead>Nguồn/Cửa Hàng (AI)</TableHead>
                        <TableHead>Giá Ước Tính (AI)</TableHead>
                        <TableHead>Liên Kết</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.productFindings.map((item: ProductFinding, index: number) => {
                        const productLink = `${affiliatePrefix}?url=${encodeURIComponent(item.url)}&${utmParametersWeb}&${sub4Parameter}`;
                        return (
                          <TableRow key={`product-${index}`}>
                            <TableCell className="font-medium align-top">
                              <div>{item.title}</div>
                              {item.snippet && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex items-start">
                                  <FileText className="h-3.5 w-3.5 mr-1.5 shrink-0 mt-0.5" />
                                  <span className="flex-1">{item.snippet}</span>
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="align-top">{item.storeName || "Không rõ"}</TableCell>
                            <TableCell className="align-top">
                                {item.extractedPrice || "Không rõ"}
                            </TableCell>
                            <TableCell className="align-top">
                              <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary hover:text-primary/80 text-xs whitespace-nowrap">
                                <a href={productLink} target="_blank" rel="noopener noreferrer" aria-label={`Xem ${item.title}`}>
                                  Xem Ngay <ExternalLink className="ml-1 h-3 w-3" />
                                </a>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center text-muted-foreground p-4 justify-center border border-dashed rounded-md">
                  <Info className="mr-2 h-5 w-5" />
                  <span>Không tìm thấy thông tin sản phẩm hoặc giá từ web, hoặc AI không thể phân tích.</span>
                </div>
              )}
            </div>

            {/* Video Findings List/Table */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center text-foreground/90">
                <Youtube className="mr-2 h-5 w-5 text-red-500" /> Video Liên Quan Từ YouTube
              </h3>
               {isLoading && !hasVideoFindings ? (
                <div className="space-y-2 p-4 border border-dashed rounded-md">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : hasVideoFindings ? (
                <div className="overflow-x-auto rounded-md border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[250px]">Tiêu Đề Video</TableHead>
                        <TableHead>Mô Tả Ngắn</TableHead>
                        <TableHead>Xem Video</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.videoFindings.map((video: VideoFinding, index: number) => {
                        // Ensure video.url is a valid URL before encoding
                        let validVideoUrl = video.url;
                        try {
                            new URL(video.url); // Check if it's a valid URL
                        } catch (e) {
                            console.warn(`Invalid video URL found: ${video.url}. Skipping affiliate link generation.`);
                            validVideoUrl = "#"; // Fallback to a safe link
                        }
                        const videoLink = validVideoUrl === "#" ? "#" : `${affiliatePrefix}?url=${encodeURIComponent(validVideoUrl)}&${utmParametersVideo}&${sub4Parameter}`;
                        
                        return (
                          <TableRow key={`video-${index}`}>
                            <TableCell className="font-medium align-top">{video.title}</TableCell>
                            <TableCell className="align-top">
                              {video.snippet && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-3 flex items-start">
                                  <FileText className="h-3.5 w-3.5 mr-1.5 shrink-0 mt-0.5" />
                                  <span className="flex-1">{video.snippet}</span>
                                </p>
                              )}
                              {!video.snippet && <span className="text-xs text-muted-foreground">Không có mô tả.</span>}
                            </TableCell>
                            <TableCell className="align-top">
                              <Button variant="link" size="sm" asChild className="p-0 h-auto text-red-500 hover:text-red-500/80 text-xs whitespace-nowrap" disabled={videoLink === "#"}>
                                <a href={videoLink} target="_blank" rel="noopener noreferrer" aria-label={`Xem video ${video.title} trên YouTube`}>
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
              ) : (
                 <div className="flex items-center text-muted-foreground p-4 justify-center border border-dashed rounded-md">
                  <Info className="mr-2 h-5 w-5" />
                  <span>Không tìm thấy video nào trên YouTube cho sản phẩm này.</span>
                </div>
              )}
            </div>
            
            {(!hasProductFindings && !hasVideoFindings && !data.overallSummary && (!data.analyzedProductName || data.analyzedProductName === data.originalSearchQuery)) && (
                <div className="flex flex-col items-center text-muted-foreground p-6 justify-center text-center border border-dashed rounded-md">
                    <Info className="mr-2 h-10 w-10 mb-3 text-primary/70" />
                    <p className="font-medium text-lg">
                        Không tìm thấy thông tin chi tiết nào cho "{data.originalSearchQuery}".
                    </p>
                    <p className="text-sm">Hãy thử một từ khóa tìm kiếm khác hoặc kiểm tra lại sau.</p>
                </div>
            )}

          </>
        ) : ( // This case is when data is null and not loading (e.g., after an error or initial state)
           <div className="flex flex-col items-center text-muted-foreground p-6 justify-center text-center border border-dashed rounded-md">
                <Info className="mr-2 h-10 w-10 mb-3 text-primary/70" />
                <p className="font-medium text-lg">
                    Chưa có dữ liệu để hiển thị.
                </p>
                {data?.originalSearchQuery ? 
                    <p className="text-xs mt-2">Từ khóa đã tìm: "{data.originalSearchQuery}"</p>
                    : <p className="text-xs mt-2">Vui lòng nhập từ khóa để tìm kiếm.</p>
                }
          </div>
        )}
      </CardContent>
    </Card>
  );
}
