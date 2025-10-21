import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Alert, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, Button } from '@/components/ui';
import { ReadingExercise, GradingResult } from './types';
import QuestionCard from './QuestionCard';
import ResultsCard from './ResultsCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

interface ReadTabProps {
  selectedExercise: ReadingExercise;
  readingStarted: boolean;
  showResults: boolean;
  gradingResult: GradingResult | null;
  answers: Record<string, string>;
  isSubmitting: boolean;
  onBeginReading: () => void;
  onShowResults: (show: boolean) => void;
  onAnswerChange: (questionId: string, answer: string) => void;
  onSubmitAnswers: () => void;
  onSelectExercise: (exercise: ReadingExercise | null) => void;
  setActiveTab: (tab: 'practice' | 'read' | 'progress') => void;
}

export default function ReadTab({
  selectedExercise,
  readingStarted,
  showResults,
  gradingResult,
  answers,
  isSubmitting,
  onBeginReading,
  onShowResults,
  onAnswerChange,
  onSubmitAnswers,
  onSelectExercise,
  setActiveTab,
}: ReadTabProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [wordDefinition, setWordDefinition] = useState<{word: string, definition: string, pronunciation: string} | null>(null);
  const [grammarModalVisible, setGrammarModalVisible] = useState(false);
  const [grammarExplanation, setGrammarExplanation] = useState<{structure: string, explanation: string} | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  // Annotation states
  const [annotations, setAnnotations] = useState<Record<string, string>>({});
  const [annotationModalVisible, setAnnotationModalVisible] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [annotationText, setAnnotationText] = useState('');
  const [highlightedTexts, setHighlightedTexts] = useState<Record<string, boolean>>({});
  // Text-to-speech states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [sentences, setSentences] = useState<string[]>([]);

  // Timer effect for reading speed tracking
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (timerActive && readingStarted) {
      interval = setInterval(() => {
        setCurrentTime(prevTime => prevTime + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, readingStarted]);

  // Start timer when reading begins
  useEffect(() => {
    if (readingStarted) {
      setStartTime(Date.now());
      setTimerActive(true);
      loadAnnotations();
      // Split content into sentences for TTS
      const contentSentences = selectedExercise.content.split(/(?<=[.!?])\s+/);
      setSentences(contentSentences);
    } else {
      setTimerActive(false);
      if (isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
      }
    }
  }, [readingStarted]);

  // Load annotations for this exercise
  const loadAnnotations = async () => {
    try {
      const storedAnnotations = await AsyncStorage.getItem(`annotations_${selectedExercise.id}`);
      if (storedAnnotations) {
        const parsed = JSON.parse(storedAnnotations);
        setAnnotations(parsed);
        
        // Set highlighted texts
        const highlights: Record<string, boolean> = {};
        Object.keys(parsed).forEach(key => {
          highlights[key] = true;
        });
        setHighlightedTexts(highlights);
      }
    } catch (error) {
      console.error('Failed to load annotations:', error);
    }
  };

  // Save annotations for this exercise
  const saveAnnotations = async (newAnnotations: Record<string, string>) => {
    try {
      await AsyncStorage.setItem(`annotations_${selectedExercise.id}`, JSON.stringify(newAnnotations));
    } catch (error) {
      console.error('Failed to save annotations:', error);
    }
  };

  // Text-to-speech functions
  const speakText = (text: string) => {
    if (isSpeaking) {
      Speech.stop();
    }
    
    const options = {
      language: 'en',
      pitch: 1,
      rate: 0.8,
      onDone: () => setIsSpeaking(false),
      onerror: () => setIsSpeaking(false),
    };
    
    Speech.speak(text, options);
    setIsSpeaking(true);
  };

  const speakSentence = (index: number) => {
    if (index >= 0 && index < sentences.length) {
      setCurrentSentenceIndex(index);
      speakText(sentences[index]);
    }
  };

  const speakFullText = () => {
    speakText(selectedExercise.content);
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  if (!readingStarted) {
    return (
      <Card style={styles.readyCard}>
        <CardContent style={styles.readyContent}>
          <Ionicons name="book" size={48} color="#3B82F6" />
          <Text style={styles.readyTitle}>{selectedExercise.title}</Text>
          <View style={styles.readyStats}>
            <View key="words" style={styles.readyStat}>
              <Ionicons name="document-text" size={20} color="#64748B" />
              <Text style={styles.readyStatText}>
                {selectedExercise.wordCount} words
              </Text>
            </View>
            <View key="time" style={styles.readyStat}>
              <Ionicons name="time" size={20} color="#64748B" />
              <Text style={styles.readyStatText}>
                ~{selectedExercise.estimatedTime} minutes
              </Text>
            </View>
            <View key="questions" style={styles.readyStat}>
              <Ionicons name="help-circle" size={20} color="#64748B" />
              <Text style={styles.readyStatText}>
                {(selectedExercise.questions || selectedExercise.comprehensionQuestions)?.length} questions
              </Text>
            </View>
          </View>
          <Button
            title="Start Reading"
            onPress={onBeginReading}
            style={styles.startButton}
          />
        </CardContent>
      </Card>
    );
  }

  if (showResults && gradingResult) {
    return (
      <ResultsCard
        selectedExercise={selectedExercise}
        gradingResult={gradingResult}
        onShowResults={onShowResults}
        onSelectExercise={onSelectExercise}
        setActiveTab={setActiveTab}
      />
    );
  }

  // Function to handle word selection
  const handleWordPress = (word: string) => {
    // In a real implementation, this would call an API to get the definition
    // For now, we'll use mock data
    const mockDefinitions: Record<string, {definition: string, pronunciation: string}> = {
      'reading': { definition: 'The action or skill of reading written or printed matter.', pronunciation: '/ˈriːdɪŋ/' },
      'comprehension': { definition: 'The ability to understand something.', pronunciation: '/ˌkɒmprɪˈhenʃən/' },
      'vocabulary': { definition: 'The body of words used in a particular language.', pronunciation: '/və(ʊ)ˈkæbjʊləri/' },
      'exercise': { definition: 'Activity requiring physical effort, carried out to sustain or improve health and fitness.', pronunciation: '/ˈɛksəsʌɪz/' },
      'practice': { definition: 'The actual application or use of an idea, belief, or method.', pronunciation: '/ˈpraktɪs/' },
    };

    const normalizedWord = word.toLowerCase().replace(/[^\w]/g, '');
    const definition = mockDefinitions[normalizedWord];

    if (definition) {
      setWordDefinition({
        word: normalizedWord,
        definition: definition.definition,
        pronunciation: definition.pronunciation
      });
      setSelectedWord(normalizedWord);
      setModalVisible(true);
    }
  };

  // Function to handle grammar structure selection
  const handleGrammarPress = (structure: string) => {
    // In a real implementation, this would call an API to get the grammar explanation
    // For now, we'll use mock data
    const mockGrammarExplanations: Record<string, string> = {
      'complex sentence': 'A complex sentence contains one independent clause and at least one dependent clause. Dependent clauses can refer to the subject (who, which) or the object (who, whom, which, that) of the independent clause.',
      'compound sentence': 'A compound sentence consists of two or more independent clauses joined by a coordinating conjunction (for, and, nor, but, or, yet, so) or a semicolon.',
      'simple sentence': 'A simple sentence contains only one independent clause with a subject and a verb.',
    };

    const explanation = mockGrammarExplanations[structure.toLowerCase()];

    if (explanation) {
      setGrammarExplanation({
        structure: structure,
        explanation: explanation
      });
      setGrammarModalVisible(true);
    } else {
      Alert.alert('Grammar Explanation', `No explanation available for "${structure}"`);
    }
  };

  // Function to handle text selection for annotations
  const handleTextSelection = (text: string) => {
    setSelectedText(text);
    setAnnotationText(annotations[text] || '');
    setAnnotationModalVisible(true);
  };

  // Function to save annotation
  const saveAnnotation = () => {
    if (selectedText) {
      const newAnnotations = { ...annotations, [selectedText]: annotationText };
      setAnnotations(newAnnotations);
      saveAnnotations(newAnnotations);
      
      // Update highlighted texts
      setHighlightedTexts(prev => ({ ...prev, [selectedText]: true }));
      setAnnotationModalVisible(false);
      setSelectedText('');
      setAnnotationText('');
    }
  };

  // Function to delete annotation
  const deleteAnnotation = () => {
    if (selectedText) {
      const newAnnotations = { ...annotations };
      delete newAnnotations[selectedText];
      setAnnotations(newAnnotations);
      saveAnnotations(newAnnotations);
      
      // Update highlighted texts
      setHighlightedTexts(prev => ({ ...prev, [selectedText]: false }));
      setAnnotationModalVisible(false);
      setSelectedText('');
      setAnnotationText('');
    }
  };

  // Function to calculate reading speed (words per minute)
  const calculateReadingSpeed = () => {
    if (!selectedExercise.wordCount || currentTime === 0) return 0;
    const minutes = currentTime / 60;
    return Math.round(selectedExercise.wordCount / minutes);
  };

  // Function to render interactive text with word highlighting and annotations
  const renderInteractiveText = (text: string) => {
    if (!text) return null;

    // Split text into words while preserving spaces and punctuation
    const words = text.split(/(\s+)/).filter(word => word.length > 0);

    return (
      <Text style={styles.contentText}>
        {words.map((word, index) => {
          // Check if it's a space or punctuation
          if (/^\s+$/.test(word)) {
            return <Text key={index}>{word}</Text>;
          }

          // Check if word is in our vocabulary list
          const normalizedWord = word.toLowerCase().replace(/[^\w]/g, '');
          const isVocabularyWord = ['reading', 'comprehension', 'vocabulary', 'exercise', 'practice'].includes(normalizedWord);

          // Check if this text is annotated
          const isAnnotated = highlightedTexts[word] || false;

          // Render clickable word if it's a vocabulary word
          if (isVocabularyWord) {
            return (
              <TouchableOpacity 
                key={index} 
                onPress={() => handleWordPress(word)}
                onLongPress={() => handleTextSelection(word)}
              >
                <Text style={[styles.highlightedWord, isAnnotated && styles.annotatedWord]}>{word}</Text>
              </TouchableOpacity>
            );
          }

          // Render annotated text
          if (isAnnotated) {
            return (
              <TouchableOpacity 
                key={index} 
                onLongPress={() => handleTextSelection(word)}
              >
                <Text style={styles.annotatedWord}>{word}</Text>
              </TouchableOpacity>
            );
          }

          // Render normal word with long press for annotation
          return (
            <TouchableOpacity 
              key={index} 
              onLongPress={() => handleTextSelection(word)}
            >
              <Text>{word}</Text>
            </TouchableOpacity>
          );
        })}
      </Text>
    );
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Export functions
  const exportArticle = async (format: 'txt' | 'pdf') => {
    try {
      const content = `${selectedExercise.title}\n\n${selectedExercise.content}`;
      const fileName = `${selectedExercise.title.replace(/\s+/g, '_')}.${format}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      if (format === 'txt') {
        await FileSystem.writeAsStringAsync(fileUri, content);
        await Sharing.shareAsync(fileUri);
      } else {
        // For PDF, we would need a library like react-native-html-to-pdf
        // For now, we'll just export as text with a PDF extension
        await FileSystem.writeAsStringAsync(fileUri, content);
        await Sharing.shareAsync(fileUri);
      }
      
      Alert.alert('Success', `Article exported as ${format.toUpperCase()} successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export article');
    }
  };

  const exportAnnotations = async () => {
    try {
      if (Object.keys(annotations).length === 0) {
        Alert.alert('No Annotations', 'You have no annotations to export');
        return;
      }
      
      let content = `Annotations for: ${selectedExercise.title}\n\n`;
      Object.entries(annotations).forEach(([text, note], index) => {
        content += `${index + 1}. "${text}"\n   Note: ${note}\n\n`;
      });
      
      const fileName = `annotations_${selectedExercise.title.replace(/\s+/g, '_')}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, content);
      await Sharing.shareAsync(fileUri);
      
      Alert.alert('Success', 'Annotations exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export annotations');
    }
  };

  return (
    <>
      {/* Reading Content with Interactive Vocabulary */}
      <Card style={styles.contentCard}>
        <CardContent style={styles.contentCardContent}>
          <View style={styles.readingHeader}>
            <Text style={styles.contentTitle}>{selectedExercise.title}</Text>
            <View style={styles.timerContainer}>
              <Ionicons name="time" size={16} color="#64748B" />
              <Text style={styles.timerText}>{formatTime(currentTime)}</Text>
            </View>
          </View>
          
          {/* Export Options */}
          <View style={styles.exportContainer}>
            <Text style={styles.exportLabel}>Export:</Text>
            <View style={styles.exportButtons}>
              <TouchableOpacity 
                style={styles.exportButton}
                onPress={() => exportArticle('txt')}
              >
                <Ionicons name="document-text" size={20} color="#3B82F6" />
                <Text style={styles.exportButtonText}>Text</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.exportButton}
                onPress={() => exportArticle('pdf')}
              >
                <Ionicons name="document" size={20} color="#3B82F6" />
                <Text style={styles.exportButtonText}>PDF</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.exportButton}
                onPress={exportAnnotations}
                disabled={Object.keys(annotations).length === 0}
              >
                <Ionicons name="bookmark" size={20} color={Object.keys(annotations).length === 0 ? "#94A3B8" : "#3B82F6"} />
                <Text style={[styles.exportButtonText, Object.keys(annotations).length === 0 && styles.exportButtonTextDisabled]}>
                  Notes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Text-to-Speech Controls */}
          <View style={styles.ttsContainer}>
            <Text style={styles.ttsLabel}>Text-to-Speech:</Text>
            <View style={styles.ttsButtons}>
              <TouchableOpacity 
                style={[styles.ttsButton, isSpeaking && styles.ttsButtonActive]}
                onPress={isSpeaking ? stopSpeaking : speakFullText}
              >
                <Ionicons 
                  name={isSpeaking ? "stop" : "play"} 
                  size={20} 
                  color={isSpeaking ? "#EF4444" : "#3B82F6"} 
                />
                <Text style={styles.ttsButtonText}>
                  {isSpeaking ? "Stop" : "Play All"}
                </Text>
              </TouchableOpacity>
              
              {sentences.length > 0 && (
                <View style={styles.sentenceControls}>
                  <TouchableOpacity 
                    style={styles.sentenceButton}
                    onPress={() => speakSentence(Math.max(0, currentSentenceIndex - 1))}
                    disabled={currentSentenceIndex === 0}
                  >
                    <Ionicons 
                      name="arrow-back" 
                      size={20} 
                      color={currentSentenceIndex === 0 ? "#94A3B8" : "#3B82F6"} 
                    />
                  </TouchableOpacity>
                  
                  <Text style={styles.sentenceCounter}>
                    {currentSentenceIndex + 1}/{sentences.length}
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.sentenceButton}
                    onPress={() => speakSentence(Math.min(sentences.length - 1, currentSentenceIndex + 1))}
                    disabled={currentSentenceIndex === sentences.length - 1}
                  >
                    <Ionicons 
                      name="arrow-forward" 
                      size={20} 
                      color={currentSentenceIndex === sentences.length - 1 ? "#94A3B8" : "#3B82F6"} 
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          
          {renderInteractiveText(selectedExercise.content)}
          
          {/* Reading Speed Indicator */}
          <View style={styles.speedContainer}>
            <Text style={styles.speedLabel}>Reading Speed:</Text>
            <Text style={styles.speedValue}>{calculateReadingSpeed()} WPM</Text>
          </View>
          
          {/* Grammar Structure Examples */}
          <View style={styles.grammarSection}>
            <Text style={styles.grammarSectionTitle}>Grammar Structures in This Text:</Text>
            <View style={styles.grammarTagsContainer}>
              <TouchableOpacity 
                style={styles.grammarTag}
                onPress={() => handleGrammarPress('Complex Sentence')}
              >
                <Text style={styles.grammarTagText}>Complex Sentence</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.grammarTag}
                onPress={() => handleGrammarPress('Compound Sentence')}
              >
                <Text style={styles.grammarTagText}>Compound Sentence</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Vocabulary Definition Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedWord(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{wordDefinition?.word}</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {wordDefinition && (
              <>
                <Text style={styles.pronunciation}>{wordDefinition.pronunciation}</Text>
                <Text style={styles.definition}>{wordDefinition.definition}</Text>
                
                <View style={styles.modalActions}>
                  <Button
                    title="Add to Vocabulary"
                    onPress={() => {
                      // In a real implementation, this would add the word to the user's vocabulary
                      console.log(`Adding ${wordDefinition.word} to vocabulary`);
                      setModalVisible(false);
                    }}
                    style={styles.addButton}
                  />
                  <Button
                    title="Listen"
                    onPress={() => {
                      // In a real implementation, this would play the pronunciation
                      speakText(wordDefinition.word);
                    }}
                    variant="secondary"
                    style={styles.listenButton}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Grammar Explanation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={grammarModalVisible}
        onRequestClose={() => {
          setGrammarModalVisible(false);
          setGrammarExplanation(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{grammarExplanation?.structure}</Text>
              <TouchableOpacity 
                onPress={() => setGrammarModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {grammarExplanation && (
              <>
                <Text style={styles.definition}>{grammarExplanation.explanation}</Text>
                
                <View style={styles.exampleContainer}>
                  <Text style={styles.exampleTitle}>Example:</Text>
                  <Text style={styles.exampleText}>
                    {grammarExplanation.structure.toLowerCase().includes('complex') 
                      ? 'Although it was raining, we decided to go for a walk.' 
                      : grammarExplanation.structure.toLowerCase().includes('compound')
                      ? 'I wanted to go for a walk, but it started raining.'
                      : 'The sun is shining.'}
                  </Text>
                </View>
                
                <Button
                  title="Close"
                  onPress={() => setGrammarModalVisible(false)}
                  style={styles.closeGrammarButton}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Annotation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={annotationModalVisible}
        onRequestClose={() => {
          setAnnotationModalVisible(false);
          setSelectedText('');
          setAnnotationText('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Annotation</Text>
              <TouchableOpacity 
                onPress={() => setAnnotationModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.selectedTextPreview}>{`"${selectedText}"`}</Text>
            
            <TextInput
              style={styles.annotationInput}
              placeholder="Add your note here..."
              value={annotationText}
              onChangeText={setAnnotationText}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.annotationActions}>
              <Button
                title="Delete"
                onPress={deleteAnnotation}
                variant="secondary"
                style={styles.deleteButton}
              />
              <Button
                title="Save"
                onPress={saveAnnotation}
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Questions */}
      <View style={styles.questionsContainer}>
        <Text style={styles.questionsTitle}>Questions</Text>
        {(selectedExercise.comprehensionQuestions || selectedExercise.questions)?.map((question, index) => (
          <QuestionCard
            key={index}
            question={question}
            questionIndex={index}
            answers={answers}
            onAnswerChange={onAnswerChange}
          />
        ))}

        <View style={styles.submitContainer}>
          <Button
            title="Choose Different Exercise"
            onPress={() => onSelectExercise(null)}
            style={styles.cancelButton}
            variant="secondary"
          />
          <Button
            title={isSubmitting ? 'Submitting...' : 'Submit Answers'}
            onPress={onSubmitAnswers}
            disabled={isSubmitting || Object.keys(answers).length === 0 || Object.keys(answers).length !== (selectedExercise.questions || selectedExercise.comprehensionQuestions)?.length}
            loading={isSubmitting}
            style={styles.submitButton}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  readyCard: {
    alignItems: 'center',
  },
  readyContent: {
    padding: 32,
    alignItems: 'center',
  },
  readyTitle: {
    fontSize: 24,
    fontWeight: 'bold' as 'bold',
    color: '#1E293B',
    marginTop: 16,
    textAlign: 'center',
  },
  readyStats: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 24,
  },
  readyStat: {
    alignItems: 'center',
  },
  readyStatText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  startButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contentCard: {
    marginBottom: 24,
  },
  contentCardContent: {
    padding: 20,
  },
  readingHeader: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold' as 'bold',
    color: '#1E293B',
  },
  timerContainer: {
    flexDirection: 'row' as 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
  // Text-to-Speech styles
  ttsContainer: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  ttsLabel: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500' as '500',
  },
  ttsButtons: {
    flexDirection: 'row' as 'row',
    alignItems: 'center',
    gap: 8,
  },
  ttsButton: {
    flexDirection: 'row' as 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ttsButtonActive: {
    backgroundColor: '#FEE2E2',
  },
  ttsButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: 4,
    fontWeight: '500' as '500',
  },
  sentenceControls: {
    flexDirection: 'row' as 'row',
    alignItems: 'center',
    gap: 8,
  },
  sentenceButton: {
    padding: 6,
  },
  sentenceCounter: {
    fontSize: 14,
    color: '#64748B',
    minWidth: 60,
    textAlign: 'center',
  },
  contentText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 20,
  },
  highlightedWord: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    textDecorationLine: 'underline',
  },
  annotatedWord: {
    backgroundColor: '#BFDBFE',
    textDecorationLine: 'underline',
  },
  speedContainer: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  speedLabel: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500' as '500',
  },
  speedValue: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600' as '600',
  },
  grammarSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  grammarSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  grammarTagsContainer: {
    flexDirection: 'row' as 'row',
    flexWrap: 'wrap' as 'wrap',
    gap: 8,
  },
  grammarTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  grammarTagText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500' as '500',
  },
  questionsContainer: {
    gap: 16,
  },
  questionsTitle: {
    fontSize: 18,
    fontWeight: '600' as '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  submitContainer: {
    flexDirection: 'row' as 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: Dimensions.get('window').width * 0.8,
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold' as 'bold',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  pronunciation: {
    fontSize: 16,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  definition: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 24,
  },
  exampleContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#475569',
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row' as 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  listenButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeGrammarButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  // Annotation modal styles
  selectedTextPreview: {
    fontSize: 16,
    color: '#475569',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  annotationInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  annotationActions: {
    flexDirection: 'row' as 'row',
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  exportContainer: {
    flexDirection: 'row' as 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  exportLabel: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500' as '500',
  },
  exportButtons: {
    flexDirection: 'row' as 'row',
    gap: 8,
  },
  exportButton: {
    flexDirection: 'row' as 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: '500' as '500',
  },
  exportButtonTextDisabled: {
    color: '#94A3B8',
  },
});
