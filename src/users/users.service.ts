import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const findUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (findUser) {
      throw new BadRequestException('email already in use');
    }
    const user = this.userRepository.create(createUserDto);

    const { password: _, ...newUser } = user;

    await this.userRepository.save(user);

    return newUser;
  }
}
