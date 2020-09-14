import { SkillExecutor } from './SkillExecutor';
import { SkillExecutionRequestDto } from '@shared/models/skill/SkillExecutionRequest';
import { InternalServerErrorException } from '@nestjs/common';
import { SkillVariableDto } from '@shared/models/skill/SkillVariable';

export class NullSkillExecutor extends SkillExecutor {
    setSkillParameters(skillIri: string, parameters: SkillVariableDto[]): void {
        throw new InternalServerErrorException(`Parameters of Skill '${skillIri}' cannot be set. There is no matching executor`);
    }

    getSkillOutputs(executionRequest: SkillExecutionRequestDto): unknown {
        throw new InternalServerErrorException(`Method ${executionRequest.commandTypeIri} of Skill '${executionRequest.skillIri}'
        cannot be executed. There is no matching executor`);
    }

    invokeTransition(executionRequest: SkillExecutionRequestDto): void {
        throw new InternalServerErrorException(`Transition '${executionRequest.commandTypeIri}' of Skill '${executionRequest.skillIri}'
        cannot be executed. There is no matching executor`);
    }

}
