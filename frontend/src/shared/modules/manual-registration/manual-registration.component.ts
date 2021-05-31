import { Component, Input} from '@angular/core';
import { ModuleService } from '../../../shared/services/module.service';
import { SkillService } from '../../../shared/services/skill.service';
import { CapabilityService } from '../../../shared/services/capability.service';
import { HttpClient } from "@angular/common/http";
import { MtpMappingService } from 'src/shared/services/mtp-mapping.service';

@Component({
    selector: 'manual-registration',
    templateUrl: './manual-registration.component.html',
    styleUrls: ['./manual-registration.component.scss']
})
export class ManualRegistrationComponent {

    @Input() context: string


    addedFile: File;
    ontologyString: string;
    errMessage: any;
    ontologyType= "manualOntology";
    manual: boolean;


    constructor(
        private httpClient: HttpClient,
        private moduleService: ModuleService,
        private skillService: SkillService,
        private capabilityService: CapabilityService,
        private mtpMappingService: MtpMappingService) {}

    ngOnInit(): void {
        console.log(this.ontologyType);
    }

    onFileAdded(event){
        // for (let i = 0; i < event.target.files.length; i++) {
        //     this.addedFiles.push(event.target.files[i]);
        // }
        this.addedFile=event.target.files[0];

        console.log(this.addedFile);
        //console.log(event);
    }


    submit() {

        //Fallunterscheidung
        if(this.context=="module"){
            switch (this.ontologyType) {
            case "manualOntology":
                this.moduleService.addModule(this.ontologyString).subscribe(
                    (err) => this.errMessage = err.error.message,
                    () => {
                        this.errMessage = "";
                        this.ontologyString="Ontology registered"; //Variablenwert wird nicht in ontologyString gespeichert
                    }
                );
                break;
            case "mtp":
                console.log("adding MTP file");

                this.mtpMappingService.executeMapping(this.addedFile).subscribe(res => {
                    console.log(res);
                },
                (err) => this.errMessage=err.error.message,
                ()=>{
                    this.errMessage="";
                    this.ontologyString="Ontology registered";
                });
                break;
            default:
                console.log("Error. Please specify what type of ontology registration you want to perform.");

                break;
            }


        }
        if(this.context=="skill"){
            if (this.ontologyType=="manualOntology"){
                console.log(this.ontologyString);
                this.skillService.addSkill(this.ontologyString).subscribe(null,
                    (err) => this.errMessage = err.error.message,
                    () => {
                        this.errMessage = "";
                        this.ontologyString="Ontology registered"; //Variablenwert wird nicht in ontologyString gespeichert
                    }
                );
            }
            // else {
            //     this.skillService.addMtpSkill(this.addedFile).subscribe(null,
            //         (err) => this.errMessage=err.error.message,
            //         ()=>{
            //             this.errMessage="";
            //             this.ontologyString="Ontology registered";
            //         });
            // }
        }
        if(this.context=="capability"){
            if(this.ontologyType=="manualOntology"){
                console.log(this.ontologyString);
                this.capabilityService.addCapability(this.ontologyString).subscribe(null,
                    (err) => this.errMessage = err.error.message,
                    () => {
                        this.errMessage = "";
                        this.ontologyString="Ontology registered"; //Variablenwert wird nicht in ontologyString gespeichert
                    }
                );
            }
            else {
                // this.capabilityService.addMtpCapability(this.addedFile).subscribe(null,
                //     (err) => this.errMessage = err.error.message,
                //     () => {
                //         this.errMessage = "";
                //         this.ontologyString="Ontology registered"; //Variablenwert wird nicht in ontologyString gespeichert
                //     }
                // );
            }
        }


    }
    // saveMtpOntology(){
    //     console.log("submitted MTP");
    // }

}