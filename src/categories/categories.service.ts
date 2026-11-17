import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AuthRequest } from 'src/types/auth-request.type';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, req: AuthRequest) {
    const category = this.categoryRepository.create({
      name: createCategoryDto.name,
      user: { id: req.user.sub },
    });

    return await this.categoryRepository.save(category);
  }

  async findAll(req: AuthRequest) {
    return this.categoryRepository.find({
      where: { user: { id: req.user.sub } },
    });
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    req: AuthRequest,
  ) {
    const category = await this.findOne(id, req);

    category.name = updateCategoryDto.name;

    return this.categoryRepository.save(category);
  }

  async findOne(id: number, req: AuthRequest) {
    const category = await this.categoryRepository.findOne({
      where: { id, user: { id: req.user.sub } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async remove(id: number, req: AuthRequest) {
    const category = await this.findOne(id, req);

    await this.categoryRepository.delete(category.id);

    return { message: 'Category successfully deleted' };
  }
}
