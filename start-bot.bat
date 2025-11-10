@echo off
echo =================================================
echo  Cyberpunk Binance Futures Bot - Quick Start
echo =================================================
echo.

echo Installing required packages...
pip install -r requirements-simple.txt

echo.
echo Starting the trading bot...
echo Your bot will be available at: http://localhost:8000
echo.
echo =================================================

python main-no-ccxt.py

pause
