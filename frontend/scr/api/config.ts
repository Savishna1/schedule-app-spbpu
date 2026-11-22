export const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://schedule-app-spbpu.onrender.com";

// Флаг для переключения между реальным бэкендом и локальными данными
// true  = использовать локальные тестовые данные (mockData.ts)
// false = отправлять запросы на реальный бэкенд (API_URL)
export const USE_MOCK = false;
// Автоматически выдаем права админа в тестовом режиме
export const MOCK_ADMIN_RIGHTS = false; 

export const ENDPOINTS = {
  // Расписание
  getSchedule: (startDate: string, endDate: string) =>
    `/api/schedule?start_date=${startDate}&end_date=${endDate}`,
  getScheduleForChildren: (weekIndex: number) => `/api/schedule/week?week_index=${weekIndex}`,
  getTeacherSchedule: (teacherName: string, weekIndex: number) =>
    `/api/schedule/teacher?teacher_name=${encodeURIComponent(teacherName)}&week_index=${weekIndex}`,

  // Занятия
  confirmLessonAction: (lessonId: number) =>
    `/api/lessons/confirm-action?lesson_id=${lessonId}`,

  // Курсы
  getCoursesShort: (type: string) => `/api/courses/?type=${type}`,
  getCourseDetail: (courseId: number) => `/api/courses/${courseId}/detail`,

  // Преподаватели
  getAllTeachers: () => `/api/teachers/`,

  // Программы
  getPrograms: () => `/api/register/programs`,

  // Сохранение детей
  saveChildren: () => `/api/children`,

  // Уведомления
  subscribeDevice: () => `/api/notifications/subscribe`,

  // Аутентификация
  verifyAdmin: () => `/api/auth/verify-admin`,

  // Админ
  // Исключения
  deleteException: (data: { group_id: number; exception_date: string; status: string }) =>
  `/api/exceptions?group_id=${data.group_id}&exception_date=${data.exception_date}&status=${data.status}`,

  // Разовые занятия
  createOneTimeLesson: () => `/api/one-time`,
 
  // Преподаватели (админ)
  createTeacher: () => `/api/admin/teachers/`,
  updateTeacher: (teacherId: number) => `/api/admin/teachers/${teacherId}`,
  deleteTeacher: (teacherId: number) => `/api/admin/teachers/${teacherId}`,
};
