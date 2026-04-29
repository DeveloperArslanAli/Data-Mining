/**
 * Data Mining Platform - Pipeline Page
 *
 * Main page for the data processing pipeline with all steps integrated.
 */

import React from 'react';
import DataPipeline from '@/components/pipeline/DataPipeline';

const PipelinePage: React.FC = () => {
  const handlePipelineComplete = (result: { dataset: any; exportJob: any }) => {
    console.log('Pipeline completed:', result);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Data Processing Pipeline
        </h1>
        <p className="text-gray-600">
          Complete workflow: Upload data → Preview → Clean → Export
        </p>
      </div>
      
      <DataPipeline onPipelineComplete={handlePipelineComplete} />
    </div>
  );
};

export default PipelinePage;
