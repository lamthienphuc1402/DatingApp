import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Admin, AdminSchema } from './schema/admin.schema';
import { UserModule } from '../user/user.module';
import { User, UserSchema } from '../user/schema/user.schema';
import { AIModule } from '../ai/ai.module';
import { MLService } from '../ai/services/ml.service';
import { MLModel, MLModelSchema } from '../ai/models/ml-model.model';
import { MatchHistory, MatchHistorySchema } from '../ai/models/match-history.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
      { name: MLModel.name, schema: MLModelSchema },
      { name: MatchHistory.name, schema: MatchHistorySchema }
    ]),
    JwtModule.register({
      global: true,
      secret: 'your-secret-key', // Nên đặt trong env
      signOptions: { expiresIn: '1d' },
    }),
    forwardRef(() => UserModule),
    forwardRef(() => AIModule)
  ],
  controllers: [AdminController],
  providers: [AdminService, MLService],
  exports: [AdminService],
})
export class AdminModule {}
