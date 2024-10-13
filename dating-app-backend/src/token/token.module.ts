import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "src/user/user.module";
import { Token, TokenSchema } from "./token.schema";
import { TokenController } from "./token.controller";
import { TokenService } from "./token.service";
import { AuthModule } from "src/auth/auth.module";
import { JwtModule } from "@nestjs/jwt";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
        forwardRef(() => UserModule),
        forwardRef(() => AuthModule),
        JwtModule.register({
            secret: 'kiki', // Thay đổi secret key
            signOptions: { expiresIn: '60m' },
        }),
        
    ],
    controllers: [TokenController],
    providers: [TokenService],
    exports: [TokenService],
})
export class TokenModule {}