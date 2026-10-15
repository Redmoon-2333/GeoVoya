export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  let response: Response
  try {
    response = await fetch(`/api/v1${path}`, {
      ...options,
      headers,
      credentials: 'same-origin',
    })
  } catch {
    throw new Error('连接中断，内容尚未保存。请检查本地服务后重试。')
  }
  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.message || `请求未完成（${response.status}），请稍后重试。`)
  }
  return response.json() as Promise<T>
}

export function formatDate(value?: string) {
  if (!value) return '尚未保存'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}
