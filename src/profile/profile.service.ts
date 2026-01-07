import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { Child } from './entities/child.entity';
import { Interest } from './entities/interest.entity';
import { ProfileInterest } from './entities/profile-interest.entity';
import { CreateProfileDto } from './dtos/create-profile.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { CreateChildDto } from './dtos/create-child.dto';
import { UpdateChildDto } from './dtos/update-child.dto';
import { UpdatePrivacyDto } from './dtos/update-privacy.dto';
import { ProfileCompletionDto } from './dtos/profile-completion.dto';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Child)
    private readonly childRepository: Repository<Child>,
    @InjectRepository(Interest)
    private readonly interestRepository: Repository<Interest>,
    @InjectRepository(ProfileInterest)
    private readonly profileInterestRepository: Repository<ProfileInterest>,
  ) {}

  

  async create(
    userId: string,
    createProfileDto: CreateProfileDto,
  ): Promise<{ status: number; profile: Profile }> {
    const existingProfile = await this.profileRepository.findOne({
      where: { userId },
    });

    let savedProfile: Profile;
    let status: number;

    if (existingProfile) {
      
      Object.assign(existingProfile, createProfileDto);
      savedProfile = await this.profileRepository.save(existingProfile);
      status = HttpStatus.OK; 
      this.logger.log(`Profile updated for user: ${userId} (existing profile)`);
    } else {
     
      const profile = this.profileRepository.create({
        userId,
        ...createProfileDto,
      });
      savedProfile = await this.profileRepository.save(profile);
      status = HttpStatus.CREATED; 
      this.logger.log(`Profile created for user: ${userId}`);
    }

    
    await this.updateCompletionPercentage(savedProfile.id);

    const profileData = await this.findOne(savedProfile.id);
    return { status, profile: profileData };
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [profiles, total] = await this.profileRepository.findAndCount({
      relations: ['user', 'children', 'profileInterests', 'profileInterests.interest'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: profiles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { id },
      relations: ['user', 'children', 'profileInterests', 'profileInterests.interest'],
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async findByUserId(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['user', 'children', 'profileInterests', 'profileInterests.interest'],
    });

    if (!profile) {
      throw new NotFoundException('Profile not found for this user');
    }

    return profile;
  }

  async update(id: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findOne(id);

    Object.assign(profile, updateProfileDto);
    await this.profileRepository.save(profile);

    await this.updateCompletionPercentage(id);

    this.logger.log(`Profile updated: ${id}`);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const profile = await this.findOne(id);
    await this.profileRepository.remove(profile);

    this.logger.log(`Profile deleted: ${id}`);
  }

  

  async updateProfilePhoto(profileId: string, photoUrl: string): Promise<Profile> {
    const profile = await this.findOne(profileId);

    profile.profilePhotoUrl = photoUrl;
    await this.profileRepository.save(profile);

    await this.updateCompletionPercentage(profileId);

    this.logger.log(`Profile photo updated for: ${profileId}`);

    return this.findOne(profileId);
  }

  async updateCoverPhoto(profileId: string, photoUrl: string): Promise<Profile> {
    const profile = await this.findOne(profileId);

    profile.coverPhotoUrl = photoUrl;
    await this.profileRepository.save(profile);

    this.logger.log(`Cover photo updated for: ${profileId}`);

    return this.findOne(profileId);
  }

 

  async updatePrivacy(profileId: string, privacyDto: UpdatePrivacyDto): Promise<Profile> {
    const profile = await this.findOne(profileId);

    Object.assign(profile, privacyDto);
    await this.profileRepository.save(profile);

    this.logger.log(`Privacy settings updated for: ${profileId}`);

    return this.findOne(profileId);
  }

  // ==================== CHILDREN MANAGEMENT ====================

  async addChild(profileId: string, createChildDto: CreateChildDto): Promise<Child> {
    const profile = await this.findOne(profileId);

    const child = this.childRepository.create({
      profileId,
      ...createChildDto,
    });

    const savedChild = await this.childRepository.save(child);

    await this.profileRepository.update(profileId, {
      numberOfChildren: profile.children.length + 1,
    });

    await this.updateCompletionPercentage(profileId);

    this.logger.log(`Child added to profile: ${profileId}`);

    return savedChild;
  }

  async getChildren(profileId: string): Promise<Child[]> {
    await this.findOne(profileId);

    return this.childRepository.find({
      where: { profileId },
      order: { dateOfBirth: 'DESC' },
    });
  }

  async getChild(profileId: string, childId: string): Promise<Child> {
    const child = await this.childRepository.findOne({
      where: { id: childId, profileId },
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    return child;
  }

  async updateChild(
    profileId: string,
    childId: string,
    updateChildDto: UpdateChildDto,
  ): Promise<Child> {
    const child = await this.getChild(profileId, childId);

    Object.assign(child, updateChildDto);

    this.logger.log(`Child updated: ${childId}`);

    return this.childRepository.save(child);
  }

  async updateChildPhoto(profileId: string, childId: string, photoUrl: string): Promise<Child> {
    const child = await this.getChild(profileId, childId);

    child.photoUrl = photoUrl;

    this.logger.log(`Child photo updated: ${childId}`);

    return this.childRepository.save(child);
  }

  async removeChild(profileId: string, childId: string): Promise<void> {
    const child = await this.getChild(profileId, childId);
    await this.childRepository.remove(child);

    const profile = await this.findOne(profileId);
    await this.profileRepository.update(profileId, {
      numberOfChildren: Math.max(0, profile.children.length - 1),
    });

    await this.updateCompletionPercentage(profileId);

    this.logger.log(`Child removed: ${childId}`);
  }

  

  async addInterests(profileId: string, interestIds: string[]): Promise<Profile> {
    const profile = await this.findOne(profileId);

    const interests = await this.interestRepository.find({
      where: { id: In(interestIds), isActive: true },
    });

    if (interests.length !== interestIds.length) {
      throw new BadRequestException('Some interests not found or inactive');
    }

    const existingInterestIds = profile.profileInterests.map((pi) => pi.interestId);

    const newInterests = interests.filter(
      (interest) => !existingInterestIds.includes(interest.id),
    );

    const profileInterests = newInterests.map((interest) =>
      this.profileInterestRepository.create({
        profileId,
        interestId: interest.id,
      }),
    );

    await this.profileInterestRepository.save(profileInterests);
    await this.updateCompletionPercentage(profileId);

    this.logger.log(`Interests added to profile: ${profileId}`);

    return this.findOne(profileId);
  }

  async removeInterest(profileId: string, interestId: string): Promise<Profile> {
    const profileInterest = await this.profileInterestRepository.findOne({
      where: { profileId, interestId },
    });

    if (!profileInterest) {
      throw new NotFoundException('Interest not found in profile');
    }

    await this.profileInterestRepository.remove(profileInterest);
    await this.updateCompletionPercentage(profileId);

    this.logger.log(`Interest removed from profile: ${profileId}`);

    return this.findOne(profileId);
  }

  async getInterests(profileId: string): Promise<Interest[]> {
    const profile = await this.findOne(profileId);

    return profile.profileInterests.map((pi) => pi.interest);
  }

  

  async getAllInterests(): Promise<Interest[]> {
    return this.interestRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createInterest(
    name: string,
    description?: string,
    iconUrl?: string,
    category?: string,
  ): Promise<Interest> {
    const existingInterest = await this.interestRepository.findOne({
      where: { name },
    });

    if (existingInterest) {
      throw new ConflictException('Interest already exists');
    }

    const interest = this.interestRepository.create({
      name,
      description,
      iconUrl,
      category,
      isActive: true,
    });

    const savedInterest = await this.interestRepository.save(interest);

    this.logger.log(`Interest created: ${name}`);

    return savedInterest;
  }

  

  async getProfileCompletion(profileId: string): Promise<ProfileCompletionDto> {
    const profile = await this.findOne(profileId);

    const requiredFields = [
      { field: 'firstName', label: 'First name', weight: 10 },
      { field: 'lastName', label: 'Last name', weight: 10 },
      { field: 'dateOfBirth', label: 'Date of birth', weight: 10 },
      { field: 'gender', label: 'Gender', weight: 10 },
      { field: 'profilePhotoUrl', label: 'Profile photo', weight: 15 },
      { field: 'bio', label: 'Bio', weight: 10 },
      { field: 'location', label: 'Location', weight: 10 },
      { field: 'numberOfChildren', label: 'Number of children', weight: 5 },
      { field: 'parentingStage', label: 'Parenting stage', weight: 10 },
    ];

    const missingFields: string[] = [];
    let totalWeight = 0;
    let earnedWeight = 0;

    requiredFields.forEach(({ field, label, weight }) => {
      totalWeight += weight;
      if (profile[field] !== null && profile[field] !== undefined) {
        earnedWeight += weight;
      } else {
        missingFields.push(label);
      }
    });

    totalWeight += 10; 
    if (profile.profileInterests && profile.profileInterests.length > 0) {
      earnedWeight += 10;
    } else {
      missingFields.push('Interests');
    }

    if (profile.numberOfChildren > 0) {
      totalWeight += 10; 
      if (profile.children && profile.children.length > 0) {
        earnedWeight += 10;
      } else {
        missingFields.push('Children details');
      }
    }

    const completionPercentage = Math.round((earnedWeight / totalWeight) * 100);

    return {
      completionPercentage,
      missingFields,
      isComplete: completionPercentage === 100,
    };
  }

  private async updateCompletionPercentage(profileId: string): Promise<void> {
    const completion = await this.getProfileCompletion(profileId);

    await this.profileRepository.update(profileId, {
      completionPercentage: completion.completionPercentage,
    });
  }

  
  calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  async searchProfiles(query: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [profiles, total] = await this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .leftJoinAndSelect('profile.children', 'children')
      .leftJoinAndSelect('profile.profileInterests', 'profileInterests')
      .leftJoinAndSelect('profileInterests.interest', 'interest')
      .where('profile.firstName ILIKE :query', { query: `%${query}%` })
      .orWhere('profile.lastName ILIKE :query', { query: `%${query}%` })
      .orWhere('profile.displayName ILIKE :query', { query: `%${query}%` })
      .orWhere('profile.location ILIKE :query', { query: `%${query}%` })
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: profiles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
