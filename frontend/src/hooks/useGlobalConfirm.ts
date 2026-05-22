import { useEffect } from 'react';

// 创建一个简单的事件总线用于确认对话框
type ConfirmCallback = () => void;

interface ConfirmEvent {
  title: string;
  message: string;
  onConfirm: ConfirmCallback;
  onCancel: () => void;
}

const confirmListeners = new Set<(event: ConfirmEvent) => void>();

export function showConfirm(options: {
  title: string;
  message: string;
  onConfirm: () => void;
}): Promise<void> {
  return new Promise((resolve) => {
    const event: ConfirmEvent = {
      ...options,
      onCancel: () => {
        resolve();
      },
      onConfirm: () => {
        options.onConfirm();
        resolve();
      },
    };
    
    // 触发所有监听器
    confirmListeners.forEach((listener) => listener(event));
  });
}

export function useConfirmDialog(
  setConfirmDialog: (dialog: ConfirmEvent | null) => void
) {
  useEffect(() => {
    const handler = (event: ConfirmEvent) => {
      setConfirmDialog({
        ...event,
        onCancel: () => {
          setConfirmDialog(null);
        },
      });
    };

    confirmListeners.add(handler);

    return () => {
      confirmListeners.delete(handler);
    };
  }, [setConfirmDialog]);
}
