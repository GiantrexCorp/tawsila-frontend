/**
 * Reusable Filter Bar Component
 */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { X, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'text' | 'number' | 'tags' | 'daterange';
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterBarProps {
  filters: Record<string, string>;
  filterConfigs: FilterConfig[];
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: (e?: React.MouseEvent) => void;
  onClearAllFilters?: (e?: React.MouseEvent) => void;
  onApplyFilters?: (e?: React.MouseEvent) => void;
  onRemoveFilter?: (key: string) => void;
  defaultFilters?: string[];
}

export function FilterBar({
  filters,
  filterConfigs,
  onFilterChange,
  onClearFilters,
  onClearAllFilters,
  onApplyFilters,
  onRemoveFilter,
  defaultFilters = [],
}: FilterBarProps) {
  const t = useTranslations('common');
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [tagInputs, setTagInputs] = React.useState<Record<string, string>>({});
  const [tags, setTags] = React.useState<Record<string, string[]>>({});
  const [dateRanges, setDateRanges] = React.useState<Record<string, { start: string; end: string }>>({});
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>(defaultFilters);
  
  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;
  
  const hasActiveFilters = activeFiltersCount > 0;

  // Get available filters (not yet selected)
  const availableFilters = filterConfigs.filter(
    config => !selectedFilters.includes(config.key)
  );

  // Initialize tags and date ranges from filter values
  React.useEffect(() => {
    const newTags: Record<string, string[]> = {};
    
    filterConfigs.forEach(config => {
      if (config.type === 'tags' && filters[config.key]) {
        newTags[config.key] = filters[config.key].split(',').filter(v => v.trim() !== '');
      }
    });
    
    setTags(newTags);
  }, [filters, filterConfigs]);

  // Separate effect for date ranges to avoid circular dependencies
  React.useEffect(() => {
    setDateRanges(prev => {
      const newDateRanges = { ...prev };
      
      filterConfigs.forEach(config => {
        if (config.type === 'daterange') {
          if (filters[config.key]) {
            const [start, end] = filters[config.key].split(',');
            newDateRanges[config.key] = { 
              start: start || '', 
              end: end || '' 
            };
          } else if (!prev[config.key]) {
            newDateRanges[config.key] = { start: '', end: '' };
          }
        }
      });
      
      return newDateRanges;
    });
  }, [filters, filterConfigs]);

  const handleAddTag = (key: string) => {
    const inputValue = tagInputs[key]?.trim();
    if (!inputValue) return;

    const currentTags = tags[key] || [];
    if (currentTags.includes(inputValue)) {
      setTagInputs(prev => ({ ...prev, [key]: '' }));
      return;
    }

    const newTags = [...currentTags, inputValue];
    setTags(prev => ({ ...prev, [key]: newTags }));
    onFilterChange(key, newTags.join(','));
    setTagInputs(prev => ({ ...prev, [key]: '' }));
  };

  const handleRemoveTag = (key: string, tagToRemove: string) => {
    const currentTags = tags[key] || [];
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    setTags(prev => ({ ...prev, [key]: newTags }));
    onFilterChange(key, newTags.join(','));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(key);
    }
  };

  const handleDateRangeChange = React.useCallback((key: string, field: 'start' | 'end', value: string) => {
    setDateRanges(prev => {
      const currentRange = prev[key] || { start: '', end: '' };
      const newRange = { ...currentRange, [field]: value };
      
      // Update filter if both dates are set
      if (newRange.start && newRange.end) {
        onFilterChange(key, `${newRange.start},${newRange.end}`);
      } else if (!newRange.start && !newRange.end) {
        // Clear filter if both dates are empty
        onFilterChange(key, '');
      }
      // Don't clear the filter if only one date is set, wait for the other
      
      return { ...prev, [key]: newRange };
    });
  }, [onFilterChange]);

  const renderFilter = (config: FilterConfig) => {
    const value = filters[config.key] || '';

    if (config.type === 'daterange') {
      const range = dateRanges[config.key] || { start: '', end: '' };

      return (
        <div key={config.key} className="space-y-2">
          <Label className="text-sm font-medium leading-none mb-2 block">{config.label}</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${config.key}-start`} className="text-xs font-normal text-muted-foreground">
                {t('from')}
              </Label>
              <Input
                id={`${config.key}-start`}
                type="date"
                value={range.start}
                onChange={(e) => handleDateRangeChange(config.key, 'start', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${config.key}-end`} className="text-xs font-normal text-muted-foreground">
                {t('to')}
              </Label>
              <Input
                id={`${config.key}-end`}
                type="date"
                value={range.end}
                onChange={(e) => handleDateRangeChange(config.key, 'end', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      );
    }

    if (config.type === 'tags') {
      const currentTags = tags[config.key] || [];
      const inputValue = tagInputs[config.key] || '';

      return (
        <div key={config.key} className="space-y-2">
          <Label htmlFor={config.key} className="text-sm font-medium leading-none mb-2 block">
            {config.label}
          </Label>
          <Input
            id={config.key}
            type="text"
            placeholder={config.placeholder}
            value={inputValue}
            onChange={(e) => setTagInputs(prev => ({ ...prev, [config.key]: e.target.value }))}
            onKeyDown={(e) => handleTagInputKeyDown(e, config.key)}
            className="w-full"
          />
          {currentTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {currentTags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="gap-1 px-2.5 py-1">
                  <span className="text-sm">{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(config.key, tag)}
                    className="hover:text-destructive ms-1"
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (config.type === 'select' && config.options) {
      return (
        <div key={config.key} className="space-y-2">
          <Label htmlFor={config.key} className="text-sm font-medium leading-none mb-2 block">
            {config.label}
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-10">
                {value ? config.options.find(opt => opt.value === value)?.label : config.placeholder || t('select')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full min-w-[200px]">
              <DropdownMenuLabel>{config.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {config.options.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onFilterChange(config.key, option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
              {value && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onFilterChange(config.key, '')}>
                    {t('clear')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    if (config.type === 'text' || config.type === 'number') {
      return (
        <div key={config.key} className="space-y-2">
          <Label htmlFor={config.key} className="text-sm font-medium leading-none mb-2 block">
            {config.label}
          </Label>
          <Input
            id={config.key}
            type={config.type}
            placeholder={config.placeholder}
            value={value}
            onChange={(e) => onFilterChange(config.key, e.target.value)}
            className="w-full h-10"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {t('filters')}
          {hasActiveFilters && (
            <Badge variant="secondary" className="ms-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Use onClearAllFilters if provided, otherwise fallback to onClearFilters
              if (onClearAllFilters) {
                onClearAllFilters(e);
              } else {
                onClearFilters(e);
              }
            }}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            {t('clearAll')}
          </Button>
        )}
      </div>

      {/* Active Filters Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filterConfigs.map((config) => {
            const value = filters[config.key];
            if (!value) return null;

            const displayValue = config.options
              ? config.options.find(opt => opt.value === value)?.label
              : value;

            return (
              <Badge key={config.key} variant="secondary" className="gap-1 px-3 py-1">
                <span className="text-xs">
                  {config.label}: {displayValue}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (onRemoveFilter) {
                      // Remove filter AND fetch data
                      onRemoveFilter(config.key);
                    } else {
                      // Fallback: just update local state
                      onFilterChange(config.key, '');
                    }
                  }}
                  className="ms-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <Card>
          <CardContent className="p-6">
            {/* Add Filter Dropdown */}
            <div className="mb-6 flex items-center gap-2">
              <span className="text-sm font-medium">{t('addFilter')}:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" type="button">
                    + {t('addFilter')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>{t('selectFilter')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableFilters.map((config) => (
                    <DropdownMenuItem
                      key={config.key}
                      onClick={() => {
                        setSelectedFilters(prev => [...prev, config.key]);
                      }}
                    >
                      {config.label}
                    </DropdownMenuItem>
                  ))}
                  {availableFilters.length === 0 && (
                    <DropdownMenuItem disabled>
                      {t('allFiltersAdded')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Active Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
              {filterConfigs
                .filter(config => selectedFilters.includes(config.key))
                .map((config) => (
                  <div key={config.key} className="relative">
                    {renderFilter(config)}
                    {/* Remove filter button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFilters(prev => prev.filter(k => k !== config.key));
                        onFilterChange(config.key, '');
                      }}
                      className="absolute top-0 end-0 text-muted-foreground hover:text-destructive"
                      title="Remove this filter"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
            </div>
            {onApplyFilters && (
              <div className="mt-8 pt-6 border-t flex items-center justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClearFilters(e);
                  }}
                  className="min-w-[100px]"
                >
                  {t('clear')}
                </Button>
                <Button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onApplyFilters?.(e);
                  }}
                  className="min-w-[100px]"
                >
                  {t('apply')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

