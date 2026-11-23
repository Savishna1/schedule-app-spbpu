import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./config";

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  private async getHeaders() {
    const token = await AsyncStorage.getItem("adminToken");
    console.log("🔑 Токен для запроса:", token ? "есть" : "нет");
    if (token) {
      console.log("🔑 Токен (первые 20 символов):", token.substring(0, 20) + "...");
    }
    const headers: any = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log("🔵 ApiClient GET:", url);
    const headers = await this.getHeaders();
    console.log("🔑 Заголовки:", JSON.stringify(headers, null, 2));
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) {
      console.error("🔴 Ошибка ответа:", response.status);
      const errorText = await response.text();
      console.error("🔴 Текст ошибки:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log("🟢 ApiClient POST:", url);
    const headers = await this.getHeaders();
    console.log("🔑 Заголовки:", JSON.stringify(headers, null, 2));
    console.log("📦 Тело запроса:", JSON.stringify(data, null, 2));
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      console.error("🔴 Ошибка ответа:", response.status);
      const errorText = await response.text();
      console.error("🔴 Текст ошибки:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    console.log("🟢 Ответ:", JSON.stringify(result, null, 2));
    return result;
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log("🟡 ApiClient PUT:", url);
    const headers = await this.getHeaders();
    console.log("🔑 Заголовки:", JSON.stringify(headers, null, 2));
    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      console.error("🔴 Ошибка ответа:", response.status);
      const errorText = await response.text();
      console.error("🔴 Текст ошибки:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log("🟣 ApiClient PATCH:", url);
    const headers = await this.getHeaders();
    console.log("🔑 Заголовки:", JSON.stringify(headers, null, 2));
    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      console.error("🔴 Ошибка ответа:", response.status);
      const errorText = await response.text();
      console.error("🔴 Текст ошибки:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

async delete<T>(endpoint: string): Promise<T> {
  const url = `${this.baseUrl}${endpoint}`;
  console.log("🔴 ApiClient DELETE:", url);
  const headers = await this.getHeaders();
  console.log("🔑 Заголовки:", JSON.stringify(headers, null, 2));
  const response = await fetch(url, { method: "DELETE", headers });
  if (!response.ok) {
    console.error("🔴 Ошибка ответа:", response.status);
    const errorText = await response.text();
    console.error("🔴 Текст ошибки:", errorText);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // Проверяем, есть ли содержимое в ответе
  const text = await response.text();
  if (!text) {
    // Если ответ пустой, возвращаем пустой объект
    return {} as T;
  }
  
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    // Если не удалось распарсить JSON, возвращаем пустой объект
    console.log("⚠️ Ответ не является JSON, возвращаем пустой объект");
    return {} as T;
  }
}
}

export const apiClient = new ApiClient();
