"""
Workflow automation engine for custom pipelines and scheduled jobs
"""

import asyncio
import json
import uuid
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
import structlog
from sqlalchemy.orm import Session
import croniter

from app.models.workflow import (
    Workflow, WorkflowExecution, NodeExecution, ScheduledJob, 
    WorkflowStatus, WorkflowTriggerType, NodeType
)
from app.core.database import get_db
from app.core.performance import performance_monitor

logger = structlog.get_logger(__name__)


class WorkflowNode:
    """Base class for workflow nodes"""
    
    def __init__(self, node_id: str, node_type: NodeType, config: Dict[str, Any]):
        self.node_id = node_id
        self.node_type = node_type
        self.config = config
        self.input_data = None
        self.output_data = None
        self.status = WorkflowStatus.DRAFT
    
    async def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the node"""
        self.input_data = input_data
        self.status = WorkflowStatus.ACTIVE
        
        try:
            # Execute node-specific logic
            result = await self._execute_node(input_data, context)
            self.output_data = result
            self.status = WorkflowStatus.COMPLETED
            return result
        except Exception as e:
            self.status = WorkflowStatus.FAILED
            logger.error("Node execution failed", 
                        node_id=self.node_id, 
                        node_type=self.node_type.value, 
                        error=str(e))
            raise
    
    async def _execute_node(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Node-specific execution logic - to be implemented by subclasses"""
        raise NotImplementedError


class DataInputNode(WorkflowNode):
    """Data input node for loading datasets"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, NodeType.DATA_INPUT, config)
    
    async def _execute_node(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Load data from specified source"""
        source_type = self.config.get('source_type', 'dataset')
        source_id = self.config.get('source_id')
        
        if source_type == 'dataset':
            # Load from dataset
            db = context.get('db')
            if db:
                from app.models.dataset import Dataset
                dataset = db.query(Dataset).filter(Dataset.id == source_id).first()
                if dataset:
                    return {
                        'dataset_id': dataset.id,
                        'data': f"Loaded dataset: {dataset.name}",
                        'row_count': dataset.row_count,
                        'column_count': dataset.column_count
                    }
        
        return {'data': f"Loaded from {source_type}: {source_id}"}


class DataProcessingNode(WorkflowNode):
    """Data processing node for data transformations"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, NodeType.DATA_PROCESSING, config)
    
    async def _execute_node(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Process data according to configuration"""
        operation = self.config.get('operation', 'transform')
        parameters = self.config.get('parameters', {})
        
        # Simulate data processing
        processed_data = {
            'operation': operation,
            'parameters': parameters,
            'input_size': len(str(input_data)),
            'processed_at': datetime.utcnow().isoformat()
        }
        
        return processed_data


class MLTrainingNode(WorkflowNode):
    """ML training node for model training"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, NodeType.ML_TRAINING, config)
    
    async def _execute_node(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Train ML model"""
        model_type = self.config.get('model_type', 'classification')
        algorithm = self.config.get('algorithm', 'random_forest')
        target_column = self.config.get('target_column')
        
        # Simulate model training
        training_result = {
            'model_type': model_type,
            'algorithm': algorithm,
            'target_column': target_column,
            'training_completed': True,
            'model_id': str(uuid.uuid4()),
            'accuracy': 0.85,  # Simulated accuracy
            'training_time': 120.5  # Simulated training time
        }
        
        return training_result


class MLPredictionNode(WorkflowNode):
    """ML prediction node for making predictions"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, NodeType.ML_PREDICTION, config)
    
    async def _execute_node(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Make predictions using trained model"""
        model_id = self.config.get('model_id')
        prediction_data = input_data.get('data', {})
        
        # Simulate prediction
        predictions = {
            'model_id': model_id,
            'predictions': [0.8, 0.6, 0.9, 0.7],  # Simulated predictions
            'confidence': 0.85,
            'prediction_count': len(prediction_data) if isinstance(prediction_data, list) else 1
        }
        
        return predictions


class DataCleaningNode(WorkflowNode):
    """Data cleaning node for data quality operations"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, NodeType.DATA_CLEANING, config)
    
    async def _execute_node(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Clean data according to configuration"""
        cleaning_operations = self.config.get('operations', ['remove_duplicates', 'handle_missing'])
        
        # Simulate data cleaning
        cleaning_result = {
            'operations_applied': cleaning_operations,
            'rows_before': 1000,
            'rows_after': 950,
            'rows_removed': 50,
            'cleaning_time': 15.2
        }
        
        return cleaning_result


class DataExportNode(WorkflowNode):
    """Data export node for exporting processed data"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, NodeType.DATA_EXPORT, config)
    
    async def _execute_node(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Export data in specified format"""
        export_format = self.config.get('format', 'csv')
        export_path = self.config.get('path', '/tmp/export')
        
        # Simulate data export
        export_result = {
            'format': export_format,
            'path': export_path,
            'file_size': '2.5MB',
            'export_time': 8.3,
            'export_id': str(uuid.uuid4())
        }
        
        return export_result


class ConditionNode(WorkflowNode):
    """Conditional branching node"""
    
    def __init__(self, node_id: str, config: Dict[str, Any]):
        super().__init__(node_id, NodeType.CONDITION, config)
    
    async def _execute_node(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate condition and determine next node"""
        condition = self.config.get('condition', 'true')
        true_path = self.config.get('true_path')
        false_path = self.config.get('false_path')
        
        # Simple condition evaluation (in real implementation, use proper expression evaluator)
        condition_result = self._evaluate_condition(condition, input_data)
        
        return {
            'condition': condition,
            'result': condition_result,
            'next_node': true_path if condition_result else false_path
        }
    
    def _evaluate_condition(self, condition: str, input_data: Dict[str, Any]) -> bool:
        """Evaluate condition expression"""
        # Simple implementation - in real system, use proper expression evaluator
        try:
            # Replace variables with actual values
            for key, value in input_data.items():
                condition = condition.replace(f"${{{key}}}", str(value))
            
            # Evaluate simple conditions
            if condition == 'true':
                return True
            elif condition == 'false':
                return False
            else:
                # For now, return True for any other condition
                return True
        except:
            return False


class WorkflowEngine:
    """Main workflow execution engine"""
    
    def __init__(self):
        self.node_types = {
            NodeType.DATA_INPUT: DataInputNode,
            NodeType.DATA_PROCESSING: DataProcessingNode,
            NodeType.ML_TRAINING: MLTrainingNode,
            NodeType.ML_PREDICTION: MLPredictionNode,
            NodeType.DATA_CLEANING: DataCleaningNode,
            NodeType.DATA_EXPORT: DataExportNode,
            NodeType.CONDITION: ConditionNode,
        }
        self.running_executions = {}
    
    def create_node(self, node_id: str, node_type: NodeType, config: Dict[str, Any]) -> WorkflowNode:
        """Create workflow node instance"""
        node_class = self.node_types.get(node_type)
        if not node_class:
            raise ValueError(f"Unsupported node type: {node_type}")
        
        return node_class(node_id, config)
    
    async def execute_workflow(self, 
                              workflow: Workflow, 
                              input_data: Dict[str, Any] = None,
                              trigger_type: WorkflowTriggerType = WorkflowTriggerType.MANUAL,
                              trigger_data: Dict[str, Any] = None,
                              db: Session = None) -> WorkflowExecution:
        """Execute a workflow"""
        execution_id = str(uuid.uuid4())
        
        # Create execution record
        execution = WorkflowExecution(
            workflow_id=workflow.id,
            execution_id=execution_id,
            trigger_type=trigger_type,
            trigger_data=trigger_data,
            input_data=input_data or {},
            status=WorkflowStatus.DRAFT
        )
        
        if db:
            db.add(execution)
            db.commit()
            db.refresh(execution)
        
        try:
            # Start execution
            execution.start_execution()
            if db:
                db.commit()
            
            # Execute workflow
            result = await self._execute_workflow_nodes(
                workflow, execution, input_data or {}, db
            )
            
            # Complete execution
            execution.complete_execution(True, result)
            if db:
                db.commit()
            
            # Update workflow statistics
            workflow.update_execution_stats(
                execution.execution_time or 0, True
            )
            if db:
                db.commit()
            
            logger.info("Workflow execution completed", 
                       workflow_id=workflow.id,
                       execution_id=execution_id)
            
            return execution
            
        except Exception as e:
            # Handle execution failure
            execution.complete_execution(False, error_message=str(e))
            if db:
                db.commit()
            
            # Update workflow statistics
            workflow.update_execution_stats(
                execution.execution_time or 0, False
            )
            if db:
                db.commit()
            
            logger.error("Workflow execution failed", 
                        workflow_id=workflow.id,
                        execution_id=execution_id,
                        error=str(e))
            
            raise
    
    async def _execute_workflow_nodes(self, 
                                     workflow: Workflow, 
                                     execution: WorkflowExecution,
                                     input_data: Dict[str, Any],
                                     db: Session) -> Dict[str, Any]:
        """Execute workflow nodes"""
        workflow_def = workflow.get_workflow_definition()
        nodes = workflow_def.get('nodes', [])
        connections = workflow_def.get('connections', [])
        
        # Create node instances
        node_instances = {}
        for node_def in nodes:
            node_id = node_def['id']
            node_type = NodeType(node_def['type'])
            config = node_def.get('config', {})
            
            node_instances[node_id] = self.create_node(node_id, node_type, config)
        
        # Find start node
        start_nodes = [node for node in nodes if node.get('is_start', False)]
        if not start_nodes:
            raise ValueError("No start node found in workflow")
        
        start_node_id = start_nodes[0]['id']
        current_node_id = start_node_id
        execution_context = {
            'db': db,
            'workflow': workflow,
            'execution': execution
        }
        
        # Execute nodes in sequence
        while current_node_id:
            node = node_instances[current_node_id]
            
            # Create node execution record
            node_execution = NodeExecution(
                workflow_execution_id=execution.id,
                node_id=node.node_id,
                node_type=node.node_type,
                input_data=input_data
            )
            
            if db:
                db.add(node_execution)
                db.commit()
                db.refresh(node_execution)
            
            try:
                # Execute node
                node_execution.start_execution()
                if db:
                    db.commit()
                
                result = await node.execute(input_data, execution_context)
                
                # Complete node execution
                node_execution.complete_execution(True, result)
                if db:
                    db.commit()
                
                # Update execution progress
                if not execution.completed_nodes:
                    execution.completed_nodes = []
                execution.completed_nodes.append(current_node_id)
                execution.current_node = current_node_id
                if db:
                    db.commit()
                
                # Determine next node
                if node.node_type == NodeType.CONDITION:
                    next_node_id = result.get('next_node')
                else:
                    # Find next node from connections
                    next_connections = [conn for conn in connections if conn['from'] == current_node_id]
                    if next_connections:
                        next_node_id = next_connections[0]['to']
                    else:
                        next_node_id = None
                
                current_node_id = next_node_id
                input_data = result  # Pass output as input to next node
                
            except Exception as e:
                # Handle node execution failure
                node_execution.complete_execution(False, error_message=str(e))
                if db:
                    db.commit()
                
                # Update execution with failed node
                if not execution.failed_nodes:
                    execution.failed_nodes = []
                execution.failed_nodes.append(current_node_id)
                if db:
                    db.commit()
                
                raise
        
        # Return final result
        return input_data
    
    def schedule_workflow(self, 
                         workflow: Workflow, 
                         cron_expression: str,
                         input_data: Dict[str, Any] = None,
                         variables: Dict[str, Any] = None,
                         db: Session = None) -> ScheduledJob:
        """Schedule workflow for automatic execution"""
        
        # Calculate next execution time
        cron = croniter.croniter(cron_expression, datetime.utcnow())
        next_execution = cron.get_next(datetime)
        
        # Create scheduled job
        scheduled_job = ScheduledJob(
            workflow_id=workflow.id,
            name=f"Scheduled {workflow.name}",
            cron_expression=cron_expression,
            input_data=input_data,
            variables=variables,
            next_execution_at=next_execution
        )
        
        if db:
            db.add(scheduled_job)
            db.commit()
            db.refresh(scheduled_job)
        
        logger.info("Workflow scheduled", 
                   workflow_id=workflow.id,
                   cron_expression=cron_expression,
                   next_execution=next_execution)
        
        return scheduled_job
    
    async def execute_scheduled_jobs(self, db: Session):
        """Execute scheduled jobs that are due"""
        current_time = datetime.utcnow()
        
        # Find jobs that are due for execution
        due_jobs = db.query(ScheduledJob).filter(
            ScheduledJob.is_active == True,
            ScheduledJob.next_execution_at <= current_time
        ).all()
        
        for job in due_jobs:
            try:
                # Check if max executions reached
                if job.is_max_executions_reached():
                    job.is_active = False
                    db.commit()
                    continue
                
                # Execute workflow
                workflow = db.query(Workflow).filter(Workflow.id == job.workflow_id).first()
                if workflow and workflow.is_active:
                    await self.execute_workflow(
                        workflow,
                        input_data=job.input_data,
                        trigger_type=WorkflowTriggerType.SCHEDULED,
                        trigger_data={'scheduled_job_id': job.id},
                        db=db
                    )
                
                # Update job
                job.increment_execution_count()
                
                # Calculate next execution time
                cron = croniter.croniter(job.cron_expression, current_time)
                job.next_execution_at = cron.get_next(datetime)
                
                db.commit()
                
                logger.info("Scheduled job executed", 
                           job_id=job.id,
                           workflow_id=job.workflow_id)
                
            except Exception as e:
                logger.error("Scheduled job execution failed", 
                            job_id=job.id,
                            error=str(e))
                # Continue with other jobs even if one fails
    
    def get_workflow_status(self, execution_id: str, db: Session) -> Dict[str, Any]:
        """Get workflow execution status"""
        execution = db.query(WorkflowExecution).filter(
            WorkflowExecution.execution_id == execution_id
        ).first()
        
        if not execution:
            return {'error': 'Execution not found'}
        
        return {
            'execution_id': execution.execution_id,
            'status': execution.status.value,
            'current_node': execution.current_node,
            'completed_nodes': execution.completed_nodes or [],
            'failed_nodes': execution.failed_nodes or [],
            'start_time': execution.start_time.isoformat() if execution.start_time else None,
            'end_time': execution.end_time.isoformat() if execution.end_time else None,
            'execution_time': execution.execution_time,
            'error_message': execution.error_message
        }


# Global workflow engine instance
workflow_engine = WorkflowEngine()
