"""后端服务启动脚本"""
import os
import sys
import multiprocessing

# 添加用户本地路径到 sys.path
user_local_bin = os.path.expanduser("~/.local/bin")
if user_local_bin not in os.environ.get("PATH", ""):
    os.environ["PATH"] = f"{user_local_bin}:{os.environ.get('PATH', '')}"

if __name__ == "__main__":
    # 确保在正确的目录中运行
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # 使用 python -m uvicorn 启动
    sys.exit(os.system(
        f"{sys.executable} -m uvicorn app.main:app "
        f"--host 0.0.0.0 --port 8000 "
        f"--workers {multiprocessing.cpu_count() * 2}"
    ) // 256)