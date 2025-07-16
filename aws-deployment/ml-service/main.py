import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import pandas as pd
from prophet import Prophet
import boto3
import os
import json
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AWS clients
dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))
s3 = boto3.client('s3', region_name=os.getenv('AWS_REGION', 'us-east-1'))

# Environment variables
DYNAMODB_TRANSACTIONS_TABLE = os.getenv('DYNAMODB_TRANSACTIONS_TABLE', 'Jargon AI-transactions-dev')
DYNAMODB_JARS_TABLE = os.getenv('DYNAMODB_JARS_TABLE', 'Jargon AI-jars-dev')
S3_BUCKET = os.getenv('S3_BUCKET', 'Jargon AI-assets-dev')

# Pydantic models
class DataPoint(BaseModel):
    date: str = Field(..., description="ISO date string, e.g. '2025-01-31'")
    balance: float

class ForecastRequest(BaseModel):
    data: List[DataPoint]
    periods: int = Field(12, description="How many future periods to forecast")
    freq: str = Field("M", description="Pandas frequency, e.g. 'D','W','M'")
    target: float = Field(..., description="Savings goal to project")

class ForecastPoint(BaseModel):
    date: str
    yhat: float
    yhat_lower: float
    yhat_upper: float

class ForecastResponse(BaseModel):
    forecast: List[ForecastPoint]
    target_date: Optional[str] = Field(
        None,
        description="First date when forecast yhat ≥ target; null if not reached in horizon"
    )

class UserDataRequest(BaseModel):
    user_id: str
    periods: int = Field(12, description="How many future periods to forecast")
    freq: str = Field("M", description="Pandas frequency, e.g. 'D','W','M'")
    target: float = Field(..., description="Savings goal to project")

# FastAPI app
app = FastAPI(
    title="Jargon AI ML Service",
    description="Machine Learning service for Jargon AI financial predictions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Get user data from DynamoDB
async def get_user_transactions(user_id: str, days_back: int = 365):
    """Retrieve user transactions from DynamoDB for ML analysis"""
    try:
        table = dynamodb.Table(DYNAMODB_TRANSACTIONS_TABLE)
        
        # Calculate start date
        start_date = (datetime.utcnow() - timedelta(days=days_back)).strftime('%Y-%m-%d')
        
        # Query transactions for the user
        response = table.query(
            KeyConditionExpression='user_id = :user_id',
            FilterExpression='#date >= :start_date',
            ExpressionAttributeNames={
                '#date': 'date'
            },
            ExpressionAttributeValues={
                ':user_id': user_id,
                ':start_date': start_date
            }
        )
        
        transactions = response.get('Items', [])
        
        # Continue querying if there are more items
        while 'LastEvaluatedKey' in response:
            response = table.query(
                KeyConditionExpression='user_id = :user_id',
                FilterExpression='#date >= :start_date',
                ExclusiveStartKey=response['LastEvaluatedKey'],
                ExpressionAttributeNames={
                    '#date': 'date'
                },
                ExpressionAttributeValues={
                    ':user_id': user_id,
                    ':start_date': start_date
                }
            )
            transactions.extend(response.get('Items', []))
        
        return transactions
    
    except Exception as e:
        logger.error(f"Error retrieving transactions for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Process transactions into time series data
def process_transactions_to_timeseries(transactions):
    """Convert transactions to time series data for forecasting"""
    try:
        # Group transactions by date and calculate daily balance
        daily_data = {}
        
        for transaction in transactions:
            date = transaction.get('date', '')
            amount = float(transaction.get('amount', 0))
            transaction_type = transaction.get('type', 'expense')
            
            if date not in daily_data:
                daily_data[date] = 0
            
            # Add income, subtract expenses
            if transaction_type == 'income':
                daily_data[date] += amount
            else:
                daily_data[date] -= amount
        
        # Convert to cumulative balance
        dates = sorted(daily_data.keys())
        cumulative_balance = 0
        data_points = []
        
        for date in dates:
            cumulative_balance += daily_data[date]
            data_points.append({
                'date': date,
                'balance': cumulative_balance
            })
        
        return data_points
    
    except Exception as e:
        logger.error(f"Error processing transactions: {e}")
        raise HTTPException(status_code=500, detail=f"Data processing error: {str(e)}")

@app.post("/forecast", response_model=ForecastResponse)
async def forecast_savings(req: ForecastRequest):
    """Forecast savings based on provided data"""
    try:
        # Validate data
        if len(req.data) < 7:  # Need at least a week of data
            raise HTTPException(status_code=400, detail="Insufficient data for forecasting. Need at least 7 data points.")
        
        # 1. Load & prepare
        df = pd.DataFrame([d.dict() for d in req.data])
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date")
        prophet_df = df.rename(columns={"date": "ds", "balance": "y"})
        
        # 2. Fit Prophet
        m = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=False,
            daily_seasonality=False
        )
        m.fit(prophet_df)
        
        # 3. Make future frame & predict
        future = m.make_future_dataframe(periods=req.periods, freq=req.freq)
        fcst = m.predict(future)
        
        # 4. Serialize forecast
        forecast_list = []
        for row in fcst[["ds", "yhat", "yhat_lower", "yhat_upper"]].itertuples():
            forecast_list.append(ForecastPoint(
                date=row.ds.strftime("%Y-%m-%d"),
                yhat=round(row.yhat, 2),
                yhat_lower=round(row.yhat_lower, 2),
                yhat_upper=round(row.yhat_upper, 2),
            ))
        
        # 5. Find target date
        hit = fcst[fcst["yhat"] >= req.target]
        target_date = None
        if not hit.empty:
            target_date = hit.iloc[0]["ds"].strftime("%Y-%m-%d")
        
        return ForecastResponse(forecast=forecast_list, target_date=target_date)
    
    except Exception as e:
        logger.error(f"Forecast error: {e}")
        raise HTTPException(status_code=400, detail=f"Error processing request: {e}")

@app.post("/forecast/user", response_model=ForecastResponse)
async def forecast_user_savings(req: UserDataRequest):
    """Forecast savings for a specific user using their transaction data"""
    try:
        # Get user transactions
        transactions = await get_user_transactions(req.user_id)
        
        if not transactions:
            raise HTTPException(status_code=404, detail="No transaction data found for user")
        
        # Process transactions to time series
        data_points = process_transactions_to_timeseries(transactions)
        
        if len(data_points) < 7:
            raise HTTPException(status_code=400, detail="Insufficient transaction data for forecasting")
        
        # Create forecast request
        forecast_req = ForecastRequest(
            data=data_points,
            periods=req.periods,
            freq=req.freq,
            target=req.target
        )
        
        # Call the forecast function
        return await forecast_savings(forecast_req)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User forecast error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing user forecast: {e}")

@app.get("/user/analytics/{user_id}")
async def get_user_analytics(user_id: str):
    """Get analytics for a specific user"""
    try:
        # Get user transactions
        transactions = await get_user_transactions(user_id)
        
        if not transactions:
            return {
                "user_id": user_id,
                "total_transactions": 0,
                "total_income": 0,
                "total_expenses": 0,
                "net_balance": 0,
                "average_daily_spending": 0,
                "most_common_category": None
            }
        
        # Calculate analytics
        total_income = sum(float(t.get('amount', 0)) for t in transactions if t.get('type') == 'income')
        total_expenses = sum(float(t.get('amount', 0)) for t in transactions if t.get('type') == 'expense')
        net_balance = total_income - total_expenses
        
        # Calculate average daily spending
        expense_transactions = [t for t in transactions if t.get('type') == 'expense']
        if expense_transactions:
            total_expense_amount = sum(float(t.get('amount', 0)) for t in expense_transactions)
            unique_days = len(set(t.get('date') for t in expense_transactions))
            avg_daily_spending = total_expense_amount / unique_days if unique_days > 0 else 0
        else:
            avg_daily_spending = 0
        
        # Most common category
        categories = [t.get('category', 'Unknown') for t in transactions if t.get('type') == 'expense']
        most_common_category = max(set(categories), key=categories.count) if categories else None
        
        return {
            "user_id": user_id,
            "total_transactions": len(transactions),
            "total_income": round(total_income, 2),
            "total_expenses": round(total_expenses, 2),
            "net_balance": round(net_balance, 2),
            "average_daily_spending": round(avg_daily_spending, 2),
            "most_common_category": most_common_category,
            "analysis_period_days": 365
        }
    
    except Exception as e:
        logger.error(f"Analytics error for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error calculating analytics: {e}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 