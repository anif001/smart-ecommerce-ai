# PowerShell script to run the Python Machine Learning service

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Starting Smart E-Commerce ML Recommendation Service" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# 2. Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# 3. Upgrade pip and install requirements
Write-Host "Installing/Updating library dependencies..." -ForegroundColor Yellow
python -m pip install --upgrade pip
pip install -r requirements.txt

# 4. Launch FastAPI server via Uvicorn
Write-Host "Launching FastAPI service on port 8000..." -ForegroundColor Green
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
