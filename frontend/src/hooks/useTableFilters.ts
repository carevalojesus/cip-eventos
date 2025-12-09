import { useState, useMemo, useCallback, useEffect } from "react";

/**
 * Filter configuration for a single filter
 */
export interface FilterConfig<T> {
  key: string;
  defaultValue: T;
  filterFn?: (item: unknown, value: T) => boolean;
}

/**
 * Filter state type
 */
export type FilterState = Record<string, string | number | boolean>;

/**
 * useTableFilters - A reusable hook for managing table filters and search
 *
 * @example
 * ```tsx
 * const {
 *   searchQuery,
 *   setSearchQuery,
 *   filters,
 *   setFilter,
 *   filteredItems,
 *   clearFilters,
 *   hasActiveFilters
 * } = useTableFilters({
 *   items: users,
 *   searchFields: ['email', 'name', 'profile.firstName'],
 *   filterConfigs: [
 *     { key: 'role', defaultValue: 'all' },
 *     { key: 'status', defaultValue: 'all' }
 *   ]
 * });
 * ```
 */
export interface UseTableFiltersOptions<T> {
  items: T[];
  searchFields: string[];
  filterConfigs?: FilterConfig<string | number | boolean>[];
  customFilter?: (item: T, searchQuery: string, filters: FilterState) => boolean;
}

export interface UseTableFiltersReturn<T> {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: FilterState;
  setFilter: (key: string, value: string | number | boolean) => void;
  filteredItems: T[];
  clearFilters: () => void;
  hasActiveFilters: boolean;
  resetFilters: () => void;
}

/**
 * Get nested value from object using dot notation
 * e.g., getNestedValue(user, 'profile.firstName') => user.profile.firstName
 */
function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce((current: unknown, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function useTableFilters<T>({
  items,
  searchFields,
  filterConfigs = [],
  customFilter,
}: UseTableFiltersOptions<T>): UseTableFiltersReturn<T> {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Build initial filter state from configs
  const initialFilters = useMemo(() => {
    const state: FilterState = {};
    filterConfigs.forEach((config) => {
      state[config.key] = config.defaultValue;
    });
    return state;
  }, [filterConfigs]);

  // Filter state
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Set individual filter
  const setFilter = useCallback((key: string, value: string | number | boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setFilters(initialFilters);
  }, [initialFilters]);

  // Reset to initial state
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    if (searchQuery.trim() !== "") return true;

    return filterConfigs.some((config) => {
      const currentValue = filters[config.key];
      return currentValue !== config.defaultValue;
    });
  }, [searchQuery, filters, filterConfigs]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Custom filter takes precedence
      if (customFilter) {
        return customFilter(item, searchQuery, filters);
      }

      // Default search filter
      const matchesSearch =
        searchQuery.trim() === "" ||
        searchFields.some((field) => {
          const value = getNestedValue(item, field);
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchQuery.toLowerCase());
          }
          return false;
        });

      // Apply filter configs
      const matchesFilters = filterConfigs.every((config) => {
        const filterValue = filters[config.key];

        // Skip if filter is at default value (usually 'all')
        if (filterValue === config.defaultValue) return true;

        // Use custom filter function if provided
        if (config.filterFn) {
          return config.filterFn(item, filterValue);
        }

        // Default: match field value to filter value
        const itemValue = getNestedValue(item, config.key);
        return itemValue === filterValue;
      });

      return matchesSearch && matchesFilters;
    });
  }, [items, searchQuery, filters, searchFields, filterConfigs, customFilter]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    filteredItems,
    clearFilters,
    hasActiveFilters,
    resetFilters,
  };
}

export default useTableFilters;
