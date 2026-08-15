import { IsNotEmpty } from "class-validator";

export default class ExchangeCodeDto {
    @IsNotEmpty()
    code: string;
}
