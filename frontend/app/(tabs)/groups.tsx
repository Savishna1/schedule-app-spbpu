import GroupsScreen from "@/scr/screens/GroupsScreen";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useCallback } from "react";

export default function Groups() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ headerShown: false });
    }, [navigation]),
  );

  return <GroupsScreen />;
}

