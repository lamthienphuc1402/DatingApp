import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateTokenDTO {
    @ApiProperty({ description: 'Access Token' })
    @IsNotEmpty()
    accessToken: string;

    @ApiProperty({description: "Refresh Token"})
    @IsNotEmpty()
    refreshToken: string;

    @ApiProperty({ description: 'Id user' })
    @IsNotEmpty()
    userId: string;
}

export class RefreshTokenDTO {
    @ApiProperty({description: "Refresh Token"})
    @IsNotEmpty()
    refreshToken: string;

    @ApiProperty({ description: 'Id user' })
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ description: 'Email user' })
    @IsNotEmpty()
    email: string;
}