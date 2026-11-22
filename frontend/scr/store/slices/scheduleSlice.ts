import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChildRequest, DaySchedule, scheduleApi } from "../../api/scheduleApi";

export const fetchScheduleForChildren = createAsyncThunk(
  "schedule/fetchScheduleForChildren",
  async ({ children, weekIndex }: { children: ChildRequest[]; weekIndex: number }) => {
    const response = await scheduleApi.getScheduleForChildren(children, weekIndex);
    console.log("🔥 Оригинальный ответ:", JSON.stringify(response, null, 2));
    return response;
  },
);

export const fetchWeekSchedule = createAsyncThunk(
  "schedule/fetchWeekSchedule",
  async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    const response = await scheduleApi.getWeekSchedule(startDate, endDate);
    console.log("🔥 Оригинальный ответ week:", JSON.stringify(response, null, 2));
    return response;
  },
);

const getNextSixDays = (startDate: Date): string[] => {
  const dates = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
};

const getDayofWeek = (dateStr: string): string => {
  const days = [
    "Воскресенье",
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
  ];
  const date = new Date(dateStr);
  return days[date.getDay()];
};

const initialState = {
  weekDays: [] as DaySchedule[],
  startDate: new Date().toISOString().split("T")[0],
  loading: false,
  error: null as string | null,
};

const scheduleSlice = createSlice({
  name: "schedule",
  initialState,
  reducers: {
    createEmptyWeek: (state) => {
      const dates = getNextSixDays(new Date(state.startDate));
      state.weekDays = dates.map((date) => ({
        date,
        day_of_week: getDayofWeek(date),
        lessons: [],
      }));
    },

    setWeekSchedule: (state, action: PayloadAction<DaySchedule[]>) => {
      state.weekDays = action.payload;
      state.loading = false;
      state.error = null;
    },

    clearWeekSchedule: (state) => {
      state.weekDays = [];
    },

    nextWeek: (state) => {
      const currentStart = new Date(state.startDate);
      currentStart.setDate(currentStart.getDate() + 6);
      state.startDate = currentStart.toISOString().split("T")[0];
      state.weekDays = [];
    },

    prevWeek: (state) => {
      const currentStart = new Date(state.startDate);
      currentStart.setDate(currentStart.getDate() - 6);
      state.startDate = currentStart.toISOString().split("T")[0];
      state.weekDays = [];
    },

    resetToToday: (state) => {
      state.startDate = new Date().toISOString().split("T")[0];
      state.weekDays = [];
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchScheduleForChildren.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchScheduleForChildren.fulfilled, (state, action) => {
        state.loading = false;
        console.log("🔥🔥🔥 fetchScheduleForChildren.fulfilled");
        console.log("🔥 Получено дней:", action.payload.length);
        console.log("🔥 Первый день с занятиями:", action.payload.find(day => day.lessons.length > 0));
        state.weekDays = action.payload;
        console.log("🔥 state.weekDays после обновления:", state.weekDays.length);
      })
      .addCase(fetchScheduleForChildren.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Ошибка загрузки расписания";
      })
      .addCase(fetchWeekSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeekSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.weekDays = action.payload;
      })
      .addCase(fetchWeekSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Ошибка загрузки расписания";
      });
  },
});

export const {
  createEmptyWeek,
  setWeekSchedule,
  clearWeekSchedule,
  nextWeek,
  prevWeek,
  resetToToday,
  setLoading,
  setError,
} = scheduleSlice.actions;

export default scheduleSlice.reducer;
