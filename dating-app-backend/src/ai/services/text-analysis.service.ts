import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatAnalysis } from '../models/chat-analysis.model';
import { Message } from '../../chat/schema/message.schema';
import * as natural from 'natural';

@Injectable()
export class TextAnalysisService {
  private tokenizer: natural.WordTokenizer;
  private positiveWords: Set<string>;
  private negativeWords: Set<string>;

  constructor(
    @InjectModel(ChatAnalysis.name)
    private chatAnalysisModel: Model<ChatAnalysis>,
    @InjectModel(Message.name)
    private messageModel: Model<Message>,
  ) {
    this.tokenizer = new natural.WordTokenizer();
    
    // Từ điển cảm xúc tiếng Việt cơ bản
    this.positiveWords = new Set([
      'tốt', 'hay', 'thích', 'yêu', 'tuyệt', 'vui', 'hạnh phúc', 'xinh', 'đẹp',
      'tuyệt vời', 'thú vị', 'thoải mái', 'hài lòng', 'thân thiện', 'dễ thương',
      'ngọt ngào', 'quan tâm', 'chu đáo', 'nhiệt tình', 'vui vẻ'
    ]);

    this.negativeWords = new Set([
      'buồn', 'chán', 'khó', 'tệ', 'xấu', 'ghét', 'kém', 'không thích',
      'thất vọng', 'giận', 'khó chịu', 'phiền', 'mệt', 'chậm', 'lười',
      'thiếu', 'kém', 'yếu', 'không hài lòng', 'thô lỗ'
    ]);
  }

  private analyzeVietnameseSentiment(text: string): number {
    const words = this.tokenizer.tokenize(text.toLowerCase());
    let score = 0;
    let wordCount = 0;

    words.forEach(word => {
      if (this.positiveWords.has(word)) {
        score += 1;
        wordCount++;
      } else if (this.negativeWords.has(word)) {
        score -= 1;
        wordCount++;
      }
    });

    return wordCount > 0 ? score / wordCount : 0;
  }

  async analyzeChatContent(userId: string, chatId: string): Promise<ChatAnalysis> {
    const messages = await this.messageModel.find({
      $or: [
        { senderId: userId, chatId: chatId },
        { receiverId: userId, chatId: chatId }
      ]
    }).sort({ createdAt: 1 });

    let totalSentiment = 0;
    const keywords = new Map<string, number>();
    const messageStats = {
      totalMessages: messages.length,
      averageLength: 0,
      responseTime: 0,
      messageFrequency: 0
    };

    // Phân tích từng tin nhắn
    messages.forEach((message, index) => {
      // Phân tích cảm xúc
      const sentiment = this.analyzeVietnameseSentiment(message.content);
      totalSentiment += sentiment;

      // Thống kê từ khóa
      const words = this.tokenizer.tokenize(message.content.toLowerCase());
      words.forEach(word => {
        if (word.length > 2) { // Bỏ qua các từ quá ngắn
          keywords.set(word, (keywords.get(word) || 0) + 1);
        }
      });

      // Tính thời gian phản hồi trung bình
      if (index > 0) {
        const timeDiff = message.createdAt.getTime() - messages[index - 1].createdAt.getTime();
        messageStats.responseTime += timeDiff;
      }

      messageStats.averageLength += message.content.length;
    });

    // Tính toán các chỉ số thống kê
    if (messages.length > 0) {
      messageStats.averageLength /= messages.length;
      messageStats.responseTime = messages.length > 1 ? messageStats.responseTime / (messages.length - 1) : 0;
      
      const timeSpan = messages[messages.length - 1].createdAt.getTime() - messages[0].createdAt.getTime();
      messageStats.messageFrequency = messages.length / (timeSpan / (1000 * 60 * 60)); // tin nhắn/giờ
    }

    // Lấy top từ khóa
    const sortedKeywords = Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    const analysis = new this.chatAnalysisModel({
      userId,
      chatId,
      sentiment: totalSentiment / (messages.length || 1),
      keywords: sortedKeywords,
      messageStats,
    });

    return analysis.save();
  }
} 