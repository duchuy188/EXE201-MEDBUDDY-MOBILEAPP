import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Appbar, Searchbar, Card } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const categories = [
  {
    id: "1",
    title: "Tài khoản & Hồ sơ",
    description: "Quản lý tài khoản, hồ sơ và người thân",
    articles: 10,
    icon: "person-circle-outline",
  },
  {
    id: "2",
    title: "Thuốc & Nhắc nhở",
    description: "Hướng dẫn thêm, sửa, xóa và nhắc nhở thuốc",
    articles: 20,
    icon: "medkit-outline",
  },
  {
    id: "3",
    title: "Báo cáo & Chia sẻ dữ liệu",
    description: "Cách chia sẻ thông tin cho bác sĩ và người thân",
    articles: 14,
    icon: "bar-chart-outline",
  },
  {
    id: "4",
    title: "Cài đặt ứng dụng",
    description: "Điều chỉnh thông báo, ngôn ngữ, bảo mật",
    articles: 10,
    icon: "settings-outline",
  },
  {
    id: "5",
    title: "Liên hệ hỗ trợ",
    description: "Liên hệ với đội ngũ chăm sóc khách hàng",
    articles: 1,
    icon: "call-outline",
  },
];

const HelpCenterScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = React.useState("");

  // Hàm loại bỏ dấu tiếng Việt và chuyển về chữ thường
  function normalizeVN(str: string) {
    return str
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }

  // Lọc danh mục theo từ khóa tìm kiếm, không phân biệt hoa thường và dấu
  const filteredCategories = categories.filter((item) => {
    const q = normalizeVN(searchQuery);
    return (
      normalizeVN(item.title).includes(q) ||
      normalizeVN(item.description).includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header style={styles.header}>
        <Appbar.Action icon="arrow-left" color="#fff" onPress={() => navigation.goBack()} />
        <Appbar.Content title="Trung tâm trợ giúp" color="#fff" />
      </Appbar.Header>

      {/* Search */}
      <Searchbar
        placeholder="Tìm kiếm bài viết..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Danh mục */}
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("ArticleList", { category: item })}
          >
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Ionicons name={item.icon} size={32} color="#2563EB" style={styles.icon} />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc}>{item.description}</Text>
                  <Text style={styles.cardArticles}>{item.articles} bài viết</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" style={styles.arrowRight} />
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={{textAlign:'center',marginTop:32,color:'#888'}}>Không tìm thấy kết quả phù hợp</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { backgroundColor: "#2563EB" },
  searchBar: { margin: 16, borderRadius: 12 },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: "#fff",
  },
  cardContent: { flexDirection: "row", alignItems: "center" },
  arrowRight: { marginLeft: 8 },
  icon: { marginRight: 16 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  cardDesc: { fontSize: 14, color: "#374151", marginVertical: 4 },
  cardArticles: { fontSize: 12, color: "#6B7280" },
});

export default HelpCenterScreen;
