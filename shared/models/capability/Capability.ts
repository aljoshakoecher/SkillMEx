import { RdfElement, RdfElementDto } from "../RdfElement";
import { FpbElement } from "../fpb/FpbElement";

export class Capability extends RdfElement {
    public inputs? = new Array<FpbElement>();
    public outputs? = new Array<FpbElement>();

    constructor(dto: CapabilityDto) {
        super(dto.iri);
        this.inputs = dto.inputs;
        this.outputs = dto.outputs;
    }
}


export class CapabilityDto extends RdfElementDto{
	public capabilityType: RdfElementDto;
	public inputs? = new Array<FpbElement>();
	public outputs? = new Array<FpbElement>();
}
