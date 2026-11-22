import { apiClient } from "./client";
import { ENDPOINTS } from "./config";
import { MOCK_TEACHERS, USE_MOCK } from "./mockData";

export interface TeacherShort {
  id: number;
  name: string;
}


export const teachersApi = {
  getAllTeachers: async (): Promise<TeacherShort[]> => {
    if (USE_MOCK) return MOCK_TEACHERS; 

    const url = ENDPOINTS.getAllTeachers();
    console.log("👨‍🏫 Запрос списка преподавателей:", url);
    return apiClient.get(url);
  },
};
