import { apiClient } from "./client";
import { ENDPOINTS } from "./config";
import { MOCK_WEEK_SCHEDULE, USE_MOCK } from "./mockData";

export interface ScheduleItem {
  id: number;
  start_time: string;
  end_time: string;
  program_name: string;
  program_id?: number;
  schedule_status: "scheduled" | "cancelled" | "postponed" | "one_time" | "по расписанию" | "отменено" | "перенесено" | "дополнительное";
  child_name?: string | null;
  new_date?: string | null;
  new_start_time?: string | null;
  new_end_time?: string | null;
  teacher_name?: string | null;
  room?: string | null;
  date?: string; 
}

export interface DaySchedule {
  date: string;
  day_of_week: string;
  lessons: ScheduleItem[];
}

export interface ChildGroup {
  program: string;
  study_year: number;
  group_number: string;
}

export interface ChildRequest {
  name: string;
  groups: ChildGroup[];
}

export interface ConfirmLessonActionData {
  status: "cancelled" | "postponed";
  new_date?: string;
  new_start_time?: string;
  new_end_time?: string;
  new_room?: string; 
  new_teacher?: string; 
}

export const scheduleApi = {
  getWeekSchedule: async (
    startDate: string,
    endDate: string,
  ): Promise<DaySchedule[]> => {
    if (USE_MOCK) return MOCK_WEEK_SCHEDULE as any;

    const url = ENDPOINTS.getSchedule(startDate, endDate);
    console.log("📅 Запрос расписания (GET):", url);
    const response: DaySchedule[] = await apiClient.get(url);
    console.log("✅ Расписание загружено, дней:", response.length);
    return response;
  },

  getScheduleForChildren: async (
    childrenData: ChildRequest[],
    weekIndex: number = 0,
  ): Promise<DaySchedule[]> => {
    if (USE_MOCK) return MOCK_WEEK_SCHEDULE as any;

    const url = ENDPOINTS.getScheduleForChildren(weekIndex);
    console.log("📅 Запрос расписания для детей (POST), неделя:", weekIndex);
    console.log("📦 Данные детей:", JSON.stringify(childrenData, null, 2));
    const response: DaySchedule[] = await apiClient.post(url, {
      children: childrenData,
    });
    console.log("✅ Расписание загружено, дней:", response.length);
    return response;
  },

  getTeacherSchedule: async (teacherName: string, weekIndex: number = 0): Promise<DaySchedule[]> => {
    if (USE_MOCK) return MOCK_WEEK_SCHEDULE as any;

    const url = ENDPOINTS.getTeacherSchedule(teacherName, weekIndex);
    console.log("📅 Запрос расписания учителя:", url);
    const response: DaySchedule[] = await apiClient.get(url);
    console.log("✅ Расписание учителя загружено, дней:", response.length);
    return response;
  },

 confirmLessonAction: async (lessonId: number, data: ConfirmLessonActionData, lessonDate: string, programName: string) => {
   if (USE_MOCK) {
      console.log("🛠️ [MOCK] Отмена/перенос занятия не отправляется на сервер");
      return { success: true };
    }

  const url = ENDPOINTS.confirmLessonAction(lessonId);
  console.log("📝 Подтверждение действия с занятием:", url);
  
  const body: any = {
    success: true,
    lesson: {
      id: lessonId,
      lesson_date: lessonDate,
      program_name: programName,
      schedule_status: data.status === "cancelled" ? "cancelled" : "postponed"
    }
  };
  
  if (data.status === "postponed") {
    body.lesson.new_date = data.new_date;
    body.lesson.new_start_time = data.new_start_time;
    body.lesson.new_end_time = data.new_end_time;
    body.lesson.new_room = data.new_room || ""; 
    body.lesson.new_teacher = data.new_teacher || ""; 
  }
  
  console.log("📦 Данные:", JSON.stringify(body, null, 2));
  return apiClient.post(url, body);
},
};
