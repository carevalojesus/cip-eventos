import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { CreateEventDto } from '../dto/create-event.dto';

@Injectable()
export class EventModalityValidatorPipe implements PipeTransform {
  transform(value: CreateEventDto) {
    // value contiene el JSON que envía el usuario ya transformado a objeto

    // IDs basados en tu Seed SQL (Esto podría mejorarse consultando DB, pero es eficiente así)
    const MODALITY_PRESENTIAL = 1;
    const MODALITY_VIRTUAL = 2;
    const MODALITY_HYBRID = 3;

    // 1. Validar Presencial
    if (value.modalityId === MODALITY_PRESENTIAL) {
      if (!value.location) {
        throw new BadRequestException('Para eventos Presenciales, la ubicación (location) es obligatoria');
      }
      if (value.virtualAccess) {
        throw new BadRequestException('Un evento Presencial no debe tener accesos virtuales');
      }
    }

    // 2. Validar Virtual
    if (value.modalityId === MODALITY_VIRTUAL) {
      if (!value.virtualAccess) {
        throw new BadRequestException('Para eventos Virtuales, el acceso virtual es obligatorio');
      }
      if (value.location) {
        throw new BadRequestException('Un evento Virtual no debe tener ubicación física');
      }
    }

    // 3. Validar Híbrido
    if (value.modalityId === MODALITY_HYBRID) {
      if (!value.location || !value.virtualAccess) {
        throw new BadRequestException('Para eventos Híbridos, se requiere tanto ubicación como acceso virtual');
      }
    }

    // Si todo está bien, dejamos pasar los datos
    return value;
  }
}