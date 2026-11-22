import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import { adminApi } from "@/scr/api/adminApi";
import { scheduleApi } from "@/scr/api/scheduleApi";
import { setWeekSchedule } from "@/scr/store/slices/scheduleSlice"; 
import { API_URL } from "@/scr/api/config";

interface RecentException {
  id: number;
  group_id: number;
  exception_date: string;
  status: string;
  new_date?: string;
  new_start_time?: string;
  new_end_time?: string;
  new_room?: string;
  new_teacher?: string;
  group_name: string;
}

export default function ManageExceptionsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [exceptions, setExceptions] = useState<RecentException[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAdminRights, setHasAdminRights] = useState(false);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    checkAdminRights();
  }, []);

  const checkAdminRights = async () => {
    try {
      const role = await AsyncStorage.getItem("userRole");
      const adminRights = await AsyncStorage.getItem("hasAdminRights");
      const token = await AsyncStorage.getItem("adminToken");
      
      const isAdmin = (role === "teacher" && adminRights === "true") || (role === "teacher" && !!token);
      
      if (!isAdmin) {
        Alert.alert("Доступ запрещён", "У вас нет прав на управление исключениями");
        router.back();
      } else {
        setHasAdminRights(true);
        const teacherNameStored = await AsyncStorage.getItem("teacherName");
        setTeacherName(teacherNameStored);
        loadExceptions();
      }
    } catch (error) {
      console.error("Ошибка проверки прав:", error);
      router.back();
    }
  };

  // Функция загрузки исключений через API /recent
const loadExceptions = async () => {
  setLoading(true);
  try {
    const token = await AsyncStorage.getItem("adminToken");
    
    console.log("🔍 Загружаем исключения...");
    console.log("  URL:", `${API_URL}/api/recent`);
    console.log("  Token есть?", !!token);
    console.log("  Token значение:", token?.substring(0, 50) + "...");
    
    const response = await fetch(`${API_URL}/api/recent`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    
    console.log("  Статус ответа:", response.status);
    console.log("  OK?", response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log("  Текст ошибки:", errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: RecentException[] = await response.json();
     data.forEach((item, index) => {
      console.log(`📋 Исключение ${index}:`, {
        group_name: item.group_name,
        status: item.status,
        exception_date: item.exception_date,
        new_date: item.new_date,
      });
    });
    console.log("📋 Получено исключений:", data.length);
    setExceptions(data);
  } catch (error) {
    console.error("❌ Ошибка загрузки исключений:", error);
    Alert.alert("Ошибка", "Не удалось загрузить список исключений");
  } finally {
    setLoading(false);
  }
};

  useFocusEffect(
    useCallback(() => {
      if (hasAdminRights) {
        loadExceptions();
      }
    }, [hasAdminRights])
  );

  const handleDeleteException = async (exception: RecentException) => {
  if (!exception.exception_date || exception.exception_date === "null" || exception.exception_date === null) {
    Alert.alert("Ошибка", "Не удалось определить дату исключения");
    console.error("❌ Нет даты для исключения:", exception);
    return;
  }
    Alert.alert(
      "Удаление исключения",
      `Вы уверены, что хотите удалить исключение для занятия "${exception.group_name}" от ${exception.exception_date}?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              console.log("🗑️ Удаление:", {
                group_id: exception.group_id,
                exception_date: exception.exception_date,
                status: exception.status
              });
              
              await adminApi.deleteException({
                group_id: exception.group_id,
                exception_date: exception.exception_date,
                status: exception.status,
              });
              
              Alert.alert("Успех", "Исключение удалено");
              await loadExceptions();
              
              if (teacherName) {
                const data = await scheduleApi.getTeacherSchedule(teacherName, 0);
                dispatch(setWeekSchedule(data));
              }
            } catch (error) {
              console.error("Ошибка удаления:", error);
              Alert.alert("Ошибка", "Не удалось удалить исключение");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  };

  const getStatusIcon = (status: string) => {
    if (status === "отменено" || status === "cancelled") {
      return <Ionicons name="close-circle" size={20} color="#e74c3c" />;
    } else if (status === "перенесено" || status === "postponed") {
      return <Ionicons name="calendar" size={20} color="#f39c12" />;
    }
    return <Ionicons name="add-circle" size={20} color="#27ae60" />;
  };

  const getStatusText = (status: string, item: RecentException) => {
    if (status === "отменено" || status === "cancelled") {
      return "❌ Отменено";
    } else if (status === "перенесено" || status === "postponed") {
      return `⏰ Перенесено на ${formatDate(item.new_date)} ${item.new_start_time?.slice(0,5) || ""}-${item.new_end_time?.slice(0,5) || ""}`;
    }
    return status;
  };

  const getStatusColor = (status: string) => {
    if (status === "отменено" || status === "cancelled") {
      return styles.cancelledStatus;
    } else if (status === "перенесено" || status === "postponed") {
      return styles.postponedStatus;
    }
    return styles.additionalStatus;
  };

 const renderExceptionItem = ({ item }: { item: RecentException }) => {
  const displayDate = item.exception_date && item.exception_date !== "null" && item.exception_date !== null
    ? item.exception_date 
    : (item.new_date || "");
  
  const deleteDate = item.exception_date && item.exception_date !== "null" && item.exception_date !== null
    ? item.exception_date
    : (item.new_date || "");
  
  return (
    <TouchableOpacity
      style={styles.exceptionCard}
      onPress={() => handleDeleteException({ ...item, exception_date: deleteDate })}
      disabled={deleting}
    >
      <View style={styles.exceptionHeader}>
        {getStatusIcon(item.status)}
        <Text style={styles.exceptionProgram}>{item.group_name}</Text>
      </View>
      
      <Text style={styles.exceptionDate}>
        📅 Дата: {formatDate(displayDate)}
      </Text>
      
      {item.status === "перенесено" && item.new_date && (
        <Text style={styles.exceptionNewDate}>
          ➡️ Новая дата: {formatDate(item.new_date)} {item.new_start_time?.slice(0,5)}-{item.new_end_time?.slice(0,5)}
        </Text>
      )}
      
      {item.status === "дополнительное" && item.new_date && (
        <Text style={styles.exceptionNewDate}>
          ✨ Разовое занятие: {formatDate(item.new_date)} {item.new_start_time?.slice(0,5)}-{item.new_end_time?.slice(0,5)}
        </Text>
      )}
      
      {item.new_teacher && (
        <Text style={styles.exceptionTeacher}>👨‍🏫 Преподаватель: {item.new_teacher}</Text>
      )}
      
      {item.new_room && (
        <Text style={styles.exceptionRoom}>📍 Кабинет: {item.new_room}</Text>
      )}
      
      <Text style={[styles.exceptionStatus, getStatusColor(item.status)]}>
        {item.status === "дополнительное" ? "✨ Разовое занятие" : getStatusText(item.status, item)}
      </Text>
      
      <View style={styles.deleteRow}>
        <Ionicons name="trash-outline" size={16} color="#e74c3c" />
        <Text style={styles.deleteText}>Нажмите для удаления</Text>
      </View>
    </TouchableOpacity>
  );
};

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3958a3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Управление исключениями</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Всего исключений: {exceptions.length}
        </Text>
        <Text style={styles.infoSubtext}>
          Нажмите на карточку, чтобы удалить исключение
        </Text>
      </View>

      {exceptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={60} color="#27ae60" />
          <Text style={styles.emptyText}>Нет отмен и переносов</Text>
          <Text style={styles.emptySubtext}>
            Все занятия идут по расписанию
          </Text>
        </View>
      ) : (
        <FlatList
          data={exceptions}
          keyExtractor={(item) => `${item.id}-${item.exception_date}`}
          renderItem={renderExceptionItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f5f5f5" 
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#3958a3",
    paddingHorizontal: 16,
    paddingTop: 55,      
    paddingBottom: 10,
  },
  backButton: { 
    padding: 4 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "600", 
    color: "white", 
    flex: 1, 
    textAlign: "center" 
  },
  infoContainer: {
    backgroundColor: "#e8f0fe",
    padding: 12,
    margin: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  infoText: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#3958a3" 
  },
  infoSubtext: { 
    fontSize: 12, 
    color: "#666", 
    marginTop: 4 
  },
  listContent: { 
    padding: 16, 
    paddingBottom: 20 
  },
  exceptionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exceptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  exceptionProgram: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  exceptionDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  exceptionNewDate: {
    fontSize: 14,
    color: "#f39c12",
    marginBottom: 4,
  },
  exceptionTeacher: {
    fontSize: 14,
    color: "#3958a3",
    marginBottom: 4,
  },
  exceptionRoom: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 8,
  },
  exceptionStatus: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cancelledStatus: { 
    color: "#e74c3c" 
  },
  postponedStatus: { 
    color: "#f39c12" 
  },
  additionalStatus: { 
    color: "#27ae60" 
  },
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  deleteText: { 
    fontSize: 12, 
    color: "#e74c3c" 
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#27ae60", 
    marginTop: 16 
  },
  emptySubtext: { 
    fontSize: 14, 
    color: "#999", 
    marginTop: 8 
  },
});
