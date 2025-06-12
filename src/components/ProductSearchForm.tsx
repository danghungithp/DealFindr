"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

interface ProductSearchFormProps {
  onSearch: (searchTerm: string) => void;
  isLoading: boolean;
}

export function ProductSearchForm({ onSearch, isLoading }: ProductSearchFormProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl mx-auto space-x-2 mb-8">
      <Input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Enter product name or link (e.g., Shopee, Lazada)..."
        className="flex-grow text-base"
        disabled={isLoading}
        aria-label="Product search input"
      />
      <Button type="submit" disabled={isLoading || !searchTerm.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground px-6">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Search className="h-5 w-5 mr-2" />
        )}
        Search
      </Button>
    </form>
  );
}
