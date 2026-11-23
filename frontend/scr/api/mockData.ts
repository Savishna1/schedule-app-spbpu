export const USE_MOCK = false; 

export const MOCK_WEEK_SCHEDULE = [
  {
    date: new Date().toISOString().split("T")[0],
    day_of_week: "Понедельник",
    lessons: [
      {
        id: 1,
        start_time: "10:00:00",
        end_time: "11:30:00",
        program_name: "Робототехника",
        teacher_name: "Иванов Иван",
        room: "101",
        schedule_status: "scheduled",
        child_name: "Миша",
      },
      {
        id: 2,
        start_time: "12:00:00",
        end_time: "13:00:00",
        program_name: "Английский язык",
        teacher_name: "Смит Джон",
        room: "202",
        schedule_status: "scheduled",
        child_name: "Миша",
      }
    ],
  },
  {
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    day_of_week: "Вторник",
    lessons: [
      {
        id: 3,
        start_time: "15:00:00",
        end_time: "16:30:00",
        program_name: "Рисование",
        teacher_name: "Петрова Анна",
        room: "305",
        schedule_status: "отменено",
        child_name: "Миша",
      }
    ],
  },
  {
    date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
    day_of_week: "Среда",
    lessons: [
      {
        id: 4,
        start_time: "09:00:00",
        end_time: "10:00:00",
        program_name: "Шахматы",
        teacher_name: "Сидоров Петр",
        room: "Актовый зал",
        schedule_status: "дополнительное",
        child_name: "Миша",
      }
    ],
  },
  {
    date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    day_of_week: "Четверг",
    lessons: [
      {
        id: 5,
        start_time: "14:00:00",
        end_time: "15:30:00",
        program_name: "Программирование",
        teacher_name: "Иванов Иван",
        room: "404",
        schedule_status: "scheduled",
        child_name: "Миша",
      }
    ],
  },
  {
    date: new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0],
    day_of_week: "Пятница",
    lessons: [
      {
        id: 6,
        start_time: "11:00:00",
        end_time: "12:00:00",
        program_name: "Английский язык",
        teacher_name: "Смит Джон",
        room: "202",
        schedule_status: "перенесено",
        child_name: "Миша",
        new_date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0], // Перенос на субботу
        new_start_time: "10:00:00",
        new_end_time: "11:00:00"
      }
    ],
  },
  {
    date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    day_of_week: "Суббота",
    lessons: [
      {
        id: 7,
        start_time: "10:00:00",
        end_time: "11:00:00",
        program_name: "Английский язык",
        teacher_name: "Смит Джон",
        room: "202",
        schedule_status: "scheduled",
        child_name: "Миша",
      }
    ],
  },
  {
    date: new Date(Date.now() + 6 * 86400000).toISOString().split("T")[0],
    day_of_week: "Воскресенье",
    lessons: [], 
  }
];  

export const MOCK_TEACHERS = [
  { id: 1, name: "Иванов Иван" },
  { id: 2, name: "Смит Джон" },
  { id: 3, name: "Петрова Анна" },
  { id: 4, name: "Сидоров Петр" },
];

export const MOCK_PROGRAMS = [
  { id: 1, name: "Робототехника", groups: ["A", "B"], study_year: 1 },
  { id: 2, name: "Английский язык", groups: ["C"], study_year: 2 },
];

export const MOCK_COURSES = [
  {
    id: 1,
    title: "Робототехника",
    age: "7-10 лет",
    has_places: true,
    price: 0,
    description: "Собираем роботов",
    materials: "Конструктор",
    groups: [
      { study_year: 1, group_number: "А" },
      { study_year: 1, group_number: "Б" }
    ]
  },
  {
    id: 2,
    title: "Английский язык",
    age: "10-14 лет",
    has_places: true,
    price: 3500,
    description: "Разговорный английский",
    materials: "Учебник",
    groups: [
      { study_year: 2, group_number: "C" }
    ]
  }
];
