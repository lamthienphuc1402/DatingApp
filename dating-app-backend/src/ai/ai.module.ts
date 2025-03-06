import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { UserMatchingService } from './services/user-matching.service';
import { TextAnalysisService } from './services/text-analysis.service';
import { RecommendationService } from './services/recommendation.service';
import { User, UserSchema } from '../user/schema/user.schema';
import { Message, MessageSchema } from '../chat/schema/message.schema';
import { UserEmbedding, UserEmbeddingSchema } from './models/user-embedding.model';
import { ChatAnalysis, ChatAnalysisSchema } from './models/chat-analysis.model';
import { Recommendation, RecommendationSchema } from './models/recommendation.model';
import { UserModule } from '../user/user.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Message.name, schema: MessageSchema },
      { name: UserEmbedding.name, schema: UserEmbeddingSchema },
      { name: ChatAnalysis.name, schema: ChatAnalysisSchema },
      { name: Recommendation.name, schema: RecommendationSchema },
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => ChatModule),
  ],
  controllers: [AIController],
  providers: [
    AIService,
    UserMatchingService,
    TextAnalysisService,
    RecommendationService,
  ],
  exports: [AIService],
})
export class AIModule {} 