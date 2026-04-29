/**
 * Data Mining Platform - Demo Page
 *
 * Demo page to test the complete pipeline flow with sample data.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Database, 
  Eye, 
  Sparkles, 
  Download, 
  CheckCircle,
  Play,
  ArrowRight
} from 'lucide-react';
import DataPipeline from '@/components/pipeline/DataPipeline';

const DemoPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'overview' | 'pipeline'>('overview');

  const handlePipelineComplete = (result: { dataset: any; exportJob: any }) => {
    console.log('Pipeline completed:', result);
    alert('🎉 Pipeline completed successfully! Check console for details.');
  };

  if (currentStep === 'pipeline') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('overview')}
            className="mb-4"
          >
            ← Back to Overview
          </Button>
        </div>
        
        <DataPipeline onPipelineComplete={handlePipelineComplete} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Data Mining Platform Demo
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Experience the complete data processing pipeline: Upload → Preview → Clean → Export
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="text-center">
          <CardContent className="pt-6">
            <Database className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Data Input</h3>
            <p className="text-sm text-gray-600">
              Upload files or crawl websites for data ingestion
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <Eye className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold mb-2">Data Preview</h3>
            <p className="text-sm text-gray-600">
              Analyze data quality and view sample records
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-purple-600" />
            <h3 className="text-lg font-semibold mb-2">AI Cleaning</h3>
            <p className="text-sm text-gray-600">
              Get AI suggestions and perform data cleaning
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <Download className="h-12 w-12 mx-auto mb-4 text-orange-600" />
            <h3 className="text-lg font-semibold mb-2">Export</h3>
            <p className="text-sm text-gray-600">
              Export cleaned data in multiple formats
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ready to Experience the Pipeline?
        </h2>
        <p className="text-gray-600 mb-6">
          Click below to start the interactive data processing pipeline demo
        </p>
        
        <Button
          size="lg"
          onClick={() => setCurrentStep('pipeline')}
          className="min-w-[200px]"
        >
          <Play className="h-5 w-5 mr-2" />
          Start Pipeline Demo
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              What You'll Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>File upload with drag & drop support</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Web crawling with configurable options</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Real-time data preview and quality metrics</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>AI-powered cleaning suggestions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Interactive cleaning operations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Multi-format data export</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Real-time Progress</Badge>
              <span className="text-sm text-gray-600">Live updates throughout the pipeline</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">AI Integration</Badge>
              <span className="text-sm text-gray-600">ML Engine powered suggestions</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Responsive Design</Badge>
              <span className="text-sm text-gray-600">Works on all device sizes</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Error Handling</Badge>
              <span className="text-sm text-gray-600">Graceful error recovery</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Toast Notifications</Badge>
              <span className="text-sm text-gray-600">Real-time user feedback</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">TypeScript</Badge>
              <span className="text-sm text-gray-600">Full type safety</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoPage;
