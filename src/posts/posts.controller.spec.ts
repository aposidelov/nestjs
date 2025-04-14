import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import PostsController from './posts.controller';
import PostsService from './posts.service';
import CreatePostDto from './dto/createPost.dto';
import UpdatePostDto from './dto/updatePost.dto';

describe('PostController', () => {
  let app: INestApplication;
  let postsService = {
    createPost: jest.fn(),
    getAllPosts: jest.fn(),
    getPostById: jest.fn(),
    updatePost: jest.fn(),
    deletePost: jest.fn(),
  };
  let posts = [
    {
      id: 1,
      title: 'Test title1',
      content: 'Test content1',
    },
    {
      id: 2,
      title: 'Test title2',
      content: 'Test content2',
    },
    {
      id: 3,
      title: 'Test title3',
      content: 'Test content3',
    },
  ];
  let createdPostId: number;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: postsService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/posts (POST) should create a post', async () => {
    const postDto: CreatePostDto = {
      title: 'Test title1',
      content: 'Test content1',
    };
    postsService.createPost.mockReturnValue({
      id: 1,
      ...postDto,
    });

    const res = await request(app.getHttpServer())
      .post('/posts')
      .send(postDto)
      .expect(201);

    expect(res.body).toEqual({
      id: 1,
      title: postDto.title,
      content: postDto.content,
    });
    expect(postsService.createPost).toHaveBeenCalledWith(postDto);
    createdPostId = res.body.id;
  });

  it('/posts (GET) should return all posts', async () => {
    postsService.getAllPosts.mockReturnValue(posts);
    const res = await request(app.getHttpServer()).get('/posts').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
  });

  it('/posts/:id (GET) should return specific post', async () => {
    postsService.getPostById.mockReturnValue(posts[createdPostId]);
    const res = await request(app.getHttpServer())
      .get(`/posts/${createdPostId}`)
      .expect(200);
    const body = res.body;
    expect(body).not.toBeNull();
    expect(body).toBeInstanceOf(Object);
    expect(Array.isArray(body)).toBe(false);

    expect(body).toEqual(posts[createdPostId]);
  });

  it('/posts/:id (PUT) should update specific post', async () => {
    const updatedDto: UpdatePostDto = {
      id: createdPostId,
      title: 'Test title upd',
      content: 'Test content upd',
    };

    postsService.updatePost.mockReturnValue(updatedDto);

    const res = await request(app.getHttpServer())
      .put(`/posts/${createdPostId}`)
      .send(updatedDto)
      .expect(200);

    const body = res.body;
    expect(body).not.toBeNull();
    expect(body).toBeInstanceOf(Object);
    expect(Array.isArray(body)).toBe(false);

    expect(body).toEqual(updatedDto);
  });

  it('/posts/:id (DELETE) should delete specific post', async () => {
    postsService.deletePost.mockImplementation((postId) => {
      postsService.getPostById.mockImplementation((postId) => {
        throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
      });
      return true;
    });
    await request(app.getHttpServer())
      .delete(`/posts/${createdPostId}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/posts/${createdPostId}`)
      .expect(404);
  });
});
