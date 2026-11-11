import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { CategoriesService } from './categories.service';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import type { AuthRequest } from 'src/types/auth-request.type';

@UseGuards(AuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}
  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() req: AuthRequest,
  ) {
    return this.categoryService.create(createCategoryDto, req);
  }
  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.categoryService.findAll(req);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.categoryService.findOne(id, req);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: AuthRequest,
  ) {
    return this.categoryService.update(id, updateCategoryDto, req);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.categoryService.remove(id, req);
  }
}
