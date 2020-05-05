import { Injectable } from '@nestjs/common';
import { GraphDbConnectionService } from 'util/GraphDbConnection.service';
import { Capability } from '../../../shared/models/capability/Capability';
import { capabilityMapping } from './capability-mappings';
import { v4 as uuidv4 } from 'uuid';
import { SocketGateway } from 'socket-gateway/socket.gateway';

import SparqlResultConverter = require('sparql-result-converter');  // strange syntax because SparqlConverter doesn't allow ES6-imports yet
const converter = new SparqlResultConverter();

@Injectable()
export class CapabilityService {
    constructor(
        private graphDbConnection: GraphDbConnectionService,
        private socketGateway: SocketGateway
    ) { }

    /**
     * Registers a new capability in the graph DB
     * @param newCapability Rdf document describing the new capability
     */
    async addCapability(newCapability: string): Promise<string> {
        try {
            // create a graph name for the service (uuid)
            const capabilityGraphName = uuidv4();

            this.graphDbConnection.addRdfDocument(newCapability, capabilityGraphName);
            this.socketGateway.emitEvent('new-capability');
            return 'New capability successfully added';
        } catch (error) {
            throw new Error(`Error while registering a new capability. Error: ${error}`);
        }
    }

    /**
     * Returns all currently registered capabilities (optionally with their in- and outputs)
     */
    async getAllCapabilities(): Promise<Array<Capability>> {
        try {
            const queryResult = await this.graphDbConnection.executeQuery(`
            PREFIX VDI3682: <http://www.hsu-ifa.de/ontologies/VDI3682#>
            PREFIX VDI2206: <http://www.hsu-ifa.de/ontologies/VDI2206#>
            PREFIX Cap: <http://www.hsu-ifa.de/ontologies/capability-model#>
            SELECT ?capability ?input ?output WHERE {
                ?capability a Cap:Capability.
                OPTIONAL{
                    ?capability VDI3682:hasInput ?input.
                    ?input a ?fpbElement.
                    VALUES ?fpbElement {VDI3682:Energy VDI3682:Product VDI3682:Information}
                }
                OPTIONAL{
                    ?capability VDI3682:hasInput ?output.
                    ?output a ?fpbElement.
                    VALUES ?fpbElement {VDI3682:Energy VDI3682:Product VDI3682:Information}
                }
            }`);
            const capabilities = converter.convert(queryResult.results.bindings, capabilityMapping) as Array<Capability>;
            return capabilities;
        } catch (error) {
            console.error(`Error while returning all capabilities, ${error}`);
            throw new Error(error);
        }
    }

    /**
     * Gets a specific capability by its IRI
     * @param capabilityIri IRI of the capability to get
     */
    async getCapabilityByIri(capabilityIri: string): Promise<Capability> {
        console.log(capabilityIri);

        try {
            const queryResult = await this.graphDbConnection.executeQuery(`
            PREFIX Cap: <http://www.hsu-ifa.de/ontologies/capability-model#>
            SELECT ?capability WHERE {
                ?capability a Cap:Capability.
                FILTER(?capability = IRI("${capabilityIri}")).
            }`);
            const capability = converter.convert(queryResult.results.bindings, capabilityMapping)[0] as Capability;
            return capability;
        } catch (error) {
            console.error(`Error while returning capability with IRI ${capabilityIri}, ${error}`);
            throw new Error(error);
        }
    }

    /**
     * Get all capabilities of a given module
     * @param moduleIri IRI of the module to get capabilities of
     */
    async getCapabilitiesOfModule(moduleIri: string): Promise<Array<Capability>> {
        try {
            const queryResult = await this.graphDbConnection.executeQuery(`
            PREFIX Cap: <http://www.hsu-ifa.de/ontologies/capability-model#>
            PREFIX VDI3682: <http://www.hsu-ifa.de/ontologies/VDI3682#>
            SELECT ?capability ?input ?output WHERE {
                ?capability a Cap:Capability.
                ?resource a VDI3682:TechnicalResource.
                OPTIONAL{
                    ?capability VDI3682:hasInput ?input.
                    ?input a ?fpbElement.
                    VALUES ?fpbElement {VDI3682:Energy VDI3682:Product VDI3682:Information}
                }
                OPTIONAL{
                    ?capability VDI3682:hasInput ?output.
                    ?output a ?fpbElement.
                    VALUES ?fpbElement {VDI3682:Energy VDI3682:Product VDI3682:Information}
                }
                FILTER(?resource = IRI("${moduleIri}"))
            }`);
            const capabilities = converter.convert(queryResult.results.bindings, capabilityMapping) as Array<Capability>;
            return capabilities;
        } catch (error) {
            console.error(`Error while returning all capabilities of module ${moduleIri}, ${error}`);
            throw new Error(error);
        }
    }


    /**
     * Delete a capability with a given IRI
     * @param capabilityIri IRI of the capability to delete
     */
    async deleteCapability(capabilityIri: string): Promise<string> {
        try {
            const query = `
            PREFIX Cap: <http://www.hsu-ifa.de/ontologies/capability-model#>
            SELECT ?capability ?graph WHERE {
                GRAPH ?graph {
                    BIND(IRI("${capabilityIri}") AS ?capability).
                    ?capability a Cap:Capability.
                    }
                }
            }`;

            const queryResult = await this.graphDbConnection.executeQuery(query);
            const queryResultBindings = queryResult.results.bindings;

            // iterate over graphs and clear every one
            queryResultBindings.forEach(bindings => {
                const graphName = bindings.graph.value;
                this.graphDbConnection.clearGraph(graphName);
            });
            return `Sucessfully deleted capability with IRI ${capabilityIri}`;
        } catch (error) {
            throw new Error(
                `Error while trying to delete capability with IRI ${capabilityIri}. Error: ${error}`
            );
        }
    }
}
