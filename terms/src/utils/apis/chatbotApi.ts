export interface ChatResponse {
  role: "user" | "assistant";
  text: string;
  sessionId?: string;
  documentId?: string;
}

// Session management
let currentSessionId: string | null = null;

export function getSessionId(): string | null {
  return currentSessionId;
}

export function setSessionId(sessionId: string | null): void {
  currentSessionId = sessionId;
}

export function clearSession(): void {
  currentSessionId = null;
}

export async function sendFileMessage(file: File): Promise<ChatResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const headers: HeadersInit = {};
  if (currentSessionId) {
    headers["x-session-id"] = currentSessionId;
  }

  const res = await fetch("http://localhost:3000/file-upload", {
    method: "POST",
    headers: headers,
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Failed to upload file" }));
    throw new Error(errorData.error || "Failed to upload file");
  }

  const response = await res.json();
  
  // Update session ID if provided
  if (response.sessionId) {
    currentSessionId = response.sessionId;
  }

  return response;
}

export async function sendTextMessage(text: string, sessionId?: string): Promise<ChatResponse> {
  const sessionToUse = sessionId || currentSessionId;

  const res = await fetch("http://localhost:3000/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      text,
      sessionId: sessionToUse 
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Failed to send message" }));
    throw new Error(errorData.error || "Failed to send message");
  }

  const response = await res.json();
  
  // Update session ID if provided
  if (response.sessionId) {
    currentSessionId = response.sessionId;
  }

  return response;
}

export async function clearSessionContext(sessionId?: string): Promise<void> {
  const sessionToUse = sessionId || currentSessionId;
  
  if (!sessionToUse) {
    return;
  }

  const res = await fetch("http://localhost:3000/session/clear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: sessionToUse }),
  });

  if (!res.ok) {
    throw new Error("Failed to clear session");
  }

  if (sessionToUse === currentSessionId) {
    currentSessionId = null;
  }
}
