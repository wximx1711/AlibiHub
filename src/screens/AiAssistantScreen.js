import * as Clipboard from 'expo-clipboard';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme/colors';
import Header from '../components/Header';
import { generateStructuredScenario, generateExitMessage } from '../services/aiService';
import { audioService } from '../services/audioService';

export default function AiAssistantScreen({
  onTransferToCallSimulator,
  onSaveScenarioToVault,
  onBack,
}) {
  useEffect(() => () => audioService.stopAll(), []);
  const [activeTab, setActiveTab] = useState('scenario'); // 'scenario' | 'message' | 'voice'

  // AI2: Scenario Generator State
  const [situationPrompt, setSituationPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [generatedScenario, setGeneratedScenario] = useState(null);
  const [scenarioError, setScenarioError] = useState('');

  // AI1: Message Assistant State
  const [messagePrompt, setMessagePrompt] = useState('');
  const [recipient, setRecipient] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Polite Refusal');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [messageError, setMessageError] = useState('');
  const [copiedNotice, setCopiedNotice] = useState(false);

  // AI3: Voice Script Playback State
  const [playingDialogueIdx, setPlayingDialogueIdx] = useState(null);

  // AI2 Handler
  const handleGenerateScenario = async () => {
    if (!situationPrompt.trim()) {
      setScenarioError('Vui lòng nhập mô tả tình huống cần giải cứu.');
      return;
    }
    setScenarioError('');
    setIsGeneratingScenario(true);
    setGeneratedScenario(null);

    try {
      const result = await generateStructuredScenario(situationPrompt, selectedCategory);
      setGeneratedScenario(result.scenario);
    } catch (err) {
      setScenarioError(err.message || 'Lỗi khi tạo kịch bản với AI.');
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  // AI1 Handler
  const handleGenerateMessage = async () => {
    if (!messagePrompt.trim()) {
      setMessageError('Vui lòng nhập tình huống cần từ chối.');
      return;
    }
    setMessageError('');
    setIsGeneratingMessage(true);
    setGeneratedMessage('');

    try {
      const result = await generateExitMessage(messagePrompt, selectedStyle, recipient);
      setGeneratedMessage(result.text);
    } catch (err) {
      setMessageError(err.message || 'Lỗi khi tạo tin nhắn từ chối.');
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!generatedMessage) return;
    try { await Clipboard.setStringAsync(generatedMessage); } catch (err) { Alert.alert('Không thể sao chép', err.message); return; }
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const handleShareMessage = async () => {
    if (!generatedMessage) return;
    try {
      await Share.share({ message: generatedMessage });
    } catch (_) {}
  };

  const handlePlayDialogue = (line, idx) => {
    setPlayingDialogueIdx(idx);
    audioService.speakDialogueLine(line, () => {
      setPlayingDialogueIdx(null);
    });
  };

  const styleOptions = [
    { id: 'Polite Refusal', label: '🤝 Từ chối lịch sự' },
    { id: 'Professional', label: '👔 Chuyên nghiệp' },
    { id: 'Friendly', label: '😊 Thân thiện' },
    { id: 'Funny', label: '😂 Hài hước' },
    { id: 'Short & Direct', label: '⚡ Ngắn gọn' },
  ];

  return (
    <View style={styles.safeArea}>
      <Header
        title="Trợ lý Trí tuệ Nhân tạo"
        subtitle="Gemini AI — Sáng tạo kịch bản & Diễn đạt khéo léo"
        rightAction={onBack}
        rightLabel="Đóng"
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'scenario' && styles.tabItemActive]}
          onPress={() => setActiveTab('scenario')}
        >
          <Text style={[styles.tabText, activeTab === 'scenario' && styles.tabTextActive]}>
            ✨ Tạo Kịch bản
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'message' && styles.tabItemActive]}
          onPress={() => setActiveTab('message')}
        >
          <Text style={[styles.tabText, activeTab === 'message' && styles.tabTextActive]}>
            💬 Lời Từ chối
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* ======================================================== */}
        {/* TAB 1: AI2 SCENARIO GENERATOR (HIGH PRIORITY) */}
        {/* ======================================================== */}
        {activeTab === 'scenario' ? (
          <View>
            <View style={styles.introBox}>
              <Text style={styles.introTitle}>TẠO KỊCH BẢN CỦA BẠN</Text>
              <Text style={styles.introText}>
                Mô tả tình huống bạn đang gặp phải, Gemini AI sẽ tạo ngay một cấu hình cuộc gọi hoàn chỉnh bao gồm người gọi hợp lý, âm thanh nền, lời thoại từng bước và tin nhắn xin phép.
              </Text>
            </View>

            {/* Input prompt */}
            <View style={styles.card}>
              <Text style={styles.inputLabel}>Mô tả tình huống cần rời đi:</Text>
              <TextInput
                style={styles.textArea}
                value={situationPrompt}
                onChangeText={setSituationPrompt}
                placeholder="VD: Tôi đang bị ép uống rượu trong buổi liên hoan công ty, cần cớ chính đáng để đứng dậy về ngay lập tức..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />

<ScrollView horizontal><TouchableOpacity onPress={() => setSelectedCategory('')}><Text style={styles.sampleChipText}>Tự chọn • </Text></TouchableOpacity>{['Công sở','Gia đình','Bạn bè','Hẹn hò / Tiệc tùng'].map(category => <TouchableOpacity key={category} onPress={() => setSelectedCategory(category)} style={styles.sampleChip}><Text style={styles.sampleChipText}>{selectedCategory === category ? '✓ ' : ''}{category}</Text></TouchableOpacity>)}</ScrollView>
              {/* Sample quick prompts */}
              <View style={styles.samplePromptsWrap}>
                <Text style={styles.samplePromptLabel}>Gợi ý nhanh:</Text>
                <TouchableOpacity
                  style={styles.sampleChip}
                  onPress={() => setSituationPrompt('Buổi tiệc liên hoan công ty kéo dài, sếp và đồng nghiệp đang ép uống rượu.')}
                >
                  <Text style={styles.sampleChipText}>Ép uống rượu tại tiệc</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sampleChip}
                  onPress={() => setSituationPrompt('Buổi hẹn hò đầu tiên không hợp gu, đối phương nói chuyện nhàm chán muốn về sớm.')}
                >
                  <Text style={styles.sampleChipText}>Hẹn hò không hợp gu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sampleChip}
                  onPress={() => setSituationPrompt('Cuộc gặp họ hàng ngày Tết bị tra hỏi chuyện kết hôn và lương thưởng quá nhiều.')}
                >
                  <Text style={styles.sampleChipText}>Bị tra hỏi ngày Tết</Text>
                </TouchableOpacity>
              </View>

              {scenarioError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {scenarioError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryAiBtn, isGeneratingScenario && styles.btnDisabled]}
                onPress={handleGenerateScenario}
                disabled={isGeneratingScenario}
                activeOpacity={0.85}
              >
                {isGeneratingScenario ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.primaryAiBtnText}> Gemini đang tạo kịch bản...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryAiBtnText}>✨ TẠO KỊCH BẢN VỚI GEMINI AI</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Structured Result Preview */}
            {generatedScenario ? (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.aiTag}>
                    <Text style={styles.aiTagText}>AI GENERATED</Text>
                  </View>
                  <Text style={styles.resultCategory}>{generatedScenario.category}</Text>
                </View>

<TextInput style={styles.resultTitle} value={generatedScenario.title} onChangeText={title => setGeneratedScenario({ ...generatedScenario, title })} maxLength={120} />

                {/* Caller & Setting details */}
                <View style={styles.resultDetailsBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>👤 Người gọi đề xuất:</Text>
                    <Text style={styles.detailValue}>
                      {generatedScenario.callerName} ({generatedScenario.callerPhone})
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>⏱️ Thời gian đổ chuông:</Text>
                    <Text style={styles.detailValue}>
                      Sau {generatedScenario.delaySeconds} giây
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🔊 Âm thanh nền:</Text>
                    <Text style={styles.detailValue}>
                      {generatedScenario.ambientSound === 'office' ? 'Văn phòng làm việc' : generatedScenario.ambientSound === 'cafe' ? 'Quán cà phê' : generatedScenario.ambientSound === 'street' ? 'Đường phố' : 'Yên tĩnh'}
                    </Text>
                  </View>
                </View>

                {/* Dialogue Preview */}
                <Text style={styles.dialogueSectionTitle}>Kịch bản thoại từng bước:</Text>
                {generatedScenario.dialogue?.map((line, idx) => (
                  <View key={`ai_line_${idx}`} style={styles.dialogueRow}>
                    <View style={styles.dialogueNum}>
                      <Text style={styles.dialogueNumText}>{idx + 1}</Text>
                    </View>
                    <TextInput style={[styles.dialogueText, { flex: 1 }]} value={line} onChangeText={value => setGeneratedScenario({ ...generatedScenario, dialogue: generatedScenario.dialogue.map((item,i) => i === idx ? value : item) })} multiline maxLength={500} />
                    <TouchableOpacity
                      style={styles.listenBtn}
                      onPress={() => handlePlayDialogue(line, idx)}
                    >
                      <Text style={styles.listenBtnText}>
                        {playingDialogueIdx === idx ? '🔊 Đang đọc' : '▶ Nghe'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Exit Message */}
                {generatedScenario.suggestedMessage ? (
                  <View style={styles.exitMsgBox}>
                    <Text style={styles.exitMsgLabel}>Tin nhắn / Lời chào xin phép:</Text>
                    <TextInput style={styles.exitMsgText} value={generatedScenario.suggestedMessage} onChangeText={suggestedMessage => setGeneratedScenario({ ...generatedScenario, suggestedMessage })} multiline maxLength={1500} />
                  </View>
                ) : null}

                {/* 1-Tap Actions */}
                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={styles.transferBtn}
                    onPress={() => onTransferToCallSimulator(generatedScenario)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.transferBtnText}>
                      📞 Chuyển vào Cuộc gọi Mô phỏng
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveVaultBtn}
                    onPress={async () => { try { await onSaveScenarioToVault(generatedScenario); } catch(err) { setScenarioError(err.message); } }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.saveVaultBtnText}>
                      💾 Lưu vào Kho Kịch bản Vault
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ======================================================== */}
        {/* TAB 2: AI1 MESSAGE & EXCUSE ASSISTANT */}
        {/* ======================================================== */}
        {activeTab === 'message' ? (
          <View>
            <View style={styles.introBox}>
              <Text style={styles.introTitle}>SOẠN TIN NHẮN & LỜI TỪ CHỐI LỊCH SỰ</Text>
              <Text style={styles.introText}>
                Giúp bạn diễn đạt lời từ chối một cách khéo léo, giữ gìn mối quan hệ và thiết lập ranh giới giao tiếp rõ ràng theo 5 phong cách khác nhau.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.inputLabel}>Tình huống cần từ chối hoặc kết thúc:</Text>
              <TextInput
                style={styles.textArea}
                value={messagePrompt}
                onChangeText={setMessagePrompt}
                placeholder="VD: Từ chối đi ăn nhậu với đồng nghiệp tối nay vì cảm thấy mệt mỏi và cần nghỉ ngơi..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Người nhận (tùy chọn):</Text>
              <TextInput
                style={styles.inputSingle}
                value={recipient}
                onChangeText={setRecipient}
                placeholder="VD: Sếp, đồng nghiệp cùng phòng, bạn bè đại học..."
                placeholderTextColor={colors.textMuted}
              />

              {/* Style Selector */}
              <Text style={styles.inputLabel}>Chọn phong cách giao tiếp:</Text>
              <View style={styles.stylesGrid}>
                {styleOptions.map((opt) => {
                  const isSelected = selectedStyle === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.styleBtn, isSelected && styles.styleBtnSelected]}
                      onPress={() => setSelectedStyle(opt.id)}
                    >
                      <Text style={[styles.styleBtnText, isSelected && styles.styleBtnTextSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {messageError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {messageError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryAiBtn, isGeneratingMessage && styles.btnDisabled]}
                onPress={handleGenerateMessage}
                disabled={isGeneratingMessage}
                activeOpacity={0.85}
              >
                {isGeneratingMessage ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.primaryAiBtnText}> Đang soạn lời từ chối...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryAiBtnText}>✨ TẠO LỜI TỪ CHỐI VỚI GEMINI AI</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Generated Message Display */}
            {generatedMessage ? (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultCategory}>Lời từ chối đề xuất ({selectedStyle}):</Text>
                </View>
                <TextInput style={styles.generatedMessageText} value={generatedMessage} onChangeText={setGeneratedMessage} multiline maxLength={3000} />

                <View style={styles.messageFooterActions}>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={handleCopyMessage}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.copyBtnText}>
                      {copiedNotice ? '✓ Đã sao chép!' : '📋 Sao chép tin nhắn'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={handleShareMessage}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.shareBtnText}>↗ Chia sẻ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgCardBorder,
    paddingHorizontal: spacing.lg,
  },
  tabItem: {
    paddingVertical: spacing.md,
    marginRight: spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  introBox: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  introTitle: {
    color: colors.accentLight,
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
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  inputLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  textArea: {
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  inputSingle: {
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  samplePromptsWrap: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  samplePromptLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSizes.xs - 1,
    marginRight: spacing.xs,
  },
  sampleChip: {
    backgroundColor: colors.bgCardElevated,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    marginRight: spacing.xs,
    marginBottom: 4,
  },
  sampleChipText: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs - 1,
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  styleBtn: {
    width: '48%',
    backgroundColor: colors.bgCardElevated,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    alignItems: 'center',
  },
  styleBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  styleBtnText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
  },
  styleBtnTextSelected: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSizes.xs,
  },
  primaryAiBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryAiBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultCard: {
    backgroundColor: colors.bgCardElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  aiTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  aiTagText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs - 2,
    fontWeight: typography.fontWeights.bold,
  },
  resultCategory: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
  resultTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  resultDetailsBox: {
    backgroundColor: colors.bgDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    width: 140,
  },
  detailValue: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
  },
  dialogueSectionTitle: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xs,
  },
  dialogueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  dialogueNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  dialogueNumText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs - 2,
    fontWeight: typography.fontWeights.bold,
  },
  dialogueText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontStyle: 'italic',
  },
  listenBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  listenBtnText: {
    color: colors.primary,
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.bold,
  },
  exitMsgBox: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  exitMsgLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs - 1,
    marginBottom: 2,
  },
  exitMsgText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  resultActions: {
    marginTop: spacing.xs,
  },
  transferBtn: {
    backgroundColor: colors.callAccept,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  transferBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
  },
  saveVaultBtn: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  saveVaultBtnText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  generatedMessageText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.md,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
  },
  messageFooterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  copyBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  shareBtn: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  shareBtnText: {
    color: colors.accentLight,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
});

