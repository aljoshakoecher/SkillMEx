import { Body, Controller, Get, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MappingServiceConfig } from '../../../models/mappings/MappingServiceConfig';
import { PlcMappingService } from './plc-mapping.service';

@Controller('mappings/plc')
export class PlcMappingController {

    constructor(private mappingService: PlcMappingService){}

    /**
     * Return the current URL of the MTP Mapping service
     */
    @Get('config')
    getConfig(): MappingServiceConfig {
        return this.mappingService.getConfig();
    }


    /**
     * Add a new file to be mapped. Will be mapped directly using the MTP mapping service
     * @param file
     */
    @Put('config')
    changeConfig(@Body() newConfing: { url: string }): void {
        this.mappingService.setUrl(newConfing.url);
    }


    /**
     * Add a new file to be mapped. Will be mapped directly using the mapping service
     * @param file
     */
    @Post()
    @UseInterceptors(FileInterceptor('plc-file'))
    uploadFile(@Body() additionalData: AdditionalPlcMappingInfo, @UploadedFile() file: Express.Multer.File): Promise<string> {
        return this.mappingService.executeMapping(additionalData, file);
    }

}

export interface AdditionalPlcMappingInfo {
    endpointUrl: string,
    nodeIdRoot: string
}