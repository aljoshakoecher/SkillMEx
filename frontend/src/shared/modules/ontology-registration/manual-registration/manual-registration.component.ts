import { Component, Input, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { CapabilityService } from 'src/shared/services/capability.service';
import { ModuleService } from 'src/shared/services/module.service';
import { SkillService } from 'src/shared/services/skill.service';

@Component({
    selector: 'manual-registration',
    templateUrl: './manual-registration.component.html',
    styleUrls: ['./manual-registration.component.scss']
})
export class ManualRegistrationComponent {
    @Input() context: string
    ontologyString: string;

    constructor(
        private moduleService: ModuleService,
        private skillService: SkillService,
        private capabilityService: CapabilityService) { }

    submit(): void {
        if(this.context=="module"){
            this.moduleService.addModule(this.ontologyString).pipe(take(1)).subscribe(
                () => this.ontologyString="Ontology registered"
            );
        }
        if(this.context=="skill") {
            this.skillService.addSkill(this.ontologyString).pipe(take(1)).subscribe(
                () => this.ontologyString="Ontology registered"
            );
        }
        if(this.context == "capability") {
            this.capabilityService.addCapability(this.ontologyString).pipe(take(1)).subscribe(
                () => this.ontologyString="Ontology registered"
            );
        }
    }

}