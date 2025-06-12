"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ExternalLink } from "lucide-react";
import { isValidUrl } from "@/lib/utils"; // Assuming isValidUrl is moved to utils

interface AffiliateLinkSectionProps {
  productNameOrLink: string;
  affiliateBaseUrl: string; // e.g., "https://go.isclix.com/deep_link/..."
}

export function AffiliateLinkSection({ productNameOrLink, affiliateBaseUrl }: AffiliateLinkSectionProps) {
  if (!productNameOrLink) return null;

  let purchaseLink = "#";
  let buttonText = "Search on Shopee"; // Default text

  if (isValidUrl(productNameOrLink)) {
    // Check if it's a Shopee link specifically for tailored message, or generalize
    if (productNameOrLink.includes("shopee.vn")) {
      purchaseLink = `${affiliateBaseUrl}&url=${encodeURIComponent(productNameOrLink)}`;
      buttonText = "Buy on Shopee";
    } else {
      // For other URLs, maybe a generic search or a different affiliate program
      // For now, let's make it a generic search on Shopee with the product name if available
      // This part can be expanded based on specific affiliate strategies
      const extractedName = productNameOrLink.split('/').pop()?.replace(/-/g, ' ').substring(0, 50) || "product";
      purchaseLink = `https://shopee.vn/search?keyword=${encodeURIComponent(extractedName)}`; // Non-affiliate, direct search
      buttonText = `Search "${extractedName}" on Shopee`;
    }
  } else {
    // If it's a product name
    purchaseLink = `https://shopee.vn/search?keyword=${encodeURIComponent(productNameOrLink)}`; // Non-affiliate, direct search
    buttonText = `Search "${productNameOrLink}" on Shopee`;
  }
  
  // If the original input was a Shopee link, prioritize using the affiliate link structure
  if (isValidUrl(productNameOrLink) && productNameOrLink.includes("shopee.vn")) {
     purchaseLink = `${affiliateBaseUrl}&url=${encodeURIComponent(productNameOrLink)}`;
     buttonText = "Buy on Shopee (Support Us!)";
  }


  return (
    <Card className="shadow-lg lg:col-span-2 bg-primary/10 border-primary/30"> {/* Spans 2 columns on lg screens */}
      <CardHeader>
        <CardTitle className="flex items-center text-xl text-primary">
          <ShoppingCart className="mr-2 h-6 w-6" />
          Ready to Buy?
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="mb-4 text-foreground/90">
          Found what you're looking for? Use the link below to make your purchase.
          <br />
          <span className="text-xs text-muted-foreground">(This may be an affiliate link, which helps support DealFindr at no extra cost to you!)</span>
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
