#!/bin/bash
# 奖励打卡后端服务启动脚本
# 用法: bash start-server.sh

echo "🚀 启动奖励打卡后端服务..."
npx tsx server/index.ts
