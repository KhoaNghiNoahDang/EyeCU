#!/bin/bash
# Script to compile VNPT gRPC proto files
echo "Cài đặt thư viện grpcio-tools..."
pip install grpcio grpcio-tools

echo "Tiến hành biên dịch các file .proto thành code Python..."
# Lệnh biên dịch tất cả file .proto trong thư mục app/grpc_proto và xuất file ra cùng thư mục
python -m grpc_tools.protoc -I./app/grpc_proto --python_out=./app/grpc_proto --grpc_python_out=./app/grpc_proto ./app/grpc_proto/*.proto

echo "Biên dịch hoàn tất! Hãy kiểm tra các file _pb2.py và _pb2_grpc.py trong app/grpc_proto."
