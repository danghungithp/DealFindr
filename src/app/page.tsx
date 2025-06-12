
"use client";

import { useState } from "react";
import { ProductSearchForm } from "@/components/ProductSearchForm";
import { ProductSummarySection } from "@/components/sections/ProductSummarySection";
import { PriceComparisonSection } from "@/components/sections/PriceComparisonSection";
import { DiscountCodesSection } from "@/components/sections/DiscountCodesSection";
import { SocialSentimentSection } from "@/components/sections/SocialSentimentSection";
import { AffiliateLinkSection } from "@/components/sections/AffiliateLinkSection";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { analyzeSocialSentiment, type SocialSentimentOutput } from "@/ai/flows/social-sentiment-analysis";
import { priceComparison, type PriceComparisonOutput } from "@/ai/flows/price-comparison";
import { summarizeProduct, type ProductSummaryOutput } from "@/ai/flows/product-summarization";
import { findDiscountCodes, type FindDiscountCodesOutput } from "@/ai/flows/discount-hunter";

import { useToast } from "@/hooks/use-toast";
import { Search as SearchIcon } from "lucide-react"; 
import { isValidUrl as checkIsValidUrl } from "@/lib/utils";


export default function HomePage() {
  const [productSearchTerm, setProductSearchTerm] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [priceComparisonData, setPriceComparisonData] = useState<PriceComparisonOutput | null>(null);
  const [productSummaryData, setProductSummaryData] = useState<ProductSummaryOutput | null>(null);
  const [discountCodesData, setDiscountCodesData] = useState<FindDiscountCodesOutput | null>(null);
  const [socialSentimentData, setSocialSentimentData] = useState<SocialSentimentOutput | null>(null);
  
  const { toast } = useToast();

  const handleSearch = async (searchTerm: string) => {
    setProductSearchTerm(searchTerm);
    setIsLoading(true);
    setError(null);
    setPriceComparisonData(null);
    setProductSummaryData(null);
    setDiscountCodesData(null);
    setSocialSentimentData(null);

    const isUrl = checkIsValidUrl(searchTerm);

    // For DiscountCodes, productName is passed but currently the flow fetches generic Shopee codes.
    const operations = [
      {
        name: "Social Sentiment",
        name_vi: "Đánh giá từ cộng đồng",
        fn: () => analyzeSocialSentiment({ productIdentifier: searchTerm }),
        setData: setSocialSentimentData,
        condition: true,
      },
      {
        name: "Discount Codes",
        name_vi: "Mã giảm giá (Shopee)",
        fn: () => findDiscountCodes({ productName: searchTerm }), // searchTerm can be used later if API supports product-specific codes or other domains
        setData: setDiscountCodesData,
        condition: true, 
      },
      {
        name: "Product Summary",
        name_vi: "Tóm tắt sản phẩm",
        fn: () => summarizeProduct({ productUrl: searchTerm }),
        setData: setProductSummaryData,
        condition: isUrl,
      },
      {
        name: "Price Comparison",
        name_vi: "So sánh giá",
        fn: () => priceComparison({ productLink: searchTerm }),
        setData: setPriceComparisonData,
        condition: isUrl,
      },
    ];

    await Promise.all(
      operations.map(async (op) => {
        if (op.condition) {
          try {
            const result = await op.fn();
            op.setData(result as any); 
          } catch (e: any) {
            console.error(`${op.name} Error:`, e);
            toast({
              variant: "destructive",
              title: `Lỗi khi lấy ${op.name_vi}`,
              description: e.message || "Đã xảy ra lỗi không mong muốn.",
            });
            // Ensure data is reset on error for the specific operation
            op.setData(null);
          }
        } else {
          // If condition is false, ensure data is reset (e.g. product summary for non-URL input)
          op.setData(null); 
        }
      })
    );

    setIsLoading(false);
  };


  const isUrlInput = checkIsValidUrl(productSearchTerm);

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col">
      <header className="text-center my-8 md:my-12">
        <h1 className="text-5xl md:text-6xl font-bold text-primary font-headline tracking-tight">
          DealFindr
        </h1>
        <p className="text-muted-foreground mt-3 text-lg md:text-xl">
          Trợ lý mua sắm thông minh của bạn cho những ưu đãi và thông tin tốt nhất.
        </p>
      </header>

      <main className="flex-grow">
        <ProductSearchForm onSearch={handleSearch} isLoading={isLoading} />

        {error && (
          <Alert variant="destructive" className="mt-6 max-w-2xl mx-auto">
            <AlertTitle>Lỗi Tìm Kiếm</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!productSearchTerm && !isLoading && (
          <div className="text-center text-muted-foreground mt-16 animate-fadeIn">
            <SearchIcon className="mx-auto h-20 w-20 mb-6 text-primary/70" strokeWidth={1.5} />
            <p className="text-2xl font-medium">Khám Phá Thông Tin Sản Phẩm</p>
            <p className="text-lg">Nhập tên sản phẩm hoặc liên kết ở trên để bắt đầu!</p>
          </div>
        )}

        {/* This condition seems redundant if the one below handles productSearchTerm presence */}
        {/* {isLoading && !productSearchTerm && ( 
            <div className="flex justify-center items-center mt-16">
                <LoadingSpinner size={48} />
            </div>
        )} */}


        {productSearchTerm && (
          <div className="mt-10 space-y-6">
            {isLoading && ( // Show general loading spinner when any data is being fetched for a searched term
                <div className="flex justify-center items-center py-10">
                    <LoadingSpinner size={48} />
                    <p className="ml-4 text-lg text-muted-foreground">Đang tổng hợp dữ liệu...</p>
                </div>
            )}
            {/* Grid for displaying results once search is initiated and loading might be partial */}
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {/* Product Summary: show skeleton if URL was valid, attempted, and still loading */}
              <ProductSummarySection data={productSummaryData} isLoading={isLoading && isUrlInput && !productSummaryData} attempted={isUrlInput} />
              {/* Price Comparison: show skeleton if URL was valid, attempted, and still loading */}
              <PriceComparisonSection data={priceComparisonData} isLoading={isLoading && isUrlInput && !priceComparisonData} attempted={isUrlInput} />
              {/* Discount Codes: always attempt, show skeleton if loading */}
              <DiscountCodesSection data={discountCodesData} isLoading={isLoading && !discountCodesData} />
              {/* Social Sentiment: always attempt, show skeleton if loading */}
              <SocialSentimentSection data={socialSentimentData} isLoading={isLoading && !socialSentimentData} />
              {/* Affiliate Link Section always shows if productSearchTerm is present */}
              <AffiliateLinkSection productNameOrLink={productSearchTerm} />
            </div>
          </div>
        )}
      </main>
      <footer className="text-center py-8 mt-12 border-t">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} DealFindr. Bảo lưu mọi quyền.
        </p>
      </footer>
    </div>
  );
}

