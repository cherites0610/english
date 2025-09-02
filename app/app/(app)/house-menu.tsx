import { useState, useEffect } from "react"; // 引入 hooks
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { View, ImageBackground, StyleSheet } from "react-native";
import HouseLayout from "@/src/components/HouseLayout";
import { HouseData, HouseDatas } from "@/src/services/gameService";
import Header from "@/src/components/Header";

export default function HouseMenuScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();

  const [houseData, setHouseData] = useState<HouseData[]>([]);

  useEffect(() => {
    const foundChildData =
      HouseDatas.find((house) => house.id === id)?.child ?? [];
    setHouseData(foundChildData);
  }, [id]);

  const handleHousePress = (houseId: string, houseTitle: string) => {
    router.push({
      pathname: "/dialogue",
      params: { houseId, houseTitle },
    });
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <Header variant="game" title={title} onBackPress={handleGoBack} />

      <ImageBackground
        source={require("@/assets/images/MainScreen/background.png")}
        style={styles.screen}
        resizeMode="center"
      >
        <Stack.Screen options={{ title: "建築選單" }} />
        <HouseLayout
          houses={houseData} // 現在這裡會傳入正確且更新後的資料
          onHousePress={(houseId) => {
            // 這個 find 是安全的，因為 houseId 來自 houseData 內部
            const house = houseData.find((h) => h.id === houseId);
            if (house) {
              handleHousePress(house.id, house.title);
            }
          }}
          verticalOffset={-400}
          horizontalOffset={-50}
        />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
