import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import Header from '../components/Header';

export default function TrustedNetworkScreen({
  trustedContacts = [],
  onAddContact,
  onDeleteContact,
  onBack,
}) {
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [sharingSeconds, setSharingSeconds] = useState(900); // 15 mins
  const [sosSent, setSosSent] = useState(false);

  // Add Contact Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');

  // Location sharing countdown timer
  useEffect(() => {
    let timer = null;
    if (isSharingLocation && sharingSeconds > 0) {
      timer = setInterval(() => {
        setSharingSeconds((prev) => {
          if (prev <= 1) {
            setIsSharingLocation(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSharingLocation, sharingSeconds]);

  const formatTimer = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleToggleLocationSharing = () => Alert.alert('Chưa hỗ trợ GPS', 'Bản hiện tại chưa chia sẻ vị trí trực tiếp. Bạn có thể dùng tính năng chia sẻ vị trí của ứng dụng nhắn tin.');
  const handleSendSos = async () => {
    try { await Share.share({ message: 'Mình cần bạn hỗ trợ. Bạn gọi điện cho mình ngay khi có thể nhé.' }); }
    catch (err) { Alert.alert('Không thể chia sẻ', err.message); }
  };
  const handleSaveContact = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tên và số điện thoại.');
      return;
    }
    try { await onAddContact({
      name: name.trim(),
      relationship: relationship.trim() || 'Bạn bè',
      phone: phone.trim(),
    });
    setIsModalOpen(false);
    setName('');
    setRelationship('');
    setPhone('');
    } catch (err) { Alert.alert('Không thể lưu', err.message); }
  };

  return (
    <View style={styles.safeArea}>
      <Header
        title="Alibi Connect"
        subtitle="Mạng lưới bạn bè tin cậy hỗ trợ thật"
        rightAction={() => setIsModalOpen(true)}
        rightLabel="+ Thêm bạn"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>BẠN BÈ TIN CẬY (TRUSTED NETWORK)</Text>
          <Text style={styles.introText}>
            Lưu liên hệ trên thiết bị, mở trình gọi điện hoặc chia sẻ lời nhờ hỗ trợ qua ứng dụng nhắn tin bạn chọn. Người dùng tự xác nhận gửi.
          </Text>
        </View>

        {/* SOS Emergency Button */}
        <View style={styles.sosCard}>
          <Text style={styles.sosTitle}>GỬI YÊU CẦU HỖ TRỢ KHẨN CẤP</Text>
          <Text style={styles.sosDesc}>
            Mở bảng chia sẻ để chọn người nhận và gửi tin nhắn nhờ hỗ trợ.
          </Text>
          <TouchableOpacity
            style={[styles.sosBtn, sosSent && styles.sosBtnSent]}
            onPress={handleSendSos}
            activeOpacity={0.85}
          >
            <Text style={styles.sosBtnText}>
              {'CHIA SẺ LỜI NHỜ HỖ TRỢ'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Temporary Location Sharing (GPS) */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationTitle}>CHIA SẺ VỊ TRÍ CÓ THỜI HẠN (GPS)</Text>
            {isSharingLocation ? (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>● ĐANG CHIA SẺ ({formatTimer(sharingSeconds)})</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.locationSub}>
            Chia sẻ GPS có thời hạn và nhận yêu cầu trong app thuộc Phase 2, chưa được triển khai trong bản này.
          </Text>



          <TouchableOpacity
            style={[styles.locationToggleBtn, isSharingLocation && styles.locationRevokeBtn]}
            onPress={handleToggleLocationSharing}
            activeOpacity={0.8}
          >
            <Text style={styles.locationToggleText}>
              {'Tìm hiểu giới hạn GPS'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Friends List */}
        <View style={styles.contactsSection}>
          <Text style={styles.sectionTitle}>
            DANH SÁCH BẠN BÈ TIN CẬY ({trustedContacts.length})
          </Text>

          {trustedContacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {contact.name.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRel}>{contact.relationship} • {contact.phone}</Text>
                <Text style={styles.contactStatus}>● Liên hệ lưu trên thiết bị</Text>
              </View>
<TouchableOpacity onPress={() => Linking.openURL('tel:' + contact.phone.replace(/[^+0-9]/g, '')).catch(() => Alert.alert('Không thể gọi', 'Thiết bị chưa có ứng dụng gọi điện.'))}><Text style={styles.contactStatus}>Gọi</Text></TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteContactBtn}
                onPress={async () => { try { await onDeleteContact(contact.id); } catch (err) { Alert.alert('Không thể xóa', err.message); } }}
              >
                <Text style={styles.deleteContactText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Ethical statement */}
        <View style={styles.ethicalNotice}>
          <Text style={styles.ethicalText}>
            🔒 Cam kết AlibiHub: Không ghép đôi người lạ, không giả mạo vị trí hay bằng chứng số. Toàn bộ tính năng kết nối hoạt động dựa trên sự đồng thuận và minh bạch.
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
              placeholder="VD: Bạn thân, Chị gái, Đồng nghiệp tin cậy..."
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Số điện thoại:</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="VD: 0901 234 567"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveContact}
              >
                <Text style={styles.saveText}>Thêm vào mạng lưới</Text>
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
    color: colors.textPrimary,
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
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
    color: '#FFFFFF',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  locationCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
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
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  liveBadge: {
    backgroundColor: colors.success + '25',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
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
  gpsAddress: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
  },
  locationToggleBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  locationRevokeBtn: {
    backgroundColor: colors.error,
  },
  locationToggleText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  contactsSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.textSecondary,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  deleteContactBtn: {
    padding: spacing.sm,
  },
  deleteContactText: {
    color: colors.error,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    marginBottom: 4,
    marginTop: spacing.sm,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xl,
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.md,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.sm,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
});

