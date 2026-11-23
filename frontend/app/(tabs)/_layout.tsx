import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import MyDataModal from "@/scr/components/MyDataModal"; 

export default function TabLayout() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadRole = async () => {
      const role = await AsyncStorage.getItem("userRole");
      setUserRole(role);
    };
    loadRole();
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#c8cfcb",
          tabBarInactiveTintColor: "#95a5a6",
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#3958a3",
            paddingBottom: 5,
            paddingTop: 5,
            height: 70,
          },
          headerShown: false,
        }}
      >
        {/* Вкладка РАСПИСАНИЕ */}
        <Tabs.Screen
          name="groups"
          options={{
            headerShown: false,
            href: userRole === "guest" ? null : undefined,
            tabBarIcon: ({ color }) => (
              <Ionicons name="calendar" size={30} color={color} />
            ),
          }}
        />

        {/* Вкладка ПРОФИЛЬ */}
        <Tabs.Screen
          name="profile"
          options={{
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-circle-outline" size={32} color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault(); 
              setModalVisible(true); 
            },
          }}
        />

      </Tabs>

      <MyDataModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </>
  );
}
