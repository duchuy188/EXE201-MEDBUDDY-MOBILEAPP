
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { helpArticles, HelpArticle } from '../api/helpcenter';

const ArticleListScreen = ({ route, navigation }: any) => {
  // Nếu navigation không truyền vào props thì dùng hook
  const nav = navigation || useNavigation();
  const { category } = route.params || {};

  // Lọc bài viết theo category nếu có
  const articles: HelpArticle[] = category?.title
    ? helpArticles.filter((a) => a.category === category.title)
    : helpArticles;

  // State cho modal bài viết
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openArticle = (article: HelpArticle) => {
    setSelectedArticle(article);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setSelectedArticle(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000000ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category?.title || 'Danh sách bài viết'}</Text>
      </View>
      <Text style={styles.desc}>{category?.description}</Text>
      <Text style={styles.info}>Số lượng bài viết: {articles.length}</Text>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openArticle(item)} activeOpacity={0.7}>
            <View style={styles.articleItem}>
              <Text style={styles.articleTitle}>{item.title}</Text>
              <Text style={styles.articleContent} numberOfLines={2}>{item.content.replace(/\n/g, ' ').trim()}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>Không có bài viết nào.</Text>}
        contentContainerStyle={{ paddingBottom: 32 }}
      />

      {/* Modal xem chi tiết bài viết */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.modalTitle} numberOfLines={2}>{selectedArticle?.title}</Text>
              <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#2563EB" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.modalBody}>{selectedArticle?.content?.trim()}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F6FF', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingTop: 36 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#000000ff', flex: 1 },
  desc: { fontSize: 16, color: '#374151', marginBottom: 8 },
  info: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  articleItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  articleTitle: { fontSize: 16, fontWeight: 'bold', color: '#2563EB', marginBottom: 4 },
  articleContent: { fontSize: 14, color: '#374151' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
    flex: 1,
    marginRight: 8,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 8,
  },
});

export default ArticleListScreen;
