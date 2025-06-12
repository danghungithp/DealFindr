
"use client";

import type { WebProductInsightsOutput } from "@/ai/flows/web-product-insights";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Lightbulb, ThumbsUp, ThumbsDown, Tag, Link as LinkIcon, Info, FileText, ExternalLink, ListChecks, ShoppingBag, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WebProductInsightsSectionProps {
  data: WebProductInsightsOutput | null;
  isLoading: boolean;
}

export function WebProductInsightsSection({ data, isLoading }: WebProductInsightsSectionProps) {
  const hasContent = data && (data.overallSummary || data.positiveMentions?.length > 0 || data.negativeMentions?.length > 0 || data.discountMentions?.length > 0 || data.keySources?.length > 0 || data.productFindings?.length > 0);

  const affiliatePrefix = "https://go.isclix.com/deep_link/4725587962428837650";
  const utmParameters = "utm_source=dealfindr&utm_medium=web_insights&utm_campaign=product_listing";
  const sub4Parameter = "sub4=oneatweb_insights";

  return (
    <Card className="shadow-lg lg:col-span-2"> {/* Ensure it can span full width if needed */}
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Lightbulb className="mr-2 h-6 w-6 text-primary" />
          Phân Tích Thông Tin Sản Phẩm Từ Web
        </CardTitle>
        {data?.analyzedProductName && !isLoading && (
          <CardDescription>
            Kết quả phân tích cho: <span className="font-semibold text-foreground">{data.analyzedProductName}</span> (từ tìm kiếm: "{data.originalSearchQuery}")
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6 mb-4" />
            {[...Array(3)].map((_, i) => (
              <div key={`skel-group-${i}`} className="space-y-2">
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
             <Skeleton className="h-20 w-full mt-4" />
          </>
        ) : hasContent && data ? (
          <>
            {data.productFindings && data.productFindings.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground/90">
                  <ShoppingBag className="mr-2 h-5 w-5 text-primary" /> Danh Sách Sản Phẩm Tìm Thấy
                </h3>
                <div className="overflow-x-auto rounded-md border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Sản Phẩm</TableHead>
                        <TableHead>Cửa Hàng</TableHead>
                        <TableHead>Giá Ước Tính (AI)</TableHead>
                        <TableHead>Liên Kết</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.productFindings.map((item, index) => {
                        const purchaseLink = `${affiliatePrefix}?url=${encodeURIComponent(item.url)}&${utmParameters}&${sub4Parameter}`;
                        return (
                          <TableRow key={`product-${index}`}>
                            <TableCell className="font-medium align-top">
                              <div>{item.title}</div>
                              {item.snippet && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.snippet}</p>
                              )}
                            </TableCell>
                            <TableCell className="align-top">{item.storeName || "Không rõ"}</TableCell>
                            <TableCell className="align-top">
                              {item.extractedPrice || "Chưa rõ"}
                              <p className="text-xs text-muted-foreground">(AI trích xuất)</p>
                            </TableCell>
                            <TableCell className="align-top">
                              <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary hover:text-primary/80 text-xs">
                                <a href={purchaseLink} target="_blank" rel="noopener noreferrer" aria-label={`Xem ${item.title} tại ${item.storeName}`}>
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
                <p className="text-xs text-muted-foreground/80 mt-2 text-center">
                    Lưu ý: Giá và thông tin sản phẩm được AI trích xuất tự động và chỉ mang tính tham khảo.
                </p>
              </div>
            )}

            {data.overallSummary && (
              <div>
                <h3 className="font-semibold text-lg mb-1 text-foreground/90 flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" />Tổng Quan</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{data.overallSummary}</p>
              </div>
            )}

            {data.positiveMentions && data.positiveMentions.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-1 flex items-center text-green-400">
                  <ThumbsUp className="mr-2 h-5 w-5" /> Điểm Tích Cực
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {data.positiveMentions.map((mention, index) => (
                    <li key={`positive-${index}`}>{mention}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.negativeMentions && data.negativeMentions.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-1 flex items-center text-red-400">
                  <ThumbsDown className="mr-2 h-5 w-5" /> Điểm Cần Lưu Ý
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {data.negativeMentions.map((mention, index) => (
                    <li key={`negative-${index}`}>{mention}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.discountMentions && data.discountMentions.length > 0 && data.discountMentions[0] !== "Không tìm thấy đề cập mã giảm giá nào." && (
               <div>
                <h3 className="font-semibold text-lg mb-1 flex items-center text-amber-400">
                  <Tag className="mr-2 h-5 w-5" /> Đề Cập Giảm Giá/Khuyến Mãi (Từ Web)
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {data.discountMentions.map((mention, index) => (
                    <li key={`discount-${index}`}>{mention}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  (Lưu ý: Thông tin AI tìm thấy từ web, có thể không còn hiệu lực/chính xác.)
                </p>
              </div>
            )}
            
            {data.keySources && data.keySources.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground/90">
                  <LinkIcon className="mr-2 h-5 w-5 text-primary" /> Nguồn Tham Khảo Khác
                </h3>
                <div className="space-y-3">
                  {data.keySources.map((source, index) => (
                    <div key={`source-${index}`} className="p-3 border border-border/70 rounded-md bg-card/50 hover:bg-card/70 transition-colors">
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center justify-between">
                        <span className="flex-1 line-clamp-1">{source.title}</span>
                        <ExternalLink className="ml-2 h-4 w-4 shrink-0" />
                      </a>
                      {source.snippet && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{source.snippet}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground p-6 justify-center text-center">
            <Info className="mr-2 h-10 w-10 mb-3 text-primary/70" />
            <p className="font-medium text-lg">Không tìm thấy thông tin chi tiết.</p>
            <p className="text-sm">Hãy thử một từ khóa tìm kiếm khác hoặc kiểm tra lại sau.</p>
            {data?.originalSearchQuery && <p className="text-xs mt-2">Từ khóa đã tìm: "{data.originalSearchQuery}"</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
