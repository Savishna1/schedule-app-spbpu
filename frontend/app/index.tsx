import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const role = await AsyncStorage.getItem("userRole");

      if (role === "parent") {
        const children = await AsyncStorage.getItem("userChildren");
        if (children && JSON.parse(children).length > 0) {
          router.replace("/(tabs)/groups");
        } else {
          router.replace("/parent-register");
        }
      } 
      else if (role === "teacher") {
        const teacher = await AsyncStorage.getItem("selectedTeacher");
        if (teacher) {
          router.replace("/(tabs)/groups");
        } else {
          router.replace("/teacher-register");
        }
      } 
      else {
        router.replace("/role-select");
      }
    };
    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3958a3" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#f5f5f5" 
  },
});
