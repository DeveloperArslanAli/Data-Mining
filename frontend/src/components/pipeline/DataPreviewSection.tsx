/**
 * Data Mining Platform - Data Preview Section
 *
 * Displays dataset preview (sample rows, columns) and quality metrics,
 * with actions to proceed to cleaning.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { BarChart3, Database, Eye, RefreshCw, LayoutGrid } from 'lucide-react';
import apiClient from '@/lib/api';
import { Dataset, QualityReport } from '@/types';

export interface DataPreviewSectionProps {
  dataset: Dataset;
  onNext: () => void;
  className?: string;
}

const DataPreviewSection: React.FC<DataPreviewSectionProps> = ({ dataset, onNext, className }) => {
  const [sample, setSample] = useState<any[]>([]);
  const [quality, setQuality] = useState<QualityReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const [preview, qualityReport] = await Promise.all([
          apiClient.previewDataset(dataset.id, 10),
          apiClient.getQualityReport(dataset.id)
        ]);
        if (!mounted) return;
        setSample(Array.isArray(preview?.rows) ? preview.rows : (preview || []));
        setQuality(qualityReport);
      } catch (e) {
        // errors are handled by api client toasts
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [dataset.id]);

  const columns = useMemo(() => {
    const first = sample?.[0];
    return first
      ? Object.keys(first).map((key) => ({
          key,
          header: key,
          accessor: (row: any) => {
            const value = row[key];
            if (value === null || value === undefined) return '—';
            if (typeof value === 'object') return JSON.stringify(value).slice(0, 60);
            return String(value);
          },
        }))
      : [];
  }, [sample]);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Preview Dataset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-gray-500">Rows</div>
              <div className="text-lg font-semibold">{dataset.row_count ?? '—'}</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-gray-500">Columns</div>
              <div className="text-lg font-semibold">{dataset.column_count ?? (columns.length || '—')}</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-gray-500">Format</div>
              <div className="text-lg font-semibold">{dataset.format}</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-xs text-gray-500">Status</div>
              <div className="text-lg font-semibold">
                <Badge variant="default">{dataset.status}</Badge>
              </div>
            </div>
          </div>

          {/* Sample table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <LayoutGrid className="h-4 w-4" />
                <span className="text-sm font-medium">Sample rows (10)</span>
              </div>
              {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
            </div>
            {sample && sample.length > 0 ? (
              <Table
                columns={columns}
                data={sample}
              />
            ) : (
              <div className="p-6 text-sm text-gray-500 border rounded-lg text-center">
                No preview available.
              </div>
            )}
          </div>

          {/* Quality metrics */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Data quality</span>
            </div>
            {quality ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-gray-500">Completeness</div>
                  <Progress value={quality?.quality_score ?? 0} className="h-2 mt-2" />
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-gray-500">Missing values</div>
                  <div className="text-lg font-semibold">{Object.keys(quality.missing_values || {}).length}</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-gray-500">Duplicates</div>
                  <div className="text-lg font-semibold">{quality.duplicate_rows}</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-gray-500">Columns</div>
                  <div className="text-lg font-semibold">{quality.total_columns}</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-gray-500">Rows</div>
                  <div className="text-lg font-semibold">{quality.total_rows}</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-gray-500">Score</div>
                  <div className="text-lg font-semibold">{Math.round(quality.quality_score)}%</div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-sm text-gray-500 border rounded-lg text-center">
                {isLoading ? 'Loading quality report...' : 'No quality report available.'}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end">
            <Button onClick={onNext} disabled={isLoading}>
              Proceed to Cleaning
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataPreviewSection;
