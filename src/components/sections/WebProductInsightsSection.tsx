
"use client";

import type { WebProductInsightsOutput } from "@/ai/flows/web-product-insights";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Lightbulb, ThumbsUp, ThumbsDown, Tag, Link as LinkIcon, Info, FileText, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WebProductInsightsSectionProps {
  data: WebProductInsightsOutput | null;
  isLoading: boolean;
}

export function WebProductInsightsSection({ data, isLoading }: WebProductInsightsSectionProps) {
  const hasContent = data && (data.overallSummary || data.positiveMentions?.length > 0 || data.negativeMentions?.length > 0 || data.discountMentions?.length > 0 || data.keySources?.length > 0);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Lightbulb className="mr-2 h-6 w-6 text-primary" />
          Phân Tích Thông Tin Từ Web
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
            {[...Array(2)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </>
        ) : hasContent && data ? (
          <>
            {data.overallSummary && (
              <div>
                <h3 className="font-semibold text-lg mb-1 text-foreground/90">Tổng Quan</h3>
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

            {data.discountMentions && data.discountMentions.length > 0 && (
               <div>
                <h3 className="font-semibold text-lg mb-1 flex items-center text-amber-400">
                  <Tag className="mr-2 h-5 w-5" /> Đề Cập Giảm Giá/Khuyến Mãi
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {data.discountMentions.map((mention, index) => (
                    <li key={`discount-${index}`}>{mention}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  (Lưu ý: Đây là thông tin AI tìm thấy từ web, có thể không còn hiệu lực hoặc chưa đầy đủ.)
                </p>
              </div>
            )}
            
            {data.keySources && data.keySources.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center text-foreground/90">
                  <LinkIcon className="mr-2 h-5 w-5" /> Nguồn Tham Khảo Chính
                </h3>
                <div className="space-y-3">
                  {data.keySources.map((source, index) => (
                    <div key={`source-${index}`} className="p-3 border border-border/70 rounded-md bg-card/30">
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center">
                        {source.title} <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
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
          <div className="flex items-center text-muted-foreground p-4 justify-center">
            <Info className="mr-2 h-5 w-5" />
            <span>Không tìm thấy thông tin chi tiết hoặc không thể phân tích cho tìm kiếm này.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
