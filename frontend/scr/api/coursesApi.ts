import { apiClient } from "./client";
import { ENDPOINTS } from "./config";
import { MOCK_COURSES, USE_MOCK } from "./mockData";

export interface CourseShort {
  id: number;
  title: string;
  age: string;
  has_places?: boolean;
  price?: number;
  
}

export interface GroupInfo {
  study_year: number;
  group_number: string;
}

export interface CourseDetail {
  id: number;
  title: string;
  age: string;
  description?: string;
  has_places?: boolean;
  materials?: string;
  enrollment_url?: string | null; 
  groups: GroupInfo[];
}

export const coursesApi = {

  getCoursesShort: async (type: string): Promise<CourseShort[]> => {
    if (USE_MOCK) return MOCK_COURSES as any;

    const url = ENDPOINTS.getCoursesShort(type);
    console.log("Запрос курсов:", url);
    return apiClient.get(url);
  },

  getCourseDetail: async (courseId: number): Promise<CourseDetail> => {
    if (USE_MOCK) {
      const course = MOCK_COURSES.find(c => c.id === courseId);
      return course as any;
    }

    const url = ENDPOINTS.getCourseDetail(courseId);
    console.log("Запрос деталей курса:", url);
    return apiClient.get(url);
  },
};
