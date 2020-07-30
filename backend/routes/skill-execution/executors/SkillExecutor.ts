import { SkillExecutionRequestDto } from "@shared/models/skill/SkillExecutionRequest";
import { SkillParameterDto } from "../../../../shared/models/skill/SkillParameter";

export interface SkillExecutor {
    executeSkill(executionRequest: SkillExecutionRequestDto): void;
    setSkillParameters(skillIri: string, parameters: SkillParameterDto[]): void;
}
