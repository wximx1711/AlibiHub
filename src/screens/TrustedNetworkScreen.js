import React, { useState } from 'react';
import {
  View,
  Share,
  Linking,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import Header from '../components/Header';

export default function TrustedNetworkScreen({
  trustedContacts = [],
  onAddContact,
  onDeleteContact,
  onBack,
}) {
  const [currentCoords, setCurrentCoords] = useState(null); // { lat, lng, timestamp }
  const [isLocating, setIsLocating] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  // Add Contact Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');

  // Native GPS Location Retrieval using expo-location
  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      // 1. Request foreground permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Chưa cấp quyền vị trí',
          'Vui lòng cấp quyền truy cập vị trí trong Cài đặt thiết bị để sử dụng tính năng GPS cứu hộ. Bạn vẫn có thể mở trực tiếp Google Maps.',
          [
            { text: 'Đóng', style: 'cancel' },
            {
              text: 'Mở Google Maps',
              onPress: () => Linking.openURL('https://www.google.com/maps').catch(() => {}),
            },
          ]
        );
        return;
      }

      // 2. Query real device GPS location
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      const nowStr = new Date().toLocaleTimeString('vi-VN');

      setCurrentCoords({ lat, lng, timestamp: nowStr });
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

      Alert.alert(
        'Đã xác định vị trí GPS',
        `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}\nThời điểm: ${nowStr}\n\nBạn có thể mở xem trên Google Maps hoặc gửi tin nhắn khẩn cấp kèm vị trí này.`,
        [
          { text: 'Đóng', style: 'cancel' },
          {
            text: 'Mở Google Maps',
            onPress: () => Linking.openURL(mapsUrl).catch(() => {}),
          },
        ]
      );
    } catch (err) {
      // Fallback attempt via browser geolocation if running in web
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const nowStr = new Date().toLocaleTimeString('vi-VN');
            setCurrentCoords({ lat, lng, timestamp: nowStr });
          },
          () => {
            Alert.alert(
              'Không thể lấy vị trí',
              'Thiết bị chưa bật GPS hoặc chưa cấp quyền. Bạn có thể mở Google Maps thủ công.',
              [
                { text: 'Đóng', style: 'cancel' },
                {
                  text: 'Mở Google Maps',
                  onPress: () => Linking.openURL('https://www.google.com/maps').catch(() => {}),
                },
              ]
            );
          }
        );
      } else {
        Alert.alert(
          'Không thể lấy vị trí',
          `${err.message || 'Thiết bị chưa bật GPS'}. Bạn có thể mở Google Maps thủ công.`,
          [
            { text: 'Đóng', style: 'cancel' },
            {
              text: 'Mở Google Maps',
              onPress: () => Linking.openURL('https://www.google.com/maps').catch(() => {}),
            },
          ]
        );
      }
    } finally {
      setIsLocating(false);
    }
  };

  const handleOpenGoogleMaps = () => {
    if (currentCoords) {
      Linking.openURL(`https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`).catch(() => {});
    } else {
      Linking.openURL('https://www.google.com/maps').catch(() => {});
    }
  };

  const handleSendSos = async () => {
    try {
      const locationPart = currentCoords
        ? `\n📍 Tọa độ GPS của mình (${currentCoords.timestamp}): https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`
        : '';
      await Share.share({
        message: `[AlibiHub Khẩn cấp] Mình đang cần bạn hỗ trợ gấp. Vui lòng gọi lại cho mình ngay khi có thể!${locationPart}`,
        title: 'Lời nhờ hỗ trợ khẩn cấp',
      });
      setSosSent(true);
      setTimeout(() => setSosSent(false), 5000);
    } catch (err) {
      Alert.alert('Không thể chia sẻ', err.message);
    }
  };

  const handleSaveContact = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tên và số điện thoại.');
      return;
    }
    try {
      await onAddContact({
        name: name.trim(),
        relationship: relationship.trim() || 'Bạn bè',
        phone: phone.trim(),
      });
      setIsModalOpen(false);
      setName('');
      setRelationship('');
      setPhone('');
    } catch (err) {
      Alert.alert('Không thể lưu', err.message);
    }
  };

  return (
    <View style={styles.safeArea}>
      <Header
        title="Mạng Lưới Tin Cậy"
        subtitle="Hỗ trợ thoát hiểm & kết nối khẩn cấp (FE4)"
        rightAction={() => setIsModalOpen(true)}
        rightLabel="+ Thêm bạn"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>DANH BẠ TIN CẬY (TRUSTED CONTACTS)</Text>
          <Text style={styles.introText}>
            Lưu liên hệ trực tiếp trên thiết bị của bạn. Hỗ trợ gọi điện tức thì và chia sẻ tin nhắn nhờ can thiệp khẩn cấp qua ứng dụng bạn chọn.
          </Text>
        </View>

        {/* SOS Emergency Button */}
        <View style={styles.sosCard}>
          <Text style={styles.sosTitle}>GỬI YÊU CẦU HỖ TRỢ KHẨN CẤP (SOS)</Text>
          <Text style={styles.sosDesc}>
            Gửi nhanh thông điệp cần can thiệp tới bạn bè tin cậy qua Zalo, Messenger hoặc SMS. Tự động đính kèm liên kết Google Maps nếu đã lấy GPS.
          </Text>
          <TouchableOpacity
            style={[styles.sosBtn, sosSent && styles.sosBtnSent]}
            onPress={handleSendSos}
            activeOpacity={0.85}
          >
            <Text style={styles.sosBtnText}>
              {sosSent ? '✓ ĐÃ MỞ BẢNG CHIA SẺ SOS' : '🚨 GỬI YÊU CẦU HỖ TRỢ NGAY'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Real GPS Location Snapshot */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationTitle}>ĐỊNH VỊ KHẨN CẤP (GPS NATIVE)</Text>
            {currentCoords ? (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>● ĐÃ CÓ TỌA ĐỘ GPS</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.locationSub}>
            Lấy tọa độ thực từ cảm biến GPS của thiết bị qua expo-location và tạo liên kết Google Maps để gửi cho người thân.
          </Text>

          {currentCoords ? (
            <View style={styles.gpsInfoBox}>
              <Text style={styles.gpsCoordinates}>
                📍 Tọa độ GPS: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
              </Text>
              <Text style={styles.gpsTimestamp}>Cập nhật lúc: {currentCoords.timestamp}</Text>
              <TouchableOpacity onPress={handleOpenGoogleMaps} style={styles.mapsLinkRow}>
                <Text style={styles.gpsAddress}>Mở xem vị trí trên Google Maps ↗</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.locationBtnRow}>
            <TouchableOpacity
              style={styles.locationToggleBtn}
              onPress={handleGetLocation}
              disabled={isLocating}
              activeOpacity={0.8}
            >
              {isLocating ? (
                <View style={styles.locatingRow}>
                  <ActivityIndicator size="small" color="#FFFDF8" />
                  <Text style={[styles.locationToggleText, { marginLeft: 8 }]}>Đang định vị...</Text>
                </View>
              ) : (
                <Text style={styles.locationToggleText}>
                  {currentCoords ? '🔄 CẬP NHẬT LẠI VỊ TRÍ' : '📍 LẤY VỊ TRÍ HIỆN TẠI (GPS)'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.openMapsBtn}
              onPress={handleOpenGoogleMaps}
              activeOpacity={0.8}
            >
              <Text style={styles.openMapsBtnText}>🗺️ Mở Bản Đồ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Friends List */}
        <View style={styles.contactsSection}>
          <Text style={styles.sectionTitle}>
            DANH SÁCH BẠN BÈ TIN CẬY ({trustedContacts.length})
          </Text>

          {trustedContacts.length > 0 ? (
            trustedContacts.map((contact) => (
              <View key={contact.id} style={styles.contactItem}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {contact.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactRel}>{contact.relationship} • {contact.phone}</Text>
                  <Text style={styles.contactStatus}>● Lưu an toàn trên máy</Text>
                </View>

                <TouchableOpacity
                  style={styles.callContactBtn}
                  onPress={() =>
                    Linking.openURL('tel:' + contact.phone.replace(/[^+0-9]/g, '')).catch(() =>
                      Alert.alert('Không thể gọi', 'Thiết bị chưa có ứng dụng gọi điện.')
                    )
                  }
                >
                  <Text style={styles.callContactText}>📞 Gọi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteContactBtn}
                  onPress={async () => {
                    try {
                      await onDeleteContact(contact.id);
                    } catch (err) {
                      Alert.alert('Không thể xóa', err.message);
                    }
                  }}
                >
                  <Text style={styles.deleteContactText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyContactsCard}>
              <Text style={styles.emptyContactsText}>
                Chưa có liên hệ tin cậy nào. Nhấn "+ Thêm bạn" để lưu số người thân.
              </Text>
            </View>
          )}
        </View>

        {/* Ethical statement */}
        <View style={styles.ethicalNotice}>
          <Text style={styles.ethicalText}>
            🔒 Cam kết AlibiHub: Không chia sẻ dữ liệu cho bên thứ ba, không giả mạo vị trí số. Mọi quyền truy cập vị trí và cuộc gọi chỉ kích hoạt khi có sự đồng ý trực tiếp của bạn.
          </Text>
        </View>
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm Bạn Bè Tin Cậy</Text>

            <Text style={styles.fieldLabel}>Họ và tên:</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="VD: Nguyễn Văn Nam..."
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Mối quan hệ:</Text>
            <TextInput
              style={styles.input}
              value={relationship}
              onChangeText={setRelationship}
              placeholder="VD: Bạn thân, Chị gái, Đồng nghiệp..."
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Số điện thoại:</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="VD: 0987 654 321"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveContact}
              >
                <Text style={styles.modalSaveText}>Lưu Liên Hệ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl * 2,
  },
  introCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  introTitle: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  introText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
  },
  sosCard: {
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(197, 48, 48, 0.25)',
  },
  sosTitle: {
    color: colors.error,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sosDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginBottom: spacing.md,
  },
  sosBtn: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  sosBtnSent: {
    backgroundColor: colors.success,
  },
  sosBtnText: {
    color: '#FFFDF8',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  locationCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationTitle: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  liveBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.success,
  },
  liveBadgeText: {
    color: colors.success,
    fontSize: typography.fontSizes.xs - 2,
    fontWeight: typography.fontWeights.bold,
  },
  locationSub: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  gpsInfoBox: {
    backgroundColor: colors.bgDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.success,
  },
  gpsCoordinates: {
    color: colors.success,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  gpsTimestamp: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
    marginTop: 2,
  },
  mapsLinkRow: {
    marginTop: 6,
  },
  gpsAddress: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
  locationBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  locationToggleBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationToggleText: {
    color: '#FFFDF8',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  openMapsBtn: {
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgCardElevated,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  openMapsBtnText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
  contactsSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  contactItem: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: '#FFFDF8',
    fontSize: 14,
    fontWeight: typography.fontWeights.bold,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  contactRel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 1,
  },
  contactStatus: {
    color: colors.success,
    fontSize: typography.fontSizes.xs - 2,
    marginTop: 2,
  },
  callContactBtn: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.success,
  },
  callContactText: {
    color: colors.success,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
  deleteContactBtn: {
    padding: spacing.sm,
  },
  deleteContactText: {
    color: colors.error,
    fontSize: typography.fontSizes.xs,
  },
  emptyContactsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  emptyContactsText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs,
  },
  ethicalNotice: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  ethicalText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs - 1,
    lineHeight: 18,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.bgCardElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xl,
  },
  modalCancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.md,
  },
  modalCancelText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.sm,
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  modalSaveText: {
    color: '#FFFDF8',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
});
