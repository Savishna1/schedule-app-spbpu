import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { scheduleApi } from "../api/scheduleApi";
import { teachersApi, TeacherShort } from "../api/teachersApi";
import DayCard from "../components/DayCard";
import GroupCard from "../components/GroupCard";
import { AppDispatch, RootState } from "../store";
import {
  fetchScheduleForChildren,
  setWeekSchedule,
} from "../store/slices/scheduleSlice";

export default function GroupsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { weekDays, loading } = useSelector(
    (state: RootState) => state.schedule,
  );
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = (screenWidth - 16) / 7; 
  const cardSpacing = 1;
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [userChildren, setUserChildren] = useState<any[]>([]);
  const [updatingLessonId, setUpdatingLessonId] = useState<number | null>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [hasAdminRights, setHasAdminRights] = useState(false);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [allTeachers, setAllTeachers] = useState<TeacherShort[]>([]);

  const [postponeModalVisible, setPostponeModalVisible] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newTeacher, setNewTeacher] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [showTeacherPicker, setShowTeacherPicker] = useState(false);

  const isLessonForUser = (lesson: any) => {
    if (userRole === "parent") {
      if (userChildren.length === 0) {
        console.log("👶 Нет детей, показываем все занятия");
        return true;
      }
      const hasChild = userChildren.some((child: any) =>
        child.groups.some(
          (group: any) => group.program === lesson.program_name,
        ),
      );
      console.log(`🔍 Занятие "${lesson.program_name}" для родителя: ${hasChild ? "✅ ПОКАЗЫВАЕМ" : "❌ СКРЫВАЕМ"}`);
      return hasChild;
    } else if (userRole === "teacher") {
      return true;
    }
    return true;
  };

  const isRegularStatus = (status: string) =>
    status === "по расписанию" || status === "scheduled";

  const isPostponedStatus = (status: string) =>
    status === "перенесено" || status === "postponed";

  const getVisibleLessons = (day: any) => {
    const filtered = day.lessons.filter(isLessonForUser);

    const postponedKeys = new Set(
      filtered
        .filter((l: any) => isPostponedStatus(l.schedule_status))
        .map((l: any) => `${l.id}-${l.start_time}`),
    );

    return filtered.filter(
      (l: any) =>
        !(
          isRegularStatus(l.schedule_status) &&
          postponedKeys.has(`${l.id}-${l.start_time}`)
        ),
    );
  };

  const getDisplayStatus = (lesson: any, dayDate?: string) => {
    if (
      isRegularStatus(lesson.schedule_status) &&
      lesson.new_date &&
      dayDate &&
      lesson.new_date === dayDate
    ) {
      return "перенесено";
    }
    return lesson.schedule_status;
  };

  const lessonToGroup = (lesson: any) => {
    console.log("🔍 lessonToGroup для родителя:", {
      program_name: lesson.program_name,
      teacher_name: lesson.teacher_name,
      room: lesson.room,
      schedule_status: lesson.schedule_status
    });
    const childrenForLesson = userChildren.filter((c: any) =>
      c.groups.some(
        (g: { program: string; group_number: string }) =>
          g.program === lesson.program_name,
      ),
    );

    const childNames = childrenForLesson.map((c) => c.name).join(", ");

    return {
      id: lesson.id,
      program_id: lesson.program_id,
      group_id: lesson.group_id,
      name: lesson.program_name,
      description: lesson.teacher_name ? `👨‍🏫 ${lesson.teacher_name}` : "",
      age: lesson.room ? `📍 ${lesson.room}` : "",
      time: `${lesson.start_time.slice(0, 5)} - ${lesson.end_time.slice(0, 5)}`,
      child_name: childNames || null,
      schedule_status: getDisplayStatus(lesson, selectedDayData?.date),
      start_time: lesson.start_time,
      end_time: lesson.end_time,
      room: lesson.room,
      teacher_name: lesson.teacher_name,
      lesson_date: lesson.lesson_date || lesson.date,
      date: lesson.date,
      is_one_time: lesson.is_one_time || false,
    };
  };

  // Проверка дней на наличие проблем (отмены/переносы)
  const checkDayForIssues = (day: any) => {
    const filteredLessons = day.lessons.filter(isLessonForUser);
    const hasIssues = filteredLessons.some(
      (lesson: any) =>
        lesson.schedule_status === "отменено" ||
        lesson.schedule_status === "перенесено" ||
        lesson.schedule_status === "cancelled" ||
        lesson.schedule_status === "postponed"
    );
    return hasIssues;
  };

  // Форматирование недели
  const formatWeekRange = () => {
    if (weekDays.length === 0) return "";
    const start = weekDays[0].date.split("-");
    const end = weekDays[weekDays.length - 1].date.split("-");
    return `${start[2]}.${start[1]} - ${end[2]}.${end[1]}`;
  };

  // Проверка валидности даты
  const isValidDate = (dateStr: string): boolean => {
    let formattedDate = dateStr;
    if (dateStr.includes(".")) {
      const parts = dateStr.split(".");
      if (parts[0].length === 4) {
        formattedDate = `${parts[0]}-${parts[2]}-${parts[1]}`;
      } else {
        formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    
    const selectedDate = new Date(formattedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return selectedDate >= today;
  };

  // Обработчик отмены занятия
  const handleCancelLesson = async (lesson: any) => {
    if (!hasAdminRights) {
      Alert.alert("Доступ запрещён", "У вас нет прав на отмену занятий");
      return;
    }
    Alert.alert(
      "Отмена занятия",
      `Вы уверены, что хотите отменить занятие "${lesson.program_name}"?`,
      [
        { text: "Нет", style: "cancel" },
        {
          text: "Да, отменить",
          style: "destructive",
          onPress: async () => {
            if (updatingLessonId !== null) return;
            setUpdatingLessonId(lesson.id);
            try {
              const lessonDate = selectedDayData?.date || new Date().toISOString().split("T")[0];
              
              await scheduleApi.confirmLessonAction(
                lesson.id, 
                { status: "cancelled" }, 
                lessonDate,
                lesson.program_name
              );
              console.log("✅ Занятие отменено:", lesson.id);
              await AsyncStorage.removeItem("hasShownChangesAlert");
              Alert.alert("Успех", "Занятие отменено");
              await AsyncStorage.setItem("lastScheduleChange", Date.now().toString());
              if (userRole === "teacher" && teacherName) {
                const data = await scheduleApi.getTeacherSchedule(teacherName, currentWeekIndex);
                dispatch(setWeekSchedule(data));
              } else if (userRole === "parent") {
                const childrenStored = await AsyncStorage.getItem("userChildren");
                if (childrenStored) {
                  const children = JSON.parse(childrenStored);
                  const dataToSend = children.map((child: any) => ({
                    name: child.name,
                    groups: child.groups.map((group: any) => ({
                      program: group.program,
                      study_year: group.study_year,
                      group_number: group.group_number,
                    })),
                  }));
                  dispatch(fetchScheduleForChildren({ children: dataToSend, weekIndex: currentWeekIndex }));
                  await AsyncStorage.setItem("lastScheduleChange", Date.now().toString());
                }
              }
            } catch (error) {
              console.error("Ошибка отмены:", error);
              Alert.alert("Ошибка", "Не удалось отменить занятие");
            } finally {
              setUpdatingLessonId(null);
            }
          },
        },
      ],
    );
  };

  // Открытие модалки переноса
  const openPostponeModal = (lesson: any) => {
    if (!hasAdminRights) {
      Alert.alert("Доступ запрещён", "У вас нет прав на перенос занятий");
      return;
    }
    
    console.log("🔍 Открываем модалку для занятия:", lesson);
    
    setSelectedLesson({
      id: lesson.id,
      program_name: lesson.program_name,
      program_id: lesson.program_id,
      teacher_name: lesson.teacher_name,
      room: lesson.room,
      start_time: lesson.start_time,
      end_time: lesson.end_time,
      child_name: lesson.child_name,
      schedule_status: lesson.schedule_status,
      date: selectedDayData?.date
    });
    
    setNewDate(selectedDayData?.date || "");
    setNewStartTime(lesson.start_time?.slice(0, 5) || "");
    setNewEndTime(lesson.end_time?.slice(0, 5) || "");
    setNewTeacher(lesson.teacher_name || "");
    setNewRoom(lesson.room || "");
    setPostponeModalVisible(true);
  };

  // Выбор преподавателя
  const selectTeacher = (teacher: TeacherShort) => {
    setNewTeacher(teacher.name);
    setShowTeacherPicker(false);
  };

  // Сохранение переноса
const handleSavePostpone = async () => {
  if (updatingLessonId !== null) return;
  if (!newDate || !newStartTime || !newEndTime) {
    Alert.alert("Ошибка", "Заполните все поля");
    return;
  }
  if (!isValidDate(newDate)) {
    Alert.alert("Ошибка", "Дата переноса не может быть в прошлом. Выберите сегодняшний или будущий день.");
    return;
  }
  if (!newStartTime.match(/^\d{2}:\d{2}$/) || !newEndTime.match(/^\d{2}:\d{2}$/)) {
    Alert.alert("Ошибка", "Время должно быть в формате ЧЧ:ММ");
    return;
  }

  let formattedDate = newDate;
  if (newDate.includes(".")) {
    const parts = newDate.split(".");
    if (parts[0].length === 4) {
      formattedDate = `${parts[0]}-${parts[2]}-${parts[1]}`;
    } else {
      formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  setUpdatingLessonId(selectedLesson.id);
  setPostponeModalVisible(false);

  try {
    const lessonDate = selectedDayData?.date || new Date().toISOString().split("T")[0];
    
    console.log("📅 Перенос занятия:", selectedLesson.id);
    console.log("📅 Исходная дата:", lessonDate);
    console.log("📅 Новая дата:", formattedDate);
    console.log("👨‍🏫 Новый учитель:", newTeacher);
    console.log("📍 Новая комната:", newRoom);
    
    await scheduleApi.confirmLessonAction(
      selectedLesson.id,
      {
        status: "postponed",
        new_date: formattedDate,
        new_start_time: newStartTime ,
        new_end_time: newEndTime ,
        new_room: newRoom,
        new_teacher: newTeacher
      },
      lessonDate,
      selectedLesson.program_name
    );
    
    console.log("✅ Занятие перенесено на бэкенде");
    
    if (userRole === "teacher" && teacherName) {
      const data = await scheduleApi.getTeacherSchedule(teacherName, currentWeekIndex);
      dispatch(setWeekSchedule(data));
    } else if (userRole === "parent") {
      const childrenStored = await AsyncStorage.getItem("userChildren");
      if (childrenStored) {
        const children = JSON.parse(childrenStored);
        const dataToSend = children.map((child: any) => ({
          name: child.name,
          groups: child.groups.map((group: any) => ({
            program: group.program,
            study_year: group.study_year,
            group_number: group.group_number,
          })),
        }));
        dispatch(fetchScheduleForChildren({ children: dataToSend, weekIndex: currentWeekIndex }));
      }
    }
    
    await AsyncStorage.removeItem("hasShownChangesAlert");
    Alert.alert("Успех", `Занятие перенесено на ${formattedDate} в ${newStartTime}`);
    
    await AsyncStorage.setItem("lastScheduleChange", Date.now().toString());
    setSelectedLesson(null);
    setNewDate("");
    setNewStartTime("");
    setNewEndTime("");
    setNewTeacher("");
    setNewRoom("");
  } catch (error) {
    console.error("Ошибка переноса:", error);
    Alert.alert("Ошибка", "Не удалось перенести занятие");
  } finally {
    setUpdatingLessonId(null);
  }
};

  // Рендер карточки с кнопками для админа
  const renderLessonWithAdmin = (lesson: any, index: number = 0) => {
    const lessonData = lessonToGroup(lesson);

    return (
      <View
        key={`${lesson.id}-${lesson.start_time}-${lesson.schedule_status}-${index}`}
        style={styles.lessonContainer}
      >
        <GroupCard group={lessonData} />
        {userRole === "teacher" && hasAdminRights && (
          <View style={styles.adminButtons}>
            <TouchableOpacity
              style={[styles.adminButton, styles.cancelButton]}
              onPress={() => handleCancelLesson(lesson)}
              disabled={updatingLessonId === lesson.id}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={styles.adminButtonText}>Отменить</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.adminButton, styles.postponeButton]}
              onPress={() => openPostponeModal(lesson)}
              disabled={updatingLessonId === lesson.id}
            >
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.adminButtonText}>Перенести</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Загружаем список преподавателей
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const teachers = await teachersApi.getAllTeachers();
        setAllTeachers(teachers);
      } catch (error) {
        console.error("Ошибка загрузки преподавателей:", error);
      }
    };
    loadTeachers();
  }, []);

  // Загружаем расписание для учителя через API
  useEffect(() => {
    const loadTeacherSchedule = async () => {
      if (userRole === "teacher" && teacherName) {
        try {
          console.log("📅 Загружаем расписание для учителя:", teacherName, "неделя:", currentWeekIndex);
          const data = await scheduleApi.getTeacherSchedule(teacherName, currentWeekIndex);
          console.log("📅 Полученные данные:", JSON.stringify(data, null, 2));
          console.log("🔍 Ищем разовые занятия (is_one_time):", data.some(day => day.lessons.some((l: any) => l.is_one_time)));
          dispatch(setWeekSchedule(data));
          setSelectedDate("");
        } catch (error) {
          console.error("Ошибка загрузки расписания учителя:", error);
        }
      }
    };
    
    if (userRole === "teacher" && teacherName) {
      loadTeacherSchedule();
    }
  }, [userRole, teacherName, currentWeekIndex]);

  // Загружаем расписание для родителей с учётом недели
useEffect(() => {
  const loadScheduleForParents = async () => {
    try {
      let dataToSend = null;
      
      if (userRole === "parent") {
        const childrenStored = await AsyncStorage.getItem("userChildren");
        if (childrenStored) {
          const children = JSON.parse(childrenStored);
          dataToSend = children.map((child: any) => ({
            name: child.name,
            groups: child.groups.map((group: any) => ({
              program: group.program,
              study_year: group.study_year,
              group_number: group.group_number,
            })),
          }));
        }
      }
      
      if (dataToSend && dataToSend.length > 0) {
        console.log("📦 Отправляем данные для получения расписания, неделя:", currentWeekIndex);
        console.log("📦 Данные:", JSON.stringify(dataToSend, null, 2));
        
        const result = await dispatch(fetchScheduleForChildren({ children: dataToSend, weekIndex: currentWeekIndex }));
        console.log("🔥 РЕЗУЛЬТАТ ДИСПАТЧА:", result);
        console.log("🔥 Данные в result.payload:", result.payload);
      } else {
        console.log("👶 Нет данных для загрузки расписания");
      }
    } catch (error) {
      console.error("Ошибка загрузки расписания:", error);
    }
  };

  if (userRole === "parent" ) {
    loadScheduleForParents();
  }
}, [userRole, userChildren, currentWeekIndex, dispatch]);

  // Загружаем все данные пользователя
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const role = await AsyncStorage.getItem("userRole");
        setUserRole(role);
        console.log("Роль пользователя:", role);

        const adminRights = await AsyncStorage.getItem("hasAdminRights");
        setHasAdminRights(adminRights === "true");

        const teacherNameStored = await AsyncStorage.getItem("teacherName");
        if (teacherNameStored) {
          setTeacherName(teacherNameStored);
          console.log("👨‍🏫 Имя учителя:", teacherNameStored);
        }

        const teacherStored = await AsyncStorage.getItem("teacherData");
        if (teacherStored) {
          const parsed = JSON.parse(teacherStored);
          setTeacherData(parsed);
          console.log("📦 Загруженные группы учителя:", parsed.groups);
        }

        const childrenStored = await AsyncStorage.getItem("userChildren");
        if (childrenStored) {
          setUserChildren(JSON.parse(childrenStored));
          console.log("Дети загружены:", JSON.parse(childrenStored));
        }
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
      }
    };
    loadUserData();
  }, []);

  // Отслеживаем изменения weekDays
  useEffect(() => {
    console.log("🔥🔥🔥 weekDays ИЗМЕНИЛСЯ! Длина:", weekDays.length);
    console.log("🔥🔥🔥 Подробно:", weekDays.map(day => ({
      date: day.date,
      lessonsCount: day.lessons.length,
      lessons: day.lessons.map(l => l.program_name)
    })));
  }, [weekDays]);

  // Отладка дней недели и выбранного дня
  useEffect(() => {
    if (weekDays.length > 0) {
      console.log("📅 Все дни недели:", weekDays.map(day => ({
        date: day.date,
        lessonsCount: day.lessons.length,
        filteredCount: day.lessons.filter(isLessonForUser).length
      })));
      
      if (!selectedDate) {
        setSelectedDate(weekDays[0].date);
      }
    }
  }, [weekDays]);

  // Отладка выбранного дня
  useEffect(() => {
    if (selectedDate && selectedDayData) {
      console.log("📅 Выбранный день:", selectedDate);
      console.log("📅 Количество занятий в этот день:", selectedDayData?.lessons.length);
      console.log("📅 Отфильтрованных занятий:", selectedDayData?.lessons.filter(isLessonForUser).length);
    }
  }, [selectedDate, weekDays]);

  // Выбранный день
  const selectedDayData = weekDays.find((day) => day.date === selectedDate);

  // Навигация по неделям
  const handlePrevWeek = () => {
    setCurrentWeekIndex(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setCurrentWeekIndex(prev => prev + 1);
  };

  const handleResetToToday = () => {
    setCurrentWeekIndex(0);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4e8045" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevWeek}>
          <Ionicons name="chevron-back" size={24} color="#ede5e5" />
        </TouchableOpacity>

        <View style={styles.weekInfo}>
          <Text style={styles.weekRange}>{formatWeekRange()}</Text>
          <TouchableOpacity onPress={handleResetToToday}>
            <Text style={styles.todayButton}>Текущая неделя</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleNextWeek}>
          <Ionicons name="chevron-forward" size={24} color="#ede5e5" />
        </TouchableOpacity>
      </View>

      {weekDays.length > 0 && (
        <View style={styles.daysRow}>
          {weekDays.map((item) => {
            const [, , day] = item.date.split("-");
            return (
              <View key={item.date} style={{ width: cardWidth, paddingHorizontal: cardSpacing }}>
                <DayCard
                  dayName={item.day_of_week}
                  date={item.date}
                  dayNumber={day}
                  month="" 
                  lessonCount={getVisibleLessons(item).length}
                  hasIssues={checkDayForIssues(item)}
                  isSelected={item.date === selectedDate}
                  onPress={() => setSelectedDate(item.date)}
                />
              </View>
            );
          })}
        </View>
      )}

      <ScrollView style={styles.lessonsContainer}>
        {selectedDayData && (
          <>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>
                {selectedDayData.day_of_week},{" "}
                {selectedDayData.date.split("-").reverse().join(".")}
              </Text>
              <Text style={styles.lessonCount}>
                {getVisibleLessons(selectedDayData).length} занятий
              </Text>
            </View>

            {(() => {
              const visibleLessons = getVisibleLessons(selectedDayData);

              if (visibleLessons.length === 0) {
                return (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>
                      В этот день занятий нет
                    </Text>
                  </View>
                );
              }

              return visibleLessons.map((lesson: any, index: number) =>
                renderLessonWithAdmin(lesson, index),
              );
            })()}
          </>
        )}
      </ScrollView>

      <Modal
        visible={postponeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPostponeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Перенос занятия</Text>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalLabel}>Новая дата (ГГГГ-ММ-ДД)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="2026-04-28"
                value={newDate}
                onChangeText={setNewDate}
              />

              <Text style={styles.modalLabel}>Новое время начала (ЧЧ:ММ)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="10:00"
                value={newStartTime}
                onChangeText={setNewStartTime}
              />

              <Text style={styles.modalLabel}>Новое время окончания (ЧЧ:ММ)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="11:30"
                value={newEndTime}
                onChangeText={setNewEndTime}
              />

              <Text style={styles.modalLabel}>Преподаватель</Text>
              <TouchableOpacity 
                style={styles.modalPickerButton} 
                onPress={() => setShowTeacherPicker(!showTeacherPicker)}
              >
                <Text style={styles.modalPickerButtonText}>
                  {newTeacher || "Выберите преподавателя"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              {showTeacherPicker && (
                <View style={styles.teacherPickerContainer}>
                  <ScrollView style={styles.teacherPickerScroll}>
                    {allTeachers.map((teacher) => (
                      <TouchableOpacity
                        key={teacher.id}
                        style={[
                          styles.teacherOption,
                          newTeacher === teacher.name && styles.teacherOptionSelected
                        ]}
                        onPress={() => selectTeacher(teacher)}
                      >
                        <Text style={[
                          styles.teacherOptionText,
                          newTeacher === teacher.name && styles.teacherOptionTextSelected
                        ]}>
                          {teacher.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.modalLabel}>Кабинет</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Номер кабинета"
                value={newRoom}
                onChangeText={setNewRoom}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setPostponeModalVisible(false);
                    setShowTeacherPicker(false);
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalSaveButton]}
                  onPress={handleSavePostpone}
                >
                  <Text style={styles.modalSaveButtonText}>Сохранить</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,    
    paddingBottom: 10,
    backgroundColor: "#3958a3",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
    daysRow: {
    flexDirection: "row",
    paddingHorizontal: 2, 
    paddingVertical: 15,
    backgroundColor: "white",
    justifyContent: "flex-start", 
  },
  weekInfo: { 
    alignItems: "center" 
  },
  weekRange: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#ede5e5" 
  },
  todayButton: { 
    fontSize: 14, 
    color: "#f4f4f3", 
    marginTop: 4 
  },
  daysList: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: "white",
  },
  lessonsContainer: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingTop: 5,},

  dayHeader: {
    paddingVertical: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dayTitle: { 
    fontSize: 18, 
    fontWeight: "600", 
    color: "#333" 
  },
  lessonCount: { 
    fontSize: 14, 
    color: "#666" 
  },
  lessonContainer: { 
    marginBottom: 16 
  },
  adminButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    marginRight: 8,
  },
  adminButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  cancelButton: { 
    backgroundColor: "#e74c3c" 
  },
  postponeButton: { 
    backgroundColor: "#f39c12" 
  },
  adminButtonText: { 
    color: "white", 
    fontSize: 12, 
    fontWeight: "500" 
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyText: { 
    fontSize: 16, 
    color: "#999", 
    marginTop: 12 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalScroll: {
    padding: 20,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#333", 
    marginBottom: 16, 
    textAlign: "center" 
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 4,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  modalPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  modalPickerButtonText: {
    fontSize: 16,
    color: "#333",
  },
  teacherPickerContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "white",
    maxHeight: 200,
  },
  teacherPickerScroll: {
    maxHeight: 200,
  },
  teacherOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  teacherOptionSelected: {
    backgroundColor: "#3958a3",
  },
  teacherOptionText: {
    fontSize: 14,
    color: "#333",
  },
  teacherOptionTextSelected: {
    color: "white",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  modalButton: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 8, 
    alignItems: "center" 
  },
  modalCancelButton: { 
    backgroundColor: "#e0e0e0" 
  },
  modalCancelButtonText: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#333" 
  },
  modalSaveButton: { 
    backgroundColor: "#f39c12" 
  },
  modalSaveButtonText: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "white" 
  },
});
