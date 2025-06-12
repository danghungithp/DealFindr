
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ExternalLink } from "lucide-react";
import { isValidUrl } from "@/lib/utils";

interface AffiliateLinkSectionProps {
  productNameOrLink: string;
}

export function AffiliateLinkSection({ productNameOrLink }: AffiliateLinkSectionProps) {
  if (!productNameOrLink) return null;

  const affiliatePrefix = "https://go.isclix.com/deep_link/4725587962428837650";
  const utmParameters = "utm_source=<utm_source>&utm_medium=<utm_medium>&utm_campaign=<utm_campaign>&utm_content=<utm_content>";
  const sub4Parameter = "sub4=oneatweb";

  let targetShopeeUrl: string;
  let buttonText: string;

  if (isValidUrl(productNameOrLink)) {
    if (productNameOrLink.includes("shopee.vn") || productNameOrLink.includes("s.shopee.vn")) {
      targetShopeeUrl = productNameOrLink;
      buttonText = "Mua trên Shopee (Ủng hộ DealFindr!)";
    } else {
      // For other URLs, create a search link on Shopee
      // Extract a cleaner name: remove query params, common web extensions, replace hyphens/underscores with spaces
      const generalUrlParts = productNameOrLink.split('/');
      const lastPart = generalUrlParts[generalUrlParts.length - 1] || "product";
      const cleanedName = lastPart.split('?')[0]
                                 .replace(/\.(html|php|aspx?|jsp|asp)$/i, '')
                                 .replace(/[-_]/g, ' ')
                                 .replace(/\s+/g, ' ') // Normalize multiple spaces
                                 .substring(0, 70) // Limit length
                                 .trim();
      const extractedName = cleanedName || "product";
      targetShopeeUrl = `https://shopee.vn/search?keyword=${encodeURIComponent(extractedName)}`;
      buttonText = `Tìm "${extractedName}" trên Shopee (Ủng hộ DealFindr!)`;
    }
  } else {
    // If it's a product name
    const cleanedProductName = productNameOrLink.replace(/\s+/g, ' ').trim().substring(0, 70);
    targetShopeeUrl = `https://shopee.vn/search?keyword=${encodeURIComponent(cleanedProductName)}`;
    buttonText = `Tìm "${cleanedProductName}" trên Shopee (Ủng hộ DealFindr!)`;
  }

  const purchaseLink = `${affiliatePrefix}?url=${encodeURIComponent(targetShopeeUrl)}&${utmParameters}&${sub4Parameter}`;

  return (
    <Card className="shadow-lg lg:col-span-2 bg-primary/10 border-primary/30"> {/* Spans 2 columns on lg screens */}
      <CardHeader>
        <CardTitle className="flex items-center text-xl text-primary">
          <ShoppingCart className="mr-2 h-6 w-6" />
          Sẵn sàng mua sắm?
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="mb-4 text-foreground/90">
          Tìm thấy sản phẩm bạn cần? Sử dụng liên kết bên dưới để mua hàng trên Shopee.
          <br />
          <span className="text-xs text-muted-foreground">(Điều này giúp hỗ trợ DealFindr mà không tốn thêm chi phí nào cho bạn!)</span>
        </p>
        <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
          <a href={purchaseLink} target="_blank" rel="noopener noreferrer">
            {buttonText}
            <ExternalLink className="ml-2 h-5 w-5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
