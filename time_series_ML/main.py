import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.preprocessing import MinMaxScaler
import uvicorn

app = FastAPI()

class TimeSeriesRequest(BaseModel):
    dates: List[str]  # e.g. ["2024-07-01", ...]
    values: List[float]  # daily balances
    predict_days: int = 7

class TimeSeriesResponse(BaseModel):
    predicted_dates: List[str]
    predicted_values: List[float]

# Helper to create sequences for LSTM
def create_sequences(data, seq_length):
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        xs.append(data[i:i+seq_length])
        ys.append(data[i+seq_length])
    return np.array(xs), np.array(ys)

@app.post("/predict", response_model=TimeSeriesResponse)
def predict_lstm(request: TimeSeriesRequest):
    if len(request.values) < 30:
        raise HTTPException(status_code=400, detail="Need at least 30 days of data for prediction.")
    df = pd.DataFrame({"date": request.dates, "value": request.values})
    df = df.sort_values("date")
    values = df["value"].values.reshape(-1, 1)
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(values)
    seq_length = 14
    X, y = create_sequences(scaled, seq_length)
    X = X.reshape((X.shape[0], X.shape[1], 1))
    # Build LSTM model
    model = Sequential([
        LSTM(32, input_shape=(seq_length, 1)),
        Dense(1)
    ])
    model.compile(optimizer=Adam(learning_rate=0.01), loss="mse")
    es = EarlyStopping(monitor="loss", patience=5, restore_best_weights=True)
    model.fit(X, y, epochs=50, batch_size=8, verbose=0, callbacks=[es])
    # Predict future
    last_seq = scaled[-seq_length:]
    preds = []
    for _ in range(request.predict_days):
        pred = model.predict(last_seq.reshape(1, seq_length, 1), verbose=0)[0, 0]
        preds.append(pred)
        last_seq = np.append(last_seq[1:], [[pred]], axis=0)
    predicted_values = scaler.inverse_transform(np.array(preds).reshape(-1, 1)).flatten().tolist()
    last_date = pd.to_datetime(df["date"].iloc[-1])
    predicted_dates = [(last_date + pd.Timedelta(days=i+1)).strftime("%Y-%m-%d") for i in range(request.predict_days)]
    return TimeSeriesResponse(predicted_dates=predicted_dates, predicted_values=predicted_values)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 