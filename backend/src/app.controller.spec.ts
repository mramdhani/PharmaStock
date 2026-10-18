import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';

describe('AppController (health)', () => {
  let controller: AppController;
  // DataSource palsu (mock) supaya unit test tidak butuh database sungguhan.
  const dataSource = { query: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: DataSource, useValue: dataSource }],
    }).compile();

    controller = moduleRef.get(AppController);
    dataSource.query.mockReset();
  });

  it('returns ok when database responds', async () => {
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);
    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('throws 503 when database is down', async () => {
    dataSource.query.mockRejectedValue(new Error('connection refused'));
    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
