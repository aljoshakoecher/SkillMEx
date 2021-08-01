import { Injectable, BadRequestException } from '@nestjs/common';
import { GraphDbConnectionService } from '../../util/GraphDbConnection.service';

import { SkillDto, SkillQueryResult} from "@shared/models/skill/Skill";
import { skillMapping } from './skill-mappings';
import { v4 as uuidv4 } from 'uuid';
import { SocketGateway } from '../../socket-gateway/socket.gateway';

import {SparqlResultConverter} from 'sparql-result-converter';
import { CapabilityService } from '../capabilities/capability.service';
import { SocketEventName } from '@shared/socket-communication/SocketEventName';
import { parameterQueryFragment, outputQueryFragment } from './query-fragments';
import { OpcUaVariableSkillExecutionService } from '../skill-execution/executors/opc-ua-executors/OpcUaVariableSkillExecutor';
import { OpcUaStateMonitorService } from '../../util/opc-ua-state-monitor.service';
const converter = new SparqlResultConverter();

@Injectable()
export class SkillService {
    constructor(private graphDbConnection: GraphDbConnectionService,
        private socketGateway: SocketGateway,
        private uaStateChangeMonitor: OpcUaStateMonitorService,
        private capabilityService: CapabilityService){}


    /**
     * Register a new skill
     * @param newSkill Content of an RDF document describing a skill
     */
    async addSkill(newSkill: string): Promise<string> {
        try {
            // create a graph name for the skill (uuid)
            const skillGraphName = uuidv4();
            await this.graphDbConnection.addRdfDocument(newSkill, skillGraphName);

            // Skill is added, now get its IRI and skill type to setup a state change monitor in case its a variable skill
            const skillInfo = await this.getSkillInGraph(skillGraphName);

            if (skillInfo.skillTypeIri == "http://www.hsu-ifa.de/ontologies/capability-model#OpcUaVariableSkill") {
                const skillExecutor = new OpcUaVariableSkillExecutionService(this.graphDbConnection, this, skillInfo.skillIri);
                const uaClientSession = await skillExecutor.connectAndCreateSession();
                this.uaStateChangeMonitor.setupItemToMonitor(uaClientSession, skillInfo.skillIri);
            }

            this.socketGateway.emitEvent(SocketEventName.Skills_Added);

            return 'New skill successfully added';
        } catch (error) {
            throw new BadRequestException(`Error while registering a new skill. Error: ${error.toString()}`);
        }
    }


    /**
     * Gets all skills that are currently registered
     */
    async getAllSkills(): Promise<Array<SkillDto>> {
        try {
            const query = `
            PREFIX Cap: <http://www.hsu-ifa.de/ontologies/capability-model#>
            PREFIX ISA88: <http://www.hsu-ifa.de/ontologies/ISA-TR88#>
            PREFIX sesame: <http://www.openrdf.org/schema/sesame#>
            SELECT ?skill ?stateMachine ?currentStateTypeIri
                ?parameterIri ?parameterName ?parameterType ?parameterRequired ?parameterDefault ?paramOptionValue
                ?outputIri ?outputName ?outputType ?outputRequired ?outputDefault ?outputOptionValue
            WHERE {
                ?skill a Cap:Skill.
                ?skill Cap:hasStateMachine ?stateMachine.
                OPTIONAL {
                    ?skill Cap:hasCurrentState ?currentState.
                    ?currentState rdf:type ?currentStateTypeIri.
                    ?currentStateTypeIri sesame:directSubClassOf/sesame:directSubClassOf ISA88:State.
                }
                ${parameterQueryFragment}
                ${outputQueryFragment}
            }`;
            const queryResult = await this.graphDbConnection.executeQuery(query);
            const mappedResults = converter.convertToDefinition(queryResult.results.bindings, skillMapping, false).getFirstRootElement() as SkillQueryResult[];
            const skillDtos = mappedResults.map(result => new SkillDto(result));

            for (const skillDto of skillDtos) {
                const capabilityDtos = await this.capabilityService.getCapabilitiesOfSkill(skillDto.skillIri);
                skillDto.capabilityDtos = capabilityDtos;
            }

            return skillDtos;
        } catch(error) {
            throw new Error(`Error while returning all skills. Error: ${error}`);
        }
    }

    /**
     * Get a specific skill by its IRI
     * @param skillIri IRI of the skill to get
     */
    async getSkillByIri(skillIri: string): Promise<SkillDto> {
        try {
            const query = `
            PREFIX Cap: <http://www.hsu-ifa.de/ontologies/capability-model#>
            PREFIX ISA88: <http://www.hsu-ifa.de/ontologies/ISA-TR88#>
            PREFIX sesame: <http://www.openrdf.org/schema/sesame#>
            SELECT ?skill ?stateMachine ?currentStateTypeIri
                ?parameterIri ?parameterName ?parameterType ?parameterRequired ?parameterDefault ?paramOptionValue
                ?outputIri ?outputName ?outputType ?outputRequired ?outputDefault ?outputOptionValue
            WHERE {
                ?skill a Cap:Skill.
                FILTER(?skill = IRI("${skillIri}"))
                ?skill Cap:hasStateMachine ?stateMachine.
                OPTIONAL {
                    ?skill Cap:hasCurrentState ?currentState.
                    ?currentState rdf:type ?currentStateTypeIri.
                    ?currentStateTypeIri sesame:directSubClassOf/sesame:directSubClassOf ISA88:State.
                }
                ${parameterQueryFragment}
                ${outputQueryFragment}
            }`;

            const rawResults = await this.graphDbConnection.executeQuery(query);
            const mappedResult = converter.convertToDefinition(rawResults.results.bindings, skillMapping, false).getFirstRootElement()[0] as SkillQueryResult;
            const skillDto = new SkillDto(mappedResult);

            const capabilityDtos = await this.capabilityService.getCapabilitiesOfSkill(skillDto.skillIri);
            skillDto.capabilityDtos = capabilityDtos;

            return skillDto;
        } catch(error) {
            throw new Error(`Error while returning skill with IRI ${skillIri}. Error: ${error}`);
        }
    }

    async getSkillsOfModule(moduleIri: string): Promise<SkillDto[]> {
        try {
            const query = `
            PREFIX Cap: <http://www.hsu-ifa.de/ontologies/capability-model#>
            PREFIX ISA88: <http://www.hsu-ifa.de/ontologies/ISA-TR88#>
            PREFIX sesame: <http://www.openrdf.org/schema/sesame#>
            SELECT ?skill ?stateMachine ?currentStateTypeIri
                ?parameterIri ?parameterName ?parameterType ?parameterRequired ?parameterDefault ?paramOptionValue
                ?outputIri ?outputName ?outputType ?outputRequired ?outputDefault ?outputOptionValue
            WHERE {
                <${moduleIri}> Cap:providesSkill ?skill.
                ?skill Cap:hasStateMachine ?stateMachine.
                OPTIONAL {
                    ?skill Cap:hasCurrentState ?currentState.
                    ?currentState rdf:type ?currentStateTypeIri.
                    ?currentStateTypeIri sesame:directSubClassOf/sesame:directSubClassOf ISA88:State.
                }
                ${parameterQueryFragment}
                ${outputQueryFragment}
            }`;
            const rawResults = await this.graphDbConnection.executeQuery(query);
            const mappedResults = converter.convertToDefinition(rawResults.results.bindings, skillMapping, false).getFirstRootElement() as SkillQueryResult[];
            const skillDtos = mappedResults.map(result => new SkillDto(result));

            for (const skillDto of skillDtos) {
                const capabilityDtos = await this.capabilityService.getCapabilitiesOfSkill(skillDto.skillIri);
                skillDto.capabilityDtos = capabilityDtos;
            }

            return skillDtos;
        } catch(error) {
            throw new Error(`Error while returning skills of module ${moduleIri}. Error: ${error}`);
        }
    }

    async getSkillsForCapability(capabilityIri: string): Promise<SkillDto[]> {
        try {
            const query = `
            PREFIX Cap: <http://www.hsu-ifa.de/ontologies/capability-model#>
            PREFIX ISA88: <http://www.hsu-ifa.de/ontologies/ISA-TR88#>
            PREFIX sesame: <http://www.openrdf.org/schema/sesame#>
            SELECT ?skill ?stateMachine ?currentStateTypeIri
                ?parameterIri ?parameterName ?parameterType ?parameterRequired ?parameterDefault ?paramOptionValue
                ?outputIri ?outputName ?outputType ?outputRequired ?outputDefault ?outputOptionValue
                WHERE {
                <${capabilityIri}> Cap:isExecutableVia ?skill.
                ?skill Cap:hasStateMachine ?stateMachine.
                OPTIONAL {
                    ?skill Cap:hasCurrentState ?currentState.
                    ?currentState rdf:type ?currentStateTypeIri.
                    ?currentStateTypeIri sesame:directSubClassOf/sesame:directSubClassOf ISA88:State.
                }
                OPTIONAL {
                    ?skill Cap:hasSkillParameter ?parameter.
                }
                ${parameterQueryFragment}
                ${outputQueryFragment}
            }`;
            const rawResults = await this.graphDbConnection.executeQuery(query);
            const skillResults = converter.convertToDefinition(rawResults.results.bindings, skillMapping, false).getFirstRootElement() as SkillQueryResult[];
            const skillDtos = skillResults.map(result => new SkillDto(result));

            for (const skillDto of skillDtos) {
                const capabilityDtos = await this.capabilityService.getCapabilitiesOfSkill(skillDto.skillIri);
                skillDto.capabilityDtos = capabilityDtos;
            }

            return skillDtos;
        } catch(error) {
            throw new Error(`Error while returning all skills that are suited for capability ${capabilityIri}. Error: ${error}`);
        }
    }

    /**
     * Delete a skill with a given IRI
     * @param skillIri IRI of the skill to delete
     */
    async deleteSkill(skillIri: string): Promise<string> {
        try {
            const query = `
            PREFIX Cap: <http://www.hsu-ifa.de/ontologies/capability-model#>
            SELECT ?skill ?graph WHERE {
                BIND(<${skillIri}> AS ?skill)
                ?skill a ?skillType.
                ?type rdfs:subClassOf Cap:Skill.
                GRAPH ?graph {
                    ?skill a ?skillType
                    }
                }`;

            const queryResult = await this.graphDbConnection.executeQuery(query);
            const queryResultBindings = queryResult.results.bindings;

            if (queryResultBindings.length == 0) {
                throw new Error(`No graph could be found. Deleting skill ${skillIri} failed.`);
            }

            // iterate over graphs and clear every one
            queryResultBindings.forEach(bindings => {
                const graphName = bindings.graph.value;
                this.graphDbConnection.clearGraph(graphName);
            });
            this.socketGateway.emitEvent(SocketEventName.Skills_Deleted, `Sucessfully deleted skill with IRI ${skillIri}}`);
            return `{message: Sucessfully deleted skill with IRI ${skillIri}}`;
        } catch (error) {
            throw new Error(
                `Error while trying to delete skill with IRI ${skillIri}. Error: ${error}`
            );
        }
    }

    async updateState(skillIri:string, newStateTypeIri: string): Promise<string> {
        try {
            const deleteQuery = `
            PREFIX Cap: <http://www.hsu-ifa.de/ontologies/capability-model#>
            DELETE WHERE {
                <${skillIri}> Cap:hasCurrentState ?oldCurrentState.
            }`;
            await this.graphDbConnection.executeUpdate(deleteQuery);

            const insertQuery = `
            PREFIX Cap: <http://www.hsu-ifa.de/ontologies/capability-model#>
            INSERT {
                <${skillIri}> Cap:hasCurrentState ?newState.
            } WHERE {
                ?newState a <${newStateTypeIri}>.
            }`;
            await this.graphDbConnection.executeUpdate(insertQuery);
            this.socketGateway.emitStateChangeInfo({skillIri: skillIri, newStateTypeIri: newStateTypeIri});
            return `Sucessfully updated currentState of skill ${skillIri}`;
        } catch (error) {
            throw new Error(
                `Error while trying to update currentState of skill: ${skillIri}. Error: ${error}`
            );
        }
    }

    /**
     * Returns the skill in the given graph. Can be used to get the latest skill
     */
    async getSkillInGraph(graphIri: string): Promise<{skillIri: string, skillTypeIri: string}> {
        const query = `
        PREFIX Cap: <http://www.hsu-ifa.de/ontologies/capability-model#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?skillIri ?skillTypeIri ?g
        WHERE {
            ?skillTypeIri rdfs:subClassOf Cap:Skill.   # Get the explicit type that was used to register the skill
            GRAPH ?g {
                ?skillIri a ?skillTypeIri.             # Get the graph where the skill was registered
            }
            FILTER (?g = <urn:${graphIri}>)         # Only get the skill inside the given graph
        }`;
        const queryResult = await this.graphDbConnection.executeQuery(query);
        const skillIri = queryResult.results.bindings[0]["skillIri"].value as string;
        const skillTypeIri = queryResult.results.bindings[0]["skillTypeIri"].value as string;
        return {skillIri, skillTypeIri};
    }


    /**
     * Get the skill type of a given skill
     * @param skillIri IRI of the skill to get the type of
     */
    public async getSkillType(skillIri: string): Promise<string> {
        const query = `
        PREFIX Cap: <http://www.hsu-ifa.de/ontologies/capability-model#>
        PREFIX sesame: <http://www.openrdf.org/schema/sesame#>
        SELECT ?skill ?skillType WHERE {
            ?skill a Cap:Skill.
            ?skill a ?skillType.
            FILTER(?skill = IRI("${skillIri}")) # Filter for this one specific skill
            FILTER(!isBlank(?skillType ))       # Filter out all blank nodes
    		FILTER(STRSTARTS(STR(?skillType), "http://www.hsu-ifa.de/ontologies/capability-model")) # Filter just the classes from cap model
            FILTER NOT EXISTS {
                ?someSubSkillSubClass sesame:directSubClassOf ?skillType.
            }
        }`;
        const queryResult = await this.graphDbConnection.executeQuery(query);
        const skillTypeIri = queryResult.results.bindings[0]["skillType"].value;
        return skillTypeIri;
    }
}