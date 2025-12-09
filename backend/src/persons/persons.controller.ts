import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PersonsService } from './persons.service';
import { PersonMergeService } from './services/person-merge.service';
import { DataDeletionService } from './services/data-deletion.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { MergePersonsDto } from './dto/merge-persons.dto';
import { MergeResultDto } from './dto/merge-result.dto';
import { DuplicatePersonsResponseDto } from './dto/duplicate-person.dto';
import { PseudonymizePersonDto } from './dto/pseudonymize-person.dto';
import { DeletionStatusDto } from './dto/deletion-status.dto';
import { DocumentType } from './entities/person.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../roles/entities/role.entity';

@ApiTags('persons')
@Controller('persons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PersonsController {
  constructor(
    private readonly personsService: PersonsService,
    private readonly personMergeService: PersonMergeService,
    private readonly dataDeletionService: DataDeletionService,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user nominal data',
    description: 'Returns the Person record linked to the current authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Person data retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No Person linked to this user',
  })
  async findMyPerson(@CurrentUser() user: { userId: string }) {
    const person = await this.personsService.findByUserId(user.userId);
    return { data: person, hasData: !!person };
  }

  @Post('me')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create and link nominal data to current user',
    description: 'Creates a new Person record and links it to the current authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: 'Person data created and linked successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'User already has linked Person or document already exists',
  })
  async createMyPerson(
    @CurrentUser() user: { userId: string },
    @Body() createPersonDto: CreatePersonDto,
  ) {
    return this.personsService.createAndLinkToUser(user.userId, createPersonDto);
  }

  @Post()
  create(@Body() createPersonDto: CreatePersonDto) {
    return this.personsService.create(createPersonDto);
  }

  @Get()
  findAll() {
    return this.personsService.findAll();
  }

  @Get('by-email/:email')
  findByEmail(@Param('email') email: string) {
    return this.personsService.findByEmail(email);
  }

  @Get('by-document')
  findByDocument(
    @Query('type') type: DocumentType,
    @Query('number') number: string,
  ) {
    return this.personsService.findByDocument(type, number);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePersonDto: UpdatePersonDto) {
    return this.personsService.update(id, updatePersonDto);
  }

  @Patch(':id/link-user')
  @HttpCode(HttpStatus.OK)
  linkToUser(@Param('id') id: string, @Body('userId') userId: string) {
    return this.personsService.linkToUser(id, userId);
  }

  @Patch(':id/unlink-user')
  @HttpCode(HttpStatus.OK)
  unlinkFromUser(@Param('id') id: string) {
    return this.personsService.unlinkFromUser(id);
  }

  @Post(':primaryId/merge/:secondaryId')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Merge two persons',
    description:
      'Merges secondary person into primary person. All references are reassigned to primary person and secondary person is marked as MERGED.',
  })
  @ApiResponse({
    status: 200,
    description: 'Persons merged successfully',
    type: MergeResultDto,
  })
  async mergePerson(
    @Param('primaryId') primaryId: string,
    @Param('secondaryId') secondaryId: string,
    @Body() mergeDto: MergePersonsDto,
    @Req() req: any,
  ): Promise<MergeResultDto> {
    const performedBy = req.user;
    return this.personMergeService.merge(
      primaryId,
      secondaryId,
      performedBy,
      mergeDto,
    );
  }

  @Get(':id/duplicates')
  @ApiOperation({
    summary: 'Find potential duplicate persons',
    description:
      'Searches for persons with the same email or document number',
  })
  @ApiResponse({
    status: 200,
    description: 'List of potential duplicates',
    type: DuplicatePersonsResponseDto,
  })
  async findDuplicates(
    @Param('id') id: string,
  ): Promise<DuplicatePersonsResponseDto> {
    const duplicates = await this.personMergeService.findPotentialDuplicates(
      id,
    );

    // Calcular razones de duplicidad y score para cada uno
    const person = await this.personsService.findOne(id);
    const duplicatesWithReasons = duplicates.map((duplicate) => {
      const reasons: string[] = [];
      let similarityScore = 0;

      if (duplicate.email === person.email) {
        reasons.push('Same email address');
        similarityScore += 50;
      }

      if (
        duplicate.documentType === person.documentType &&
        duplicate.documentNumber === person.documentNumber
      ) {
        reasons.push('Same document type and number');
        similarityScore += 50;
      }

      return {
        person: duplicate,
        duplicateReasons: reasons,
        similarityScore,
      };
    });

    return {
      duplicates: duplicatesWithReasons,
      total: duplicatesWithReasons.length,
    };
  }

  @Get(':id/merge-history')
  @ApiOperation({
    summary: 'Get merge history',
    description: 'Returns all persons that were merged into this person',
  })
  @ApiResponse({
    status: 200,
    description: 'List of merged persons',
  })
  async getMergeHistory(@Param('id') id: string) {
    return this.personMergeService.getMergeHistory(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.personsService.remove(id);
  }

  @Post(':id/pseudonymize')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Pseudonymize person data',
    description:
      'Anonymizes personal identifiable information while preserving records for audit purposes. This is a GDPR compliance feature.',
  })
  @ApiResponse({
    status: 200,
    description: 'Person data pseudonymized successfully',
  })
  async pseudonymizePerson(
    @Param('id') personId: string,
    @Body() dto: PseudonymizePersonDto,
    @Req() req: any,
  ) {
    const performedBy = req.user;
    return this.dataDeletionService.executePseudonymization(
      personId,
      performedBy.userId,
      dto,
    );
  }

  @Get(':id/deletion-status')
  @ApiOperation({
    summary: 'Get deletion status',
    description: 'Returns the deletion and pseudonymization status of a person',
  })
  @ApiResponse({
    status: 200,
    description: 'Deletion status retrieved successfully',
    type: DeletionStatusDto,
  })
  async getDeletionStatus(
    @Param('id') personId: string,
  ): Promise<DeletionStatusDto> {
    return this.dataDeletionService.getDeletionStatus(personId);
  }

  @Get('pending-deletions')
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get pending deletion requests',
    description: 'Returns all persons with pending deletion requests',
  })
  @ApiResponse({
    status: 200,
    description: 'List of persons with pending deletion requests',
  })
  async getPendingDeletions() {
    return this.dataDeletionService.getPendingDeletionRequests();
  }
}
