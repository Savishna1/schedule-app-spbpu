import { apiClient } from "./client";
import { ENDPOINTS } from "./config";
import { USE_MOCK } from "./mockData";

export interface DeleteExceptionData {
  group_id: number;
  exception_date: string;
  status: "cancelled" | "postponed" | "additional";
}

export interface CreateOneTimeLessonData {
  program: string;
  study_year: number;
  group_number: string;
  date: string;
  start_time: string;
  end_time: string;
  room: string;
  teacher: string;
}

export interface CreateTeacherData {
  name: string;
  bio?: string;
}

export interface UpdateTeacherData {
  name?: string;
  bio?: string;
}

export const adminApi = {
// Исключения
deleteException: async (data: { group_id: number; exception_date: string; status: string }) => {
  if (USE_MOCK) {
      console.log("🛠️ [MOCK] Удаление исключения:", data);
      return { success: true };
    }

  const encodedDate = encodeURIComponent(data.exception_date);
  const encodedStatus = encodeURIComponent(data.status);
  const url = `${ENDPOINTS.deleteException({ group_id: data.group_id, exception_date: data.exception_date, status: data.status })}`;
  console.log("🗑️ Удаление исключения:", url);
  return apiClient.delete(url);
},

  // Разовые занятия
  createOneTimeLesson: async (data: CreateOneTimeLessonData) => {
    if (USE_MOCK) {
      console.log("🛠️ [MOCK] Создание разового занятия (имитация успеха):", data);
      return { success: true }; 
    }
    
    const url = ENDPOINTS.createOneTimeLesson();
    console.log("Создание разового занятия:", url);
    return apiClient.post(url, data);
  },

};
