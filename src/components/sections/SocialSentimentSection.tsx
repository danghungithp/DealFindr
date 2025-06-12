"use client";

import type { SocialSentimentOutput } from "@/ai/flows/social-sentiment-analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, ThumbsUp, ThumbsDown, Info } from "lucide-react";

interface SocialSentimentSectionProps {
  data: SocialSentimentOutput | null;
  isLoading: boolean;
}

export function SocialSentimentSection({ data, isLoading }: SocialSentimentSectionProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <MessageCircle className="mr-2 h-6 w-6 text-primary" />
          Xu Hướng Mạng Xã Hội
        </CardTitle>
        {data?.sentimentSummary && !isLoading && (
            <CardDescription>{data.sentimentSummary}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div>
                <Skeleton className="h-6 w-1/4 mb-2 mt-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
            <div>
                <Skeleton className="h-6 w-1/4 mb-2 mt-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
          </>
        ) : data ? (
          <>
            {data.sentimentSummary && !data.positiveHighlights && !data.negativeHighlights && (
                 <p className="text-foreground/90 whitespace-pre-line">{data.sentimentSummary}</p>
            )}
            {data.positiveHighlights && (
              <div>
                <h3 className="font-semibold flex items-center text-green-400 mb-1">
                  <ThumbsUp className="mr-2 h-5 w-5" />
                  Phản Hồi Tích Cực
                </h3>
                <p className="text-sm text-foreground/80 whitespace-pre-line">{data.positiveHighlights}</p>
              </div>
            )}
            {data.negativeHighlights && (
              <div>
                <h3 className="font-semibold flex items-center text-red-400 mb-1">
                  <ThumbsDown className="mr-2 h-5 w-5" />
                  Phản Hồi Tiêu Cực
                </h3>
                <p className="text-sm text-foreground/80 whitespace-pre-line">{data.negativeHighlights}</p>
              </div>
            )}
            {!data.sentimentSummary && !data.positiveHighlights && !data.negativeHighlights && (
                 <div className="flex items-center text-muted-foreground">
                    <Info className="mr-2 h-5 w-5" />
                    <span>Không có dữ liệu đánh giá từ cộng đồng cho sản phẩm này.</span>
                 </div>
            )}
          </>
        ) : (
          <div className="flex items-center text-muted-foreground">
            <Info className="mr-2 h-5 w-5" />
            <span>Không có dữ liệu đánh giá từ cộng đồng cho sản phẩm này.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
