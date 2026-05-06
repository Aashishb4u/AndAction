/**
 * Artist Type Mapping Utility
 * Maps query types to actual database artistType values
 * Shared across all artist API endpoints
 */

import { prisma } from "./prisma";

// Cache for artist categories to avoid repeated DB calls
let artistCategoriesCache: Array<{ value: string; label: string }> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getArtistCategories(): Promise<Array<{ value: string; label: string }>> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (artistCategoriesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return artistCategoriesCache;
  }

  try {
    const categories = await prisma.artist_categories.findMany({
      where: { isActive: true },
      select: { value: true, label: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });

    artistCategoriesCache = categories;
    cacheTimestamp = now;
    return categories;
  } catch (error) {
    console.error("Failed to fetch artist categories:", error);
    // Return empty array as fallback
    return [];
  }
}

export async function getArtistTypeMatches(queryType: string): Promise<string[]> {
  const categories = await getArtistCategories();
  
  // If no categories found, fallback to the query type itself
  if (categories.length === 0) {
    return [queryType.trim()];
  }

  const normalizedQuery = queryType.trim().toLowerCase();
  
  // Find exact matches first
  const exactMatches = categories.filter(
    cat => cat.value.toLowerCase() === normalizedQuery || 
           cat.label.toLowerCase() === normalizedQuery
  );
  
  if (exactMatches.length > 0) {
    return exactMatches.map(cat => cat.value);
  }

  // Find partial matches
  const partialMatches = categories.filter(
    cat => cat.value.toLowerCase().includes(normalizedQuery) || 
           cat.label.toLowerCase().includes(normalizedQuery)
  );
  
  if (partialMatches.length > 0) {
    return partialMatches.map(cat => cat.value);
  }

  // If no matches found, return the original query
  return [queryType.trim()];
}

// Synchronous version for backward compatibility
// This uses cached data or returns the query as fallback
export function getArtistTypeMatchesSync(queryType: string): string[] {
  if (!artistCategoriesCache || (Date.now() - cacheTimestamp) >= CACHE_DURATION) {
    // No cache available, return query as fallback
    return [queryType.trim()];
  }

  const normalizedQuery = queryType.trim().toLowerCase();
  
  // Find exact matches first
  const exactMatches = artistCategoriesCache.filter(
    cat => cat.value.toLowerCase() === normalizedQuery || 
           cat.label.toLowerCase() === normalizedQuery
  );
  
  if (exactMatches.length > 0) {
    return exactMatches.map(cat => cat.value);
  }

  // Find partial matches
  const partialMatches = artistCategoriesCache.filter(
    cat => cat.value.toLowerCase().includes(normalizedQuery) || 
           cat.label.toLowerCase().includes(normalizedQuery)
  );
  
  if (partialMatches.length > 0) {
    return partialMatches.map(cat => cat.value);
  }

  // If no matches found, return the original query
  return [queryType.trim()];
}
