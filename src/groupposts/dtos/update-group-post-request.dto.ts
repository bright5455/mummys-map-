import { PartialType } from '@nestjs/swagger';
import { CreateGroupPostRequestDto } from './create-group-post-request.dto';

export class UpdateGroupPostRequestDto extends PartialType(CreateGroupPostRequestDto) {}