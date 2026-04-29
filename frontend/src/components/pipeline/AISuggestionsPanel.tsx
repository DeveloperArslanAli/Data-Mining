/**
 * Data Mining Platform - AI Suggestions Panel
 *
 * Displays AI-powered suggestions for data cleaning and transformation,
 * integrated with the ML Engine service.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { 
  Sparkles, 
  Lightbulb, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  TrendingUp,
  Target,
  Zap
} from 'lucide-react';
import { CleaningSuggestion, Dataset } from '@/types';
import apiClient from '@/lib/api';

export interface AISuggestionsPanelProps {
  dataset: Dataset;
  onSuggestionApplied: (suggestion: CleaningSuggestion) => void;
  className?: string;
}

const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  dataset,
  onSuggestionApplied,
  className
}) => {
  const [suggestions, setSuggestions] = useState<CleaningSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Track applied suggestions by a derived key (operation + description)
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const getSuggestionKey = (s: CleaningSuggestion) => `${s.operation}-${s.description}`;

  useEffect(() => {
    loadSuggestions();
  }, [dataset.id]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getCleaningSuggestions(dataset.id);
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = async (suggestion: CleaningSuggestion) => {
    try {
      // Mark as applied
  setAppliedSuggestions(prev => new Set(prev).add(getSuggestionKey(suggestion)));
      
      // Notify parent component
      onSuggestionApplied(suggestion);
      
      // Reload suggestions to get updated ones
      await loadSuggestions();
      
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'missing_values':
        return <Target className="h-4 w-4 text-blue-600" />;
      case 'outliers':
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case 'duplicates':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'normalization':
        return <Zap className="h-4 w-4 text-purple-600" />;
      default:
        return <Lightbulb className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getSuggestionBadge = (priority: string) => {
    const variants = {
      high: 'error' as const,
      medium: 'primary' as const,
      low: 'secondary' as const,
    };
    
    return <Badge variant={variants[priority as keyof typeof variants] || 'secondary'}>
      {priority}
    </Badge>;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-3" />
            <span>Analyzing dataset for AI suggestions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No AI suggestions available for this dataset.</p>
            <p className="text-sm text-gray-400 mt-1">
              The ML engine will analyze your data and provide recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-4 text-purple-600" />
          AI-Powered Suggestions
          <Badge variant="secondary" className="ml-2">
            {suggestions.length} recommendations
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Intelligent suggestions for improving data quality and preparing for analysis
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => {
          const key = getSuggestionKey(suggestion);
          return (
          <div
            key={key}
            className={`p-4 border rounded-lg transition-all duration-200 ${
              appliedSuggestions.has(key)
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getSuggestionIcon(suggestion.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{suggestion.description}</h4>
                    {getSuggestionBadge(suggestion.priority)}
                    {appliedSuggestions.has(key) && (
                      <Badge variant="success" className="text-xs">
                        Applied
                      </Badge>
                    )}
                  </div>
                  
                  {/* description already shown as title */}
                  
                  {suggestion.estimated_impact && (
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span>Estimated Impact: {suggestion.estimated_impact}</span>
                      {typeof (suggestion as any).confidence !== 'undefined' && (
                        <span>Confidence: 
                          <span className={getConfidenceColor((suggestion as any).confidence || 0)}>
                            {(suggestion as any).confidence || 0}%
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                  
                  {(suggestion as any).parameters && Object.keys((suggestion as any).parameters).length > 0 && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Parameters:</span>
                      <div className="mt-1 space-y-1">
                        {Object.entries((suggestion as any).parameters).map(([pkey, value]) => (
                          <div key={pkey} className="flex justify-between">
                            <span>{pkey}:</span>
                            <span className="font-mono">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {!appliedSuggestions.has(key) && (
                  <Button
                    size="sm"
                    onClick={() => handleApplySuggestion(suggestion)}
                    className="min-w-[100px]"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Apply
                  </Button>
                )}
                
                {appliedSuggestions.has(key) && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Applied</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )})}
        
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {appliedSuggestions.size} of {suggestions.length} suggestions applied
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSuggestions}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {appliedSuggestions.size > 0 && (
            <div className="mt-3">
              <Progress 
                value={(appliedSuggestions.size / suggestions.length) * 100} 
                className="h-2"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AISuggestionsPanel;