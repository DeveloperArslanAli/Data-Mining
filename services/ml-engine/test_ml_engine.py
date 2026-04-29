"""
Test script for ML Engine Service
"""

import pandas as pd
import numpy as np
import tempfile
import os
import sys
import asyncio
import httpx

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.ml.data_processor import data_processor


def create_test_dataset():
    """Create a test dataset with various data quality issues"""
    # Create sample data with issues
    np.random.seed(42)
    n_rows = 1000
    
    data = {
        'id': range(1, n_rows + 1),
        'name': [f'User_{i}' for i in range(1, n_rows + 1)],
        'age': np.random.normal(35, 10, n_rows),
        'income': np.random.exponential(50000, n_rows),
        'education': np.random.choice(['High School', 'Bachelor', 'Master', 'PhD'], n_rows),
        'score': np.random.uniform(0, 100, n_rows)
    }
    
    # Add missing values
    data['age'][np.random.choice(n_rows, 50, replace=False)] = np.nan
    data['income'][np.random.choice(n_rows, 30, replace=False)] = np.nan
    
    # Add duplicates
    duplicate_indices = np.random.choice(n_rows, 20, replace=False)
    for i in duplicate_indices:
        data['name'][i] = data['name'][i-1]
        data['age'][i] = data['age'][i-1]
    
    # Add outliers
    data['age'][0] = 150  # Outlier
    data['income'][1] = 1000000  # Outlier
    
    df = pd.DataFrame(data)
    
    # Save to temporary file
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False)
    df.to_csv(temp_file.name, index=False)
    temp_file.close()
    
    return temp_file.name


async def test_ml_engine_service():
    """Test the ML Engine Service endpoints"""
    base_url = "http://localhost:8001"
    
    # Create test dataset
    test_file = create_test_dataset()
    print(f"Created test dataset: {test_file}")
    
    try:
        async with httpx.AsyncClient() as client:
            # Test health endpoint
            print("\n1. Testing health endpoint...")
            response = await client.get(f"{base_url}/health")
            print(f"Health check: {response.status_code} - {response.json()}")
            
            # Test quality assessment
            print("\n2. Testing quality assessment...")
            response = await client.get(f"{base_url}/api/v1/quality/assess/{test_file}")
            if response.status_code == 200:
                quality_data = response.json()
                print(f"Quality score: {quality_data['quality_score']:.1f}/100")
                print(f"Missing values: {quality_data['missing_values']['missing_percentage']:.1f}%")
                print(f"Duplicates: {quality_data['duplicates']['duplicate_percentage']:.1f}%")
                print(f"Recommendations: {len(quality_data['recommendations'])}")
            else:
                print(f"Quality assessment failed: {response.status_code}")
            
            # Test cleaning operation
            print("\n3. Testing cleaning operation...")
            cleaning_payload = {
                "file_path": test_file,
                "operation_type": "remove_duplicates",
                "parameters": {"keep": "first"},
                "target_columns": []
            }
            
            response = await client.post(f"{base_url}/api/v1/cleaning/process", json=cleaning_payload)
            if response.status_code == 200:
                cleaning_result = response.json()
                print(f"Cleaning completed: {cleaning_result['status']}")
                print(f"Processing time: {cleaning_result['processing_time']:.2f}s")
                print(f"Quality improvement: {cleaning_result['quality_improvement']:.1f}")
            else:
                print(f"Cleaning operation failed: {response.status_code}")
            
            # Test ML suggestions
            print("\n4. Testing ML suggestions...")
            suggestions_payload = {
                "file_path": test_file,
                "max_suggestions": 5
            }
            
            response = await client.post(f"{base_url}/api/v1/suggestions/generate", json=suggestions_payload)
            if response.status_code == 200:
                suggestions_result = response.json()
                print(f"Generated {suggestions_result['total_suggestions']} suggestions")
                for i, suggestion in enumerate(suggestions_result['suggestions'][:3], 1):
                    print(f"  {i}. {suggestion['title']} (Priority: {suggestion['priority']})")
            else:
                print(f"ML suggestions failed: {response.status_code}")
            
            # Test supported operations
            print("\n5. Testing supported operations...")
            response = await client.get(f"{base_url}/api/v1/cleaning/operations")
            if response.status_code == 200:
                operations = response.json()
                print(f"Supported operations: {len(operations['operations'])}")
                for op in operations['operations']:
                    print(f"  - {op['name']}: {op['description']}")
            else:
                print(f"Operations endpoint failed: {response.status_code}")
    
    except Exception as e:
        print(f"Error testing ML Engine Service: {e}")
    
    finally:
        # Clean up test file
        if os.path.exists(test_file):
            os.unlink(test_file)
            print(f"\nCleaned up test file: {test_file}")


def test_data_processor():
    """Test the data processor directly"""
    print("\n=== Testing Data Processor Directly ===")
    
    # Create test dataset
    test_file = create_test_dataset()
    
    try:
        # Load dataset
        df = data_processor.load_dataset(test_file)
        print(f"Loaded dataset: {df.shape}")
        
        # Assess quality
        quality_report = data_processor.assess_data_quality(df)
        print(f"Quality score: {quality_report['quality_score']:.1f}/100")
        print(f"Missing values: {quality_report['missing_values']['missing_percentage']:.1f}%")
        print(f"Duplicates: {quality_report['duplicates']['duplicate_percentage']:.1f}%")
        
        # Test cleaning operations
        print("\nTesting cleaning operations...")
        
        # Remove duplicates
        df_cleaned, result = data_processor.remove_duplicates(df)
        print(f"Duplicates removed: {result['rows_removed']} rows")
        
        # Handle missing values
        df_cleaned, result = data_processor.handle_missing_values(df_cleaned, strategy='auto')
        print(f"Missing values filled: {result['missing_values_filled']}")
        
        # Remove outliers
        df_cleaned, result = data_processor.remove_outliers(df_cleaned, method='iqr')
        print(f"Outliers removed: {result['rows_removed']} rows")
        
        # Final quality assessment
        final_quality = data_processor.assess_data_quality(df_cleaned)
        print(f"Final quality score: {final_quality['quality_score']:.1f}/100")
        
    except Exception as e:
        print(f"Error testing data processor: {e}")
    
    finally:
        # Clean up test file
        if os.path.exists(test_file):
            os.unlink(test_file)


if __name__ == "__main__":
    print("ML Engine Service Test Suite")
    print("=" * 50)
    
    # Test data processor directly
    test_data_processor()
    
    # Test ML Engine Service (if running)
    print("\n" + "=" * 50)
    print("Testing ML Engine Service endpoints...")
    print("Make sure the ML Engine Service is running on http://localhost:8001")
    
    try:
        asyncio.run(test_ml_engine_service())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Service test failed: {e}")
        print("Make sure the ML Engine Service is running and accessible")
