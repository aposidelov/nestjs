import { NotFoundException } from '@nestjs/common';

export default class PostNotFoundException extends NotFoundException {
  constructor(postId: number) {
    super(`Post with id ${postId} not found`);
  }
}