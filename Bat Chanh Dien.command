#!/bin/zsh
cd -- "$(dirname -- "$0")" || exit 1
python3 live/scripts/start.py
if [ $? -eq 0 ]; then
  open 'http://127.0.0.1:3481/live/control.html'
  echo 'Giữ máy thức khi phát OBS. Máy chủ tiếp tục chạy sau khi đóng cửa sổ này.'
else
  echo 'Nhấn Enter để đóng.'
  read
fi
