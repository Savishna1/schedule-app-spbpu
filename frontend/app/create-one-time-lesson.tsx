import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { adminApi } from "@/scr/api/adminApi";
import { programsApi } from "@/scr/api/programsApi";
import { teachersApi, TeacherShort } from "@/scr/api/teachersApi";

export default function CreateOneTimeLessonScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [hasAdminRights, setHasAdminRights] = useState(false);

  // Программы, годы, группы 
  const [programs, setPrograms] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [programsError, setProgramsError] = useState(false);

  // Преподаватели
  const [allTeachers, setAllTeachers] = useState<TeacherShort[]>([]);
  const [teachersError, setTeachersError] = useState(false);

  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [showTeacherPicker, setShowTeacherPicker] = useState(false);

  const [form, setForm] = useState({
    program: "",
    study_year: 0,
    group_number: "",
    date: "",
    start_time: "",
    end_time: "",
    room: "",
    teacher: "",
  });

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    checkAdminRights();
    loadData();
  }, []);

  const checkAdminRights = async () => {
    const rights = await AsyncStorage.getItem("hasAdminRights");
    if (rights !== "true") {
      Alert.alert("Доступ запрещён", "У вас нет прав на создание разовых занятий");
      router.back();
    } else {
      setHasAdminRights(true);
    }
  };

  // Программы и преподаватели грузятся независимо друг от друга
  const loadPrograms = async () => {
    try {
      setProgramsError(false);
      const data = await programsApi.getPrograms();
      setPrograms(data.map((p) => p.name));
    } catch (error) {
      console.error("Ошибка загрузки программ:", error);
      setProgramsError(true);
    }
  };

  const loadTeachers = async () => {
    try {
      setTeachersError(false);
      const teachers = await teachersApi.getAllTeachers();
      setAllTeachers(teachers);
    } catch (error) {
      console.error("Ошибка загрузки преподавателей:", error);
      setTeachersError(true);
    }
  };

  const loadData = async () => {
    setDataLoading(true);
    await Promise.all([loadPrograms(), loadTeachers()]);
    setDataLoading(false);
  };

  const handleProgramSelect = async (programName: string) => {
    setForm((prev) => ({
      ...prev,
      program: programName,
      study_year: 0,
      group_number: "",
    }));
    setYears([]);
    setGroups([]);
    setShowProgramPicker(false);

    try {
      const loadedYears = await programsApi.getStudyYears(programName);
      setYears(loadedYears);
    } catch (error) {
      console.error("Ошибка загрузки годов:", error);
      Alert.alert("Ошибка", "Не удалось загрузить годы обучения");
    }
  };

  const handleYearSelect = async (year: number) => {
    setForm((prev) => ({ ...prev, study_year: year, group_number: "" }));
    setGroups([]);

    try {
      const loadedGroups = await programsApi.getGroups(form.program, year);
      setGroups(loadedGroups);
    } catch (error) {
      console.error("Ошибка загрузки групп:", error);
      Alert.alert("Ошибка", "Не удалось загрузить группы");
    }
  };

  const handleGroupSelect = (groupNumber: string) => {
    setForm((prev) => ({ ...prev, group_number: groupNumber }));
  };

  const handleTeacherSelect = (teacher: TeacherShort) => {
    setForm((prev) => ({ ...prev, teacher: teacher.name }));
    setShowTeacherPicker(false);
  };

  const handleSubmit = async () => {
    if (
      !form.program ||
      !form.study_year ||
      !form.group_number ||
      !form.date ||
      !form.start_time ||
      !form.end_time ||
      !form.room ||
      !form.teacher
    ) {
      Alert.alert("Ошибка", "Заполните все поля");
      return;
    }

    // Проверка формата даты
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(form.date)) {
      Alert.alert("Ошибка", "Дата должна быть в формате ГГГГ-ММ-ДД");
      return;
    }

    // Проверка формата времени
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(form.start_time) || !timeRegex.test(form.end_time)) {
      Alert.alert("Ошибка", "Время должно быть в формате ЧЧ:ММ");
      return;
    }

    setLoading(true);
    try {
      const response = await adminApi.createOneTimeLesson({
        program: form.program,
        study_year: form.study_year,
        group_number: form.group_number,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        room: form.room,
        teacher: form.teacher,
      });
      console.log("✅ Разовое занятие создано:", response);
      await AsyncStorage.setItem("lastScheduleChange", Date.now().toString());
      Alert.alert("Успех", "Разовое занятие создано", [
        {
          text: "OK",
          onPress: () => {
            router.replace({
              pathname: "/(tabs)/groups",
              params: { refresh: Date.now().toString() },
            });
          },
        },
      ]);
    } catch (error) {
      console.error("Ошибка создания:", error);
      Alert.alert("Ошибка", "Не удалось создать занятие");
    } finally {
      setLoading(false);
    }
  };

  if (!hasAdminRights || dataLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3958a3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Разовое занятие</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Выбор программы */}
        <Text style={styles.label}>Программа *</Text>
        {programsError ? (
          <TouchableOpacity style={styles.errorBox} onPress={loadPrograms}>
            <Ionicons name="refresh" size={18} color="#e74c3c" />
            <Text style={styles.errorText}>
              Не удалось загрузить программы. Нажмите, чтобы повторить
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowProgramPicker(!showProgramPicker)}
          >
            <Text style={styles.pickerButtonText}>
              {form.program || "Выберите программу"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        )}

        {showProgramPicker && (
          <View style={styles.pickerContainer}>
            <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
              {programs.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={[
                    styles.pickerOption,
                    form.program === name && styles.pickerOptionSelected,
                  ]}
                  onPress={() => handleProgramSelect(name)}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      form.program === name && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Выбор года обучения */}
        {years.length > 0 && (
          <>
            <Text style={styles.label}>Год обучения *</Text>
            <View style={styles.groupsContainer}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.groupButton,
                    form.study_year === year && styles.groupButtonSelected,
                  ]}
                  onPress={() => handleYearSelect(year)}
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      form.study_year === year && styles.groupButtonTextSelected,
                    ]}
                  >
                    {year} год
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Выбор группы */}
        {form.study_year > 0 && groups.length > 0 && (
          <>
            <Text style={styles.label}>Группа *</Text>
            <View style={styles.groupsContainer}>
              {groups.map((grp) => (
                <TouchableOpacity
                  key={grp}
                  style={[
                    styles.groupButton,
                    form.group_number === grp && styles.groupButtonSelected,
                  ]}
                  onPress={() => handleGroupSelect(grp)}
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      form.group_number === grp && styles.groupButtonTextSelected,
                    ]}
                  >
                    {grp}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Дата * (ГГГГ-ММ-ДД)</Text>
        <TextInput
          style={styles.input}
          value={form.date}
          onChangeText={(text) => setForm({ ...form, date: text })}
          placeholder="2026-11-20"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Время начала * (ЧЧ:ММ)</Text>
        <TextInput
          style={styles.input}
          value={form.start_time}
          onChangeText={(text) => setForm({ ...form, start_time: text })}
          placeholder="10:00"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Время окончания * (ЧЧ:ММ)</Text>
        <TextInput
          style={styles.input}
          value={form.end_time}
          onChangeText={(text) => setForm({ ...form, end_time: text })}
          placeholder="11:30"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Кабинет *</Text>
        <TextInput
          style={styles.input}
          value={form.room}
          onChangeText={(text) => setForm({ ...form, room: text })}
          placeholder="101"
          placeholderTextColor="#999"
        />

        {/* Выбор преподавателя */}
        <Text style={styles.label}>Преподаватель *</Text>
        {teachersError ? (
          <TouchableOpacity style={styles.errorBox} onPress={loadTeachers}>
            <Ionicons name="refresh" size={18} color="#e74c3c" />
            <Text style={styles.errorText}>
              Не удалось загрузить преподавателей. Нажмите, чтобы повторить
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowTeacherPicker(!showTeacherPicker)}
          >
            <Text style={styles.pickerButtonText}>
              {form.teacher || "Выберите преподавателя"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        )}

        {showTeacherPicker && (
          <View style={styles.pickerContainer}>
            <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
              {allTeachers.length === 0 ? (
                <Text style={styles.emptyText}>Список преподавателей пуст</Text>
              ) : (
                allTeachers.map((teacher) => (
                  <TouchableOpacity
                    key={teacher.id}
                    style={[
                      styles.pickerOption,
                      form.teacher === teacher.name && styles.pickerOptionSelected,
                    ]}
                    onPress={() => handleTeacherSelect(teacher)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        form.teacher === teacher.name &&
                          styles.pickerOptionTextSelected,
                      ]}
                    >
                      {teacher.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? "Создание..." : "Создать занятие"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#3958a3",
    paddingHorizontal: 16,
  paddingTop: 55,      
  paddingBottom: 10,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  content: { padding: 16 },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34495e",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
  },
  pickerButtonText: { fontSize: 16, color: "#333", flex: 1 },
  pickerContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "white",
    maxHeight: 200,
  },
  pickerScroll: { maxHeight: 200 },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerOptionSelected: { backgroundColor: "#3958a3" },
  pickerOptionText: { fontSize: 14, color: "#333" },
  pickerOptionTextSelected: { color: "white" },
  emptyText: { padding: 12, fontSize: 14, color: "#999" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fdecea",
    borderWidth: 1,
    borderColor: "#f5c6c2",
    borderRadius: 8,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 14, color: "#e74c3c" },
  groupsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  groupButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  groupButtonSelected: { backgroundColor: "#3958a3" },
  groupButtonText: { color: "#2c3e50" },
  groupButtonTextSelected: { color: "white" },
  saveButton: {
    backgroundColor: "#27ae60",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  saveButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
