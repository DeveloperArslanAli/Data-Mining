/**
 * Data Mining Platform - TypeScript Types
 */

// User Types
export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export enum UserRole {
  ADMIN = "admin",
  DATA_SCIENTIST = "data_scientist",
  BUSINESS_ANALYST = "business_analyst",
  RESEARCHER = "researcher"
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  role?: UserRole;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// Dataset Types
export interface Dataset {
  id: number;
  name: string;
  description?: string;
  filename: string;
  file_path: string;
  file_size: number;
  format: DatasetFormat;
  row_count?: number;
  column_count?: number;
  column_names?: string[];
  data_types?: Record<string, string>;
  sample_data?: Record<string, any>[];
  status: DatasetStatus;
  processing_progress: number;
  error_message?: string;
  missing_values_count?: Record<string, number>;
  duplicate_rows_count?: number;
  outlier_count?: Record<string, number>;
  created_at: string;
  updated_at?: string;
  processed_at?: string;
  owner_id: number;
}

export enum DatasetStatus {
  UPLOADED = "uploaded",
  PROCESSING = "processing",
  CLEANED = "cleaned",
  ERROR = "error",
  EXPORTED = "exported"
}

export enum DatasetFormat {
  CSV = "csv",
  JSON = "json",
  XML = "xml",
  XLSX = "xlsx",
  PARQUET = "parquet"
}

export interface DatasetList {
  datasets: Dataset[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface DatasetUploadResponse {
  dataset: Dataset;
  message: string;
  processing_started: boolean;
}

// Cleaning Operation Types
export interface CleaningOperation {
  id: number;
  name: string;
  description?: string;
  operation_type: CleaningOperationType;
  parameters?: Record<string, any>;
  target_columns?: string[];
  status: CleaningOperationStatus;
  progress: number;
  error_message?: string;
  rows_affected?: number;
  rows_removed?: number;
  rows_modified?: number;
  quality_improvement?: Record<string, any>;
  processing_time?: number;
  memory_usage?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  updated_at?: string;
  dataset_id: number;
  user_id: number;
}

export enum CleaningOperationType {
  REMOVE_DUPLICATES = "remove_duplicates",
  HANDLE_MISSING_VALUES = "handle_missing_values",
  REMOVE_OUTLIERS = "remove_outliers",
  DATA_TYPE_CONVERSION = "data_type_conversion",
  STRING_CLEANING = "string_cleaning",
  NORMALIZATION = "normalization",
  ENCODING = "encoding",
  CUSTOM_TRANSFORMATION = "custom_transformation"
}

export enum CleaningOperationStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled"
}

export interface CleaningSuggestion {
  type: string;
  operation: CleaningOperationType;
  description: string;
  columns?: string[];
  priority: "high" | "medium" | "low";
  estimated_impact?: string;
}

// Export Job Types
export interface ExportJob {
  id: number;
  name: string;
  description?: string;
  export_format: ExportFormat;
  file_path?: string;
  file_size?: number;
  include_headers?: string[];
  exclude_headers?: string[];
  filters?: Record<string, any>;
  sorting?: Record<string, any>;
  limit_rows?: number;
  database_schema?: string;
  table_name?: string;
  status: ExportJobStatus;
  progress: number;
  error_message?: string;
  rows_exported?: number;
  columns_exported?: number;
  processing_time?: number;
  memory_usage?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  updated_at?: string;
  dataset_id: number;
  user_id: number;
}

export enum ExportFormat {
  CSV = "csv",
  JSON = "json",
  XML = "xml",
  XLSX = "xlsx",
  PARQUET = "parquet",
  SQL = "sql"
}

export enum ExportJobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled"
}

export interface ExportFormatInfo {
  value: ExportFormat;
  label: string;
  description: string;
}

// Crawling Types
export interface CrawlingJob {
  id: string;
  status: string;
  urls: string[];
  max_depth: number;
  max_pages: number;
  pages_crawled: number;
  data_extracted: boolean;
  created_at: string;
  completed_at?: string;
}

export interface CrawlingSettings {
  max_depth: {
    default: number;
    min: number;
    max: number;
    description: string;
  };
  max_pages: {
    default: number;
    min: number;
    max: number;
    description: string;
  };
  delay: {
    default: number;
    min: number;
    max: number;
    description: string;
  };
  user_agent: {
    default: string;
    description: string;
  };
  timeout: {
    default: number;
    min: number;
    max: number;
    description: string;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// UI Types
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface TableSort {
  key: string;
  direction: "asc" | "desc";
}

export interface TableFilter {
  key: string;
  value: any;
  operator: "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "contains" | "in";
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "select" | "textarea" | "file" | "checkbox" | "radio";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// Chart Types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

// File Upload Types
export interface FileUploadConfig {
  maxSize: number; // in bytes
  allowedTypes: string[];
  multiple?: boolean;
  accept?: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Theme Types
export interface Theme {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

// App State Types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  theme: Theme;
  notifications: Notification[];
  sidebarCollapsed: boolean;
}

// API Error Types
export interface ApiError {
  status: number;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Search and Filter Types
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: TableSort;
  page?: number;
  size?: number;
}

// Dashboard Types
export interface DashboardStats {
  totalDatasets: number;
  totalOperations: number;
  totalExports: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: "dataset_upload" | "cleaning_operation" | "export_job" | "crawling_job";
  title: string;
  description: string;
  timestamp: string;
  status: string;
  user: User;
}

// Quality Report Types
export interface QualityReport {
  dataset_id: number;
  total_rows: number;
  total_columns: number;
  missing_values: Record<string, number>;
  duplicate_rows: number;
  outliers: Record<string, number>;
  quality_score: number;
  recommendations: string[];
  generated_at: string;
}

// Analytics and Visualization Types
export interface StatisticalSummary {
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  q25: number;
  q50: number;
  q75: number;
  skewness: number;
  kurtosis: number;
}

export interface CorrelationMatrix {
  columns: string[];
  matrix: number[][];
  significant_correlations: Array<{
    column1: string;
    column2: string;
    correlation: number;
    p_value: number;
    significance: 'high' | 'medium' | 'low';
  }>;
}

export interface DistributionData {
  column: string;
  data_type: 'numeric' | 'categorical' | 'datetime';
  bins?: Array<{
    bin: string;
    count: number;
    percentage: number;
  }>;
  categories?: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  outliers?: Array<{
    value: number;
    index: number;
    z_score: number;
  }>;
}

export interface DataQualityMetrics {
  completeness: number; // percentage of non-null values
  accuracy: number; // percentage of valid values
  consistency: number; // percentage of consistent data types
  uniqueness: number; // percentage of unique values
  validity: number; // percentage of values within expected ranges
  overall_score: number; // weighted average of all metrics
}

export interface OutlierAnalysis {
  column: string;
  method: 'z_score' | 'iqr' | 'isolation_forest' | 'local_outlier_factor';
  outliers: Array<{
    index: number;
    value: number;
    score: number;
    method: string;
  }>;
  threshold: number;
  total_outliers: number;
  percentage: number;
}

export interface TrendAnalysis {
  column: string;
  trend_type: 'increasing' | 'decreasing' | 'stable' | 'seasonal' | 'cyclic';
  confidence: number;
  slope?: number;
  seasonality_period?: number;
  change_points?: Array<{
    index: number;
    value: number;
    significance: number;
  }>;
}

export interface DataProfile {
  dataset_id: number;
  columns: Array<{
    name: string;
    data_type: string;
    statistical_summary: StatisticalSummary;
    distribution: DistributionData;
    quality_metrics: DataQualityMetrics;
    outliers: OutlierAnalysis;
    trends?: TrendAnalysis;
  }>;
  correlations: CorrelationMatrix;
  overall_quality: DataQualityMetrics;
  generated_at: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'scatter' | 'histogram' | 'box' | 'heatmap' | 'correlation' | 'trend';
  title: string;
  x_axis: string;
  y_axis: string;
  color_by?: string;
  size_by?: string;
  filters?: Record<string, any>;
  options?: Record<string, any>;
}

export interface AnalyticsJob {
  id: number;
  dataset_id: number;
  analysis_type: 'quality_assessment' | 'statistical_analysis' | 'correlation_analysis' | 'outlier_detection' | 'trend_analysis' | 'full_profile';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results?: DataProfile;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  processing_time?: number;
  user_id: number;
}

export interface AnalyticsInsight {
  id: string;
  type: 'quality_issue' | 'data_pattern' | 'anomaly' | 'trend' | 'correlation' | 'recommendation';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_columns?: string[];
  suggested_actions?: string[];
  confidence: number;
  generated_at: string;
}

export interface PerformanceMetrics {
  processing_time: number;
  memory_usage: number;
  cpu_usage: number;
  throughput: number; // rows per second
  cache_hit_rate: number;
  error_rate: number;
  timestamp: string;
}

export interface ExportAnalytics {
  total_exports: number;
  successful_exports: number;
  failed_exports: number;
  average_processing_time: number;
  format_distribution: Record<string, number>;
  size_distribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  user_activity: Array<{
    user: string;
    exports_count: number;
    total_size: number;
  }>;
  time_series: Array<{
    date: string;
    exports_count: number;
    average_size: number;
  }>;
}
