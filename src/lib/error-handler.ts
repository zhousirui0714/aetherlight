import { toast } from "sonner";

// 错误类型定义
export type ErrorLevel = "info" | "warning" | "error" | "success";

// 统一错误处理函数
export function handleError(
  error: unknown,
  options: {
    context?: string;
    level?: ErrorLevel;
    fallbackMessage?: string;
    showToast?: boolean;
    log?: boolean;
  } = {}
): string {
  const {
    context = "",
    level = "error",
    fallbackMessage = "发生了一些问题，请稍后再试",
    showToast = true,
    log = true,
  } = options;

  let message = fallbackMessage;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  }

  // 日志输出
  if (log) {
    const prefix = context ? `[${context}]` : "";
    if (level === "error") {
      console.error(prefix, error);
    } else if (level === "warning") {
      console.warn(prefix, error);
    } else {
      console.log(prefix, error);
    }
  }

  // Toast 提示
  if (showToast) {
    switch (level) {
      case "success":
        toast.success(message);
        break;
      case "error":
        toast.error(message);
        break;
      case "warning":
        toast.warning(message);
        break;
      default:
        toast(message);
    }
  }

  return message;
}

// 网络错误处理
export function handleNetworkError(error: unknown, context = "网络请求"): string {
  if (error instanceof Error) {
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      return handleError(error, {
        context,
        fallbackMessage: "网络连接失败，请检查网络设置",
      });
    }
    if (error.message.includes("429") || error.message.includes("Too Many Requests")) {
      return handleError(error, {
        context,
        level: "warning",
        fallbackMessage: "请求过于频繁，请稍后再试",
      });
    }
    if (error.message.includes("500") || error.message.includes("Internal Server Error")) {
      return handleError(error, {
        context,
        fallbackMessage: "服务器暂时不可用，请稍后再试",
      });
    }
  }

  return handleError(error, { context });
}

// 静默处理错误（只记录日志，不弹提示）
export function silentError(error: unknown, context = ""): void {
  handleError(error, {
    context,
    showToast: false,
    log: true,
  });
}
