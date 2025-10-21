import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ColorPicker, { HueSlider, SaturationSlider } from 'reanimated-color-picker';

import { Button } from '@/components/ui';
import { apiClient } from '@/lib/api';

interface VocabularyCard {
  id: string;
  wordId: string;
  stability: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  state: string;
  due: string;
  word: {
    id: string;
    text: string;
    meaning: string;
    pronunciation?: string;
    translation?: string;
    partOfSpeech?: string;
    examples?: string[];
  };
}

interface FlashcardLayout {
  id: string;
  name: string;
  showWord: boolean;
  showPronunciation: boolean;
  showPartOfSpeech: boolean;
  showMeaning: boolean;
  showTranslation: boolean;
  showExamples: boolean;
  showImage: boolean;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
}

export const FlashcardMode = () => {
  const [cards, setCards] = useState<VocabularyCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Color picker modal
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Flashcard customization
  const [layouts, setLayouts] = useState<FlashcardLayout[]>([]);
  const [currentLayout, setCurrentLayout] = useState<FlashcardLayout | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);
  
  // Layout settings
  const [layoutSettings, setLayoutSettings] = useState({
    showWord: true,
    showPronunciation: true,
    showPartOfSpeech: true,
    showMeaning: false,
    showTranslation: false,
    showExamples: false,
    showImage: false,
    backgroundColor: '#3B82F6',
    textColor: '#FFFFFF',
    fontSize: 16,
  });

  useEffect(() => {
    fetchVocabularyCards();
    loadCustomLayouts();
  }, []);

  const fetchVocabularyCards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/vocabulary', {
        params: { pageSize: 50 }
      });
      if (response.success && response.data) {
        setCards((response.data as any)?.data || []);
      } else {
        setError(response.error || 'Failed to fetch vocabulary cards');
      }
    } catch (error: any) {
      console.error('Failed to fetch cards:', error);
      setError(error.message || 'Failed to load vocabulary cards. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomLayouts = async () => {
    try {
      const storedLayouts = await AsyncStorage.getItem('flashcard_layouts');
      if (storedLayouts) {
        const layouts = JSON.parse(storedLayouts);
        setLayouts(layouts);
        
        // Set default layout if none selected
        if (layouts.length > 0 && !currentLayout) {
          setCurrentLayout(layouts[0]);
        }
      } else {
        // Create default layouts
        const defaultLayouts: FlashcardLayout[] = [
          {
            id: 'default',
            name: 'Classic',
            showWord: true,
            showPronunciation: true,
            showPartOfSpeech: true,
            showMeaning: false,
            showTranslation: false,
            showExamples: false,
            showImage: false,
            backgroundColor: '#3B82F6',
            textColor: '#FFFFFF',
            fontSize: 16,
          },
          {
            id: 'detailed',
            name: 'Detailed',
            showWord: true,
            showPronunciation: true,
            showPartOfSpeech: true,
            showMeaning: true,
            showTranslation: true,
            showExamples: true,
            showImage: false,
            backgroundColor: '#10B981',
            textColor: '#FFFFFF',
            fontSize: 14,
          },
          {
            id: 'minimal',
            name: 'Minimal',
            showWord: true,
            showPronunciation: false,
            showPartOfSpeech: false,
            showMeaning: false,
            showTranslation: false,
            showExamples: false,
            showImage: false,
            backgroundColor: '#8B5CF6',
            textColor: '#FFFFFF',
            fontSize: 18,
          }
        ];
        
        setLayouts(defaultLayouts);
        setCurrentLayout(defaultLayouts[0]);
        await AsyncStorage.setItem('flashcard_layouts', JSON.stringify(defaultLayouts));
      }
    } catch (error) {
      console.error('Failed to load custom layouts:', error);
    }
  };

  const saveCustomLayout = async () => {
    try {
      const newLayout: FlashcardLayout = {
        id: Date.now().toString(),
        name: `Custom Layout ${layouts.length + 1}`,
        ...layoutSettings
      };
      
      const updatedLayouts = [...layouts, newLayout];
      setLayouts(updatedLayouts);
      setCurrentLayout(newLayout);
      await AsyncStorage.setItem('flashcard_layouts', JSON.stringify(updatedLayouts));
      
      setShowCustomization(false);
      Alert.alert('Success', 'Custom layout saved successfully!');
    } catch (error) {
      console.error('Failed to save custom layout:', error);
      Alert.alert('Error', 'Failed to save custom layout.');
    }
  };

  const deleteLayout = async (layoutId: string) => {
    try {
      const updatedLayouts = layouts.filter(layout => layout.id !== layoutId);
      setLayouts(updatedLayouts);
      
      if (currentLayout?.id === layoutId && updatedLayouts.length > 0) {
        setCurrentLayout(updatedLayouts[0]);
      }
      
      await AsyncStorage.setItem('flashcard_layouts', JSON.stringify(updatedLayouts));
    } catch (error) {
      console.error('Failed to delete layout:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading flashcards...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#EF4444" />
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <View style={styles.errorActions}>
          <Button
            title="Try Again"
            onPress={fetchVocabularyCards}
            style={styles.errorButton}
          />
        </View>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="book-outline" size={80} color="#94A3B8" />
        <Text style={styles.emptyTitle}>No Flashcards Available</Text>
        <Text style={styles.emptySubtitle}>
          Add some vocabulary words to create flashcards.
        </Text>
        <Button
          title="Add Vocabulary"
          onPress={() => {}}
          style={styles.addButton}
        />
      </View>
    );
  }

  const currentCard = cards[currentCardIndex];
  const progressPercentage = ((currentCardIndex + 1) / cards.length) * 100;
  const layout = currentLayout || layouts[0] || layoutSettings;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Flashcard Mode</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => setShowCustomization(true)}
            style={styles.customizeButton}
          >
            <Ionicons name="color-palette-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {}}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Card {currentCardIndex + 1} of {cards.length}
        </Text>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
      </View>

      {/* Flashcard */}
      <View style={styles.flashcardContainer}>
        <TouchableOpacity
          onPress={() => {
            setIsAnimating(true);
            setTimeout(() => {
              setShowAnswer(!showAnswer);
              setIsAnimating(false);
            }, 150);
          }}
          disabled={isAnimating}
          style={[
            styles.flashcard,
            { 
              backgroundColor: layout.backgroundColor,
            }
          ]}
        >
          <View style={styles.flashcardContent}>
            {!showAnswer ? (
              // Front of card
              <View style={styles.cardFront}>
                {layout.showWord && (
                  <Text style={[
                    styles.wordText,
                    { 
                      color: layout.textColor,
                      fontSize: layout.fontSize + 12
                    }
                  ]}>
                    {currentCard.word.text}
                  </Text>
                )}
                
                {layout.showPronunciation && currentCard.word.pronunciation && (
                  <Text style={[
                    styles.pronunciationText,
                    { 
                      color: layout.textColor,
                      fontSize: layout.fontSize + 2
                    }
                  ]}>
                    /{currentCard.word.pronunciation}/
                  </Text>
                )}
                
                {layout.showPartOfSpeech && currentCard.word.partOfSpeech && (
                  <Text style={[
                    styles.partOfSpeechText,
                    { 
                      color: layout.textColor,
                      fontSize: layout.fontSize
                    }
                  ]}>
                    {currentCard.word.partOfSpeech}
                  </Text>
                )}
                
                <View style={styles.tapHint}>
                  <Ionicons 
                    name="finger-print" 
                    size={24} 
                    color={layout.textColor} 
                    style={{ opacity: 0.8 }} 
                  />
                  <Text style={[
                    styles.tapHintText,
                    { 
                      color: layout.textColor,
                      fontSize: layout.fontSize - 2
                    }
                  ]}>
                    Tap to reveal
                  </Text>
                </View>
              </View>
            ) : (
              // Back of card
              <View style={styles.cardBack}>
                {layout.showMeaning && (
                  <Text style={[
                    styles.meaningText,
                    { 
                      color: layout.textColor,
                      fontSize: layout.fontSize + 4
                    }
                  ]}>
                    {currentCard.word.meaning}
                  </Text>
                )}
                
                {layout.showTranslation && currentCard.word.translation && (
                  <Text style={[
                    styles.translationText,
                    { 
                      color: layout.textColor,
                      fontSize: layout.fontSize
                    }
                  ]}>
                    {currentCard.word.translation}
                  </Text>
                )}
                
                {layout.showExamples && currentCard.word.examples && currentCard.word.examples.length > 0 && (
                  <View style={styles.examplesContainer}>
                    <Text style={[
                      styles.examplesTitle,
                      { 
                        color: layout.textColor,
                        fontSize: layout.fontSize
                      }
                    ]}>
                      Examples:
                    </Text>
                    {currentCard.word.examples.slice(0, 2).map((example, index) => (
                      <Text 
                        key={index} 
                        style={[
                          styles.exampleText,
                          { 
                            color: layout.textColor,
                            fontSize: layout.fontSize - 2
                          }
                        ]}
                      >
                        • {example}
                      </Text>
                    ))}
                  </View>
                )}
                
                <View style={styles.tapHint}>
                  <Ionicons 
                    name="finger-print" 
                    size={24} 
                    color={layout.textColor} 
                    style={{ opacity: 0.8 }} 
                  />
                  <Text style={[
                    styles.tapHintText,
                    { 
                      color: layout.textColor,
                      fontSize: layout.fontSize - 2
                    }
                  ]}>
                    Tap to flip back
                  </Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          onPress={() => {
            if (currentCardIndex > 0) {
              setCurrentCardIndex(currentCardIndex - 1);
              setShowAnswer(false);
            }
          }}
          disabled={currentCardIndex === 0}
          style={[
            styles.navButton,
            currentCardIndex === 0 && styles.navButtonDisabled
          ]}
        >
          <Ionicons name="chevron-back" size={24} color="#3B82F6" />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            setShowAnswer(!showAnswer);
          }}
          style={styles.flipButton}
        >
          <Ionicons name="sync" size={24} color="#3B82F6" />
          <Text style={styles.navButtonText}>Flip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            if (currentCardIndex < cards.length - 1) {
              setCurrentCardIndex(currentCardIndex + 1);
              setShowAnswer(false);
            } else {
              // Reached the end
              Alert.alert(
                'Finished!',
                'You\'ve reviewed all flashcards.',
                [
                  { text: 'Review Again', onPress: () => setCurrentCardIndex(0) },
                  { text: 'Done', onPress: () => {} }
                ]
              );
            }
          }}
          style={styles.navButton}
        >
          <Text style={styles.navButtonText}>Next</Text>
          <Ionicons name="chevron-forward" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Layout Selection */}
      {showCustomization && (
        <View style={styles.customizationOverlay}>
          <View style={styles.customizationContainer}>
            <View style={styles.customizationHeader}>
              <Text style={styles.customizationTitle}>Customize Flashcards</Text>
              <TouchableOpacity 
                onPress={() => setShowCustomization(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.customizationContent}>
              {/* Layout Selection */}
              <Text style={styles.sectionTitle}>Select Layout</Text>
              <View style={styles.layoutOptions}>
                {layouts.map((layout) => (
                  <TouchableOpacity
                    key={layout.id}
                    style={[
                      styles.layoutOption,
                      currentLayout?.id === layout.id && styles.selectedLayout
                    ]}
                    onPress={() => setCurrentLayout(layout)}
                  >
                    <Text style={styles.layoutName}>{layout.name}</Text>
                    <View style={styles.layoutPreview}>
                      <View 
                        style={[
                          styles.previewCard,
                          { backgroundColor: layout.backgroundColor }
                        ]}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteLayout(layout.id)}
                      style={styles.deleteLayoutButton}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Custom Layout Settings */}
              <Text style={styles.sectionTitle}>Customize Current Layout</Text>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Show Word</Text>
                <Switch
                  value={layoutSettings.showWord}
                  onValueChange={(value) => setLayoutSettings({
                    ...layoutSettings,
                    showWord: value
                  })}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Show Pronunciation</Text>
                <Switch
                  value={layoutSettings.showPronunciation}
                  onValueChange={(value) => setLayoutSettings({
                    ...layoutSettings,
                    showPronunciation: value
                  })}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Show Part of Speech</Text>
                <Switch
                  value={layoutSettings.showPartOfSpeech}
                  onValueChange={(value) => setLayoutSettings({
                    ...layoutSettings,
                    showPartOfSpeech: value
                  })}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Show Meaning</Text>
                <Switch
                  value={layoutSettings.showMeaning}
                  onValueChange={(value) => setLayoutSettings({
                    ...layoutSettings,
                    showMeaning: value
                  })}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Show Translation</Text>
                <Switch
                  value={layoutSettings.showTranslation}
                  onValueChange={(value) => setLayoutSettings({
                    ...layoutSettings,
                    showTranslation: value
                  })}
                />
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Show Examples</Text>
                <Switch
                  value={layoutSettings.showExamples}
                  onValueChange={(value) => setLayoutSettings({
                    ...layoutSettings,
                    showExamples: value
                  })}
                />
              </View>
              
              <View style={styles.colorPickerRow}>
                <Text style={styles.settingLabel}>Background Color</Text>
                <TouchableOpacity
                  style={[
                    styles.colorPreview,
                    { backgroundColor: layoutSettings.backgroundColor }
                  ]}
                  onPress={() => setShowColorPicker(true)}
                />
              </View>
              
              <View style={styles.sliderRow}>
                <Text style={styles.settingLabel}>Font Size: {layoutSettings.fontSize}</Text>
                <View style={styles.fontSizeControls}>
                  <TouchableOpacity
                    onPress={() => setLayoutSettings({
                      ...layoutSettings,
                      fontSize: Math.max(12, layoutSettings.fontSize - 1)
                    })}
                    style={styles.fontSizeButton}
                  >
                    <Ionicons name="remove" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setLayoutSettings({
                      ...layoutSettings,
                      fontSize: Math.min(24, layoutSettings.fontSize + 1)
                    })}
                    style={styles.fontSizeButton}
                  >
                    <Ionicons name="add" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.customizationActions}>
              <Button
                title="Save Custom Layout"
                onPress={saveCustomLayout}
                style={styles.saveButton}
              />
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowCustomization(false)}
                style={styles.cancelButton}
              />
            </View>
          </View>
        </View>
      )}
      
      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.colorPickerOverlay}>
          <View style={styles.colorPickerContainer}>
            <View style={styles.colorPickerHeader}>
              <Text style={styles.colorPickerTitle}>Choose Background Color</Text>
              <TouchableOpacity 
                onPress={() => setShowColorPicker(false)}
                style={styles.closeColorPickerButton}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ColorPicker
              value={layoutSettings.backgroundColor}
              onComplete={(color) => {
                setLayoutSettings({
                  ...layoutSettings,
                  backgroundColor: color.hex
                });
              }}
              style={styles.colorPicker}
            >
              <HueSlider style={styles.hueSlider} />
              <SaturationSlider style={styles.saturationSlider} />
            </ColorPicker>
            
            <View style={styles.colorPickerActions}>
              <TouchableOpacity
                style={[styles.colorPickerButton, styles.cancelColorPickerButton]}
                onPress={() => setShowColorPicker(false)}
              >
                <Text style={styles.colorPickerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.colorPickerButton, styles.confirmColorPickerButton]}
                onPress={() => setShowColorPicker(false)}
              >
                <Text style={styles.colorPickerButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  errorButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addButton: {
    width: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  customizeButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  flashcardContainer: {
    flex: 1,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  flashcard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashcardContent: {
    padding: 32,
    width: '100%',
    height: '100%',
  },
  cardFront: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordText: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  pronunciationText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  partOfSpeechText: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  tapHint: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 32,
    width: '100%',
  },
  tapHintText: {
    marginTop: 8,
    textAlign: 'center',
  },
  meaningText: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  translationText: {
    textAlign: 'center',
    marginBottom: 24,
  },
  examplesContainer: {
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  examplesTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  exampleText: {
    fontStyle: 'italic',
    marginBottom: 4,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  flipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginHorizontal: 8,
  },
  customizationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  customizationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
  customizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  customizationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  customizationContent: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  layoutOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  layoutOption: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    position: 'relative',
  },
  selectedLayout: {
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  layoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  layoutPreview: {
    alignItems: 'center',
  },
  previewCard: {
    width: 60,
    height: 40,
    borderRadius: 8,
  },
  deleteLayoutButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  colorPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1E293B',
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  fontSizeControls: {
    flexDirection: 'row',
    gap: 12,
  },
  fontSizeButton: {
    padding: 8,
  },
  customizationActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
  },
  saveButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  colorPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    padding: 20,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
  colorPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeColorPickerButton: {
    padding: 4,
  },
  colorPicker: {
    width: '100%',
    alignItems: 'center',
  },
  hueSlider: {
    width: '100%',
    height: 40,
    marginTop: 20,
  },
  saturationSlider: {
    width: '100%',
    height: 200,
    marginTop: 20,
    borderRadius: 10,
  },
  colorPickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  colorPickerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelColorPickerButton: {
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  confirmColorPickerButton: {
    backgroundColor: '#3B82F6',
    marginLeft: 10,
  },
  colorPickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
});