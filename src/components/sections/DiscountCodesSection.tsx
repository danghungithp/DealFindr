
"use client";

import type { FindDiscountCodesOutput } from "@/ai/flows/discount-hunter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Ticket, Info, Copy, ExternalLink, CalendarClock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';


interface DiscountCodesSectionProps {
  data: FindDiscountCodesOutput | null;
  isLoading: boolean;
}

export function DiscountCodesSection({ data, isLoading }: DiscountCodesSectionProps) {
  const { toast } = useToast();

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Đã sao chép!",
      description: `Mã giảm giá "${code}" đã được sao chép vào bộ nhớ tạm.`,
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: vi });
    } catch (error) {
      return "Không rõ";
    }
  };

  return (
    <Card className="shadow-lg lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Ticket className="mr-2 h-6 w-6 text-primary" />
          Mã Giảm Giá Hiện Có (Shopee)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 border rounded-md">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-8 w-1/4" />
              </div>
            ))}
          </div>
        ) : data?.coupons && data.coupons.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {data.coupons.map((coupon, index) => (
              <div key={index} className="p-3 border border-border rounded-md bg-card/50 group relative">
                <div className="flex justify-between items-start mb-1">
                  <Badge variant="secondary" className="text-base py-1 px-3 font-semibold">
                    {coupon.code}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(coupon.code)}
                    className="h-7 w-7 p-0 opacity-70 group-hover:opacity-100 transition-opacity"
                    aria-label="Sao chép mã"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-foreground/90 mb-1">{coupon.description}</p>
                <p className="text-xs text-muted-foreground mb-2">
                  <span className="font-medium">Ưu đãi:</span> {coupon.offer_name}
                </p>
                 <div className="flex items-center text-xs text-muted-foreground mb-3">
                  <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                  <span>Hết hạn: {formatDate(coupon.end_time)}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground h-8 text-xs"
                  asChild
                >
                  <a href={coupon.aff_link} target="_blank" rel="noopener noreferrer">
                    Sử dụng ngay <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center text-muted-foreground p-4 justify-center">
            <Info className="mr-2 h-5 w-5" />
            <span>Không tìm thấy mã giảm giá nào cho Shopee hiện tại.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
