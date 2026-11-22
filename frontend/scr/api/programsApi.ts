import { apiClient } from "./client";
import { ENDPOINTS } from "./config";
import { MOCK_PROGRAMS, USE_MOCK } from "./mockData";

export interface Program {
  id: number;
  name: string;
  groups: string[];
  study_year: number; 
}

export const programsApi = {
  getPrograms: async (): Promise<Program[]> => {
    if (USE_MOCK) {
      console.log("[MOCK] Используем локальную заглушку программ");
      return MOCK_PROGRAMS as any;
    }

    const url = ENDPOINTS.getPrograms();
    console.log("ЗАПРОС К:", url);
    try {
      const response: any = await apiClient.get(url);
      console.log("✅ ОТВЕТ:", response);
      return response.programs.map((name: string, index: number) => ({
        id: index,
        name: name,
        groups: [],
        study_year: 0
      })); 
    } catch (error) {
      console.error("❌ ОШИБКА:", error);
      throw error;
    }
  },

   getStudyYears: async (programName: string): Promise<number[]> => {
    const url = `${ENDPOINTS.getPrograms()}/${encodeURIComponent(programName)}/study-years`;
    const response: any = await apiClient.get(url);
    return response.study_years;
  },

  getGroups: async (programName: string, studyYear: number): Promise<string[]> => {
    const url = `${ENDPOINTS.getPrograms()}/${encodeURIComponent(programName)}/study-years/${studyYear}/groups`;
    const response: any = await apiClient.get(url);
    return response.groups;
  }
};

