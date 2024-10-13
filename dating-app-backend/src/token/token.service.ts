import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { RefreshTokenDTO, CreateTokenDTO } from './token.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Token, TokenDocument } from './token.schema';
import { Model } from 'mongoose';
import { UserService } from 'src/user/user.service';

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService, private userService: UserService, @InjectModel(Token.name) private tokenModel: Model<TokenDocument>) {}

  async createUserToken(tokenDTO: CreateTokenDTO) {
    return await this.tokenModel.create(tokenDTO);
  }

  async findUserTokenByUserId(userId: string) {
    const foundToken = await this.tokenModel.findOne({userId});
    if(foundToken) return foundToken.refreshToken;
    return null;
  }

  async refreshToken(tokenDTO: RefreshTokenDTO) {
    try {
        const isToken = await this.tokenModel.findOne({
                refreshToken: tokenDTO.refreshToken
        })
        if(!isToken) throw new Error("Can't find the validated token")
        const accessToken = this.jwtService.sign({email: tokenDTO.email, sub: tokenDTO.userId})
      console.log(accessToken)
        await isToken.updateOne({
            accessToken
        })
        return accessToken;
    } catch (error) {
        
    }
    
  }
}