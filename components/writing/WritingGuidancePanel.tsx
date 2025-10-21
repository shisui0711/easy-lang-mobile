import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, Badge } from '@/components/ui';

interface WritingTemplate {
  id: string;
  type: 'CREATIVE' | 'ESSAY' | 'JOURNAL' | 'CHALLENGE';
  title: string;
  description: string;
  structure: {
    introduction?: string;
    body?: string[];
    conclusion?: string;
  };
  tips: string[];
  example?: string;
  wordLimit?: {
    min: number;
    max: number;
  };
  timeEstimate?: number; // in minutes
}

interface WritingGuidance {
  templates: WritingTemplate[];
  grammarPoints: string[];
  vocabularySuggestions: string[];
  writingPrompts: string[];
}

interface WritingGuidanceProps {
  writingGuidance: WritingGuidance;
  onClose: () => void;
}

export const WritingGuidancePanel: React.FC<WritingGuidanceProps> = ({
  writingGuidance,
  onClose
}) => {
  return (
    <Card style={styles.guidanceCard}>
      <CardContent style={styles.cardContent}>
        <View style={styles.guidanceHeader}>
          <Text style={styles.guidanceTitle}>Writing Guidance</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        
        {/* Templates */}
        <View style={styles.guidanceSection}>
          <Text style={styles.guidanceSectionTitle}>Templates</Text>
          {writingGuidance.templates.map((template) => (
            <View key={template.id} style={styles.templateContainer}>
              <Text style={styles.templateTitle}>{template.title}</Text>
              <Text style={styles.templateDescription}>{template.description}</Text>
              
              {template.wordLimit && (
                <View style={styles.templateMeta}>
                  <Text style={styles.templateMetaText}>
                    Word Limit: {template.wordLimit.min}-{template.wordLimit.max} words
                  </Text>
                  {template.timeEstimate && (
                    <Text style={styles.templateMetaText}>
                      Time: ~{template.timeEstimate} min
                    </Text>
                  )}
                </View>
              )}
              
              <View style={styles.templateStructure}>
                {template.structure.introduction && (
                  <View style={styles.structureItem}>
                    <Text style={styles.structureLabel}>Introduction:</Text>
                    <Text style={styles.structureText}>{template.structure.introduction}</Text>
                  </View>
                )}
                
                {template.structure.body && template.structure.body.map((item, index) => (
                  <View key={index} style={styles.structureItem}>
                    <Text style={styles.structureLabel}>Body {index + 1}:</Text>
                    <Text style={styles.structureText}>{item}</Text>
                  </View>
                ))}
                
                {template.structure.conclusion && (
                  <View style={styles.structureItem}>
                    <Text style={styles.structureLabel}>Conclusion:</Text>
                    <Text style={styles.structureText}>{template.structure.conclusion}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.templateTips}>
                <Text style={styles.tipsTitle}>Writing Tips:</Text>
                {template.tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
              
              {template.example && (
                <View style={styles.exampleContainer}>
                  <Text style={styles.exampleTitle}>Example:</Text>
                  <Text style={styles.exampleText}>{template.example}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
        
        {/* Grammar Points */}
        {writingGuidance.grammarPoints.length > 0 && (
          <View style={styles.guidanceSection}>
            <Text style={styles.guidanceSectionTitle}>Grammar Focus</Text>
            <View style={styles.focusBadges}>
              {writingGuidance.grammarPoints.map((point, index) => (
                <Badge key={index} style={styles.focusBadge}>
                  <Text style={styles.focusBadgeText}>{point}</Text>
                </Badge>
              ))}
            </View>
          </View>
        )}
        
        {/* Vocabulary Suggestions */}
        {writingGuidance.vocabularySuggestions.length > 0 && (
          <View style={styles.guidanceSection}>
            <Text style={styles.guidanceSectionTitle}>Vocabulary Suggestions</Text>
            <View style={styles.focusBadges}>
              {writingGuidance.vocabularySuggestions.map((word, index) => (
                <Badge key={index} style={styles.focusBadge}>
                  <Text style={styles.focusBadgeText}>{word}</Text>
                </Badge>
              ))}
            </View>
          </View>
        )}
        
        {/* Writing Prompts */}
        {writingGuidance.writingPrompts.length > 0 && (
          <View style={styles.guidanceSection}>
            <Text style={styles.guidanceSectionTitle}>Writing Prompts</Text>
            {writingGuidance.writingPrompts.map((prompt, index) => (
              <View key={index} style={styles.promptItem}>
                <Text style={styles.promptBullet}>•</Text>
                <Text style={styles.promptText}>{prompt}</Text>
              </View>
            ))}
          </View>
        )}
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  guidanceCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    padding: 20,
  },
  guidanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  guidanceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  guidanceSection: {
    marginBottom: 24,
  },
  guidanceSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  templateContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  templateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  templateMetaText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  templateStructure: {
    marginBottom: 12,
  },
  structureItem: {
    marginBottom: 8,
  },
  structureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  structureText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  templateTips: {
    marginTop: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  tipBullet: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  exampleContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    color: '#475569',
    fontStyle: 'italic',
  },
  focusBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  focusBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  focusBadgeText: {
    fontSize: 12,
    color: '#475569',
  },
  promptItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  promptBullet: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 8,
  },
  promptText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
});