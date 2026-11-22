import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface MyDataModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function MyDataModal({ visible, onClose }: MyDataModalProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasAdminRights, setHasAdminRights] = useState(false);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [userChildren, setUserChildren] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      const loadData = async () => {
        const role = await AsyncStorage.getItem("userRole");
        setUserRole(role);

        const adminRights = await AsyncStorage.getItem("hasAdminRights");
        const token = await AsyncStorage.getItem("adminToken");
        const isAdmin = (role === "teacher" && adminRights === "true") || (role === "teacher" && !!token);
        setHasAdminRights(isAdmin);

        const teacherNameStored = await AsyncStorage.getItem("teacherName");
        if (teacherNameStored) setTeacherName(teacherNameStored);

        const childrenStored = await AsyncStorage.getItem("userChildren");
        if (childrenStored) setUserChildren(JSON.parse(childrenStored));
      };
      loadData();
    }
  }, [visible]);

  const handleLogout = async () => {
    Alert.alert("Выход", "Вы уверены, что хотите выйти?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Выйти",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          onClose(); 
          router.replace("/role-select");
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Профиль
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>

            {/* Контент для родителей */}
            {userRole === "parent" && (
              <>
                <Text style={styles.modalSectionTitle}>Мои дети</Text>
                {userChildren.length === 0 ? (
                  <Text style={styles.modalEmptyText}>Нет добавленных детей</Text>
                ) : (
                  userChildren.map((child, index) => (
                    <View key={index} style={styles.modalItemRow}>
                      <Ionicons name="person" size={20} color="#3958a3" />
                      <Text style={styles.modalItemName}>{child.name}</Text>
                      <Text style={styles.modalItemDetails}>
                        выбрано программ: {child.groups?.length || 0}
                      </Text>
                    </View>
                  ))
                )}
                <TouchableOpacity
                  style={styles.modalEditButton}
                  onPress={() => { onClose(); router.push("/parent-register"); }}
                >
                  <Ionicons name="create-outline" size={20} color="#3958a3" />
                  <Text style={styles.modalEditButtonText}>Редактировать детей</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Контент для учителя */}
            {userRole === "teacher" && (
              <>
                <Text style={styles.modalSectionTitle}>Мои данные</Text>
                {teacherName ? (
                  <View style={styles.modalItemRow}>
                    <Ionicons name="school" size={20} color="#27ae60" />
                    <Text style={styles.modalItemName}>{teacherName}</Text>
                    <Text style={styles.modalItemDetails}>Преподаватель</Text>
                  </View>
                ) : (
                  <Text style={styles.modalEmptyText}>Преподаватель не выбран</Text>
                )}
                <TouchableOpacity
                  style={styles.modalEditButton}
                  onPress={() => { onClose(); router.push("/teacher-register"); }}
                >
                  <Ionicons name="create-outline" size={20} color="#3958a3" />
                  <Text style={styles.modalEditButtonText}>Редактировать преподавателя</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Кнопки для админа */}
            {hasAdminRights && (
              <>
                <TouchableOpacity style={styles.modalExceptionsButton} onPress={() => { onClose(); router.push("/manage-exceptions"); }}>
                  <Ionicons name="warning-outline" size={20} color="white" />
                  <Text style={styles.modalExceptionsButtonText}>Управление исключениями</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalOneTimeButton} onPress={() => { onClose(); router.push("/create-one-time-lesson"); }}>
                  <Ionicons name="add-circle-outline" size={20} color="white" />
                  <Text style={styles.modalOneTimeButtonText}>Разовое занятие</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Кнопка выхода */}
            <TouchableOpacity style={styles.modalLogoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text style={styles.modalLogoutText}>Выйти</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "flex-end" 
  },
  modalContent: { 
    backgroundColor: "white", 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    maxHeight: "80%" 
  },
  modalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: "#e0e0e0" 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#333" 
  },
  modalBody: { 
    padding: 16 
  },
  modalSectionTitle: { 
    fontSize: 18, 
    fontWeight: "600", 
    marginBottom: 12, 
    color: "#2c3e50" 
  },
  modalItemRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: "#f0f0f0" 
  },
  modalItemName: { 
    flex: 1, 
    fontSize: 16, 
    marginLeft: 12, 
    color: "#333" 
  },
  modalItemDetails: { 
    fontSize: 14, 
    color: "#7f8c8d" 
  },
  modalEmptyText: { 
    fontSize: 14, 
    color: "#999", 
    textAlign: "center", 
    paddingVertical: 20 
  },
  modalEditButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    marginTop: 16, 
    paddingVertical: 12, 
    backgroundColor: "#e8f0fe", 
    borderRadius: 8 
  },
  modalEditButtonText: { 
    color: "#3958a3", 
    marginLeft: 8, 
    fontWeight: "500" 
  },
  modalExceptionsButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "#f39c12", 
    marginTop: 12, 
    padding: 12, 
    borderRadius: 8, 
    gap: 8 
  },
  modalExceptionsButtonText: { 
    color: "white", 
    fontSize: 16, 
    fontWeight: "600" 
  },
  modalOneTimeButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "#2196f3", 
    marginTop: 12, 
    padding: 12, 
    borderRadius: 8, 
    gap: 8 
  },
  modalOneTimeButtonText: { 
    color: "white", 
    fontSize: 16, 
    fontWeight: "600" 
  },
  modalLogoutButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "#e74c3c", 
    marginTop: 12, 
    padding: 12, 
    borderRadius: 8, 
    gap: 8 
  },
  modalLogoutText: { 
    color: "white", 
    fontSize: 16, 
    fontWeight: "600" 
  },
});
