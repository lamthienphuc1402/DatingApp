import { Body, Controller, Post } from "@nestjs/common";
import { RefreshTokenDTO } from "./token.dto";
import { TokenService } from "./token.service";

@Controller('token')
export class TokenController {
    constructor(private readonly tokenService: TokenService) {}

    @Post("refresh")
    async refreshToken(@Body() refreshTokenDTO: RefreshTokenDTO) {
        return await this.tokenService.refreshToken(refreshTokenDTO);
    }
}