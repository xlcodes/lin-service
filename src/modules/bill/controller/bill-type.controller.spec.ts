import { Test, TestingModule } from '@nestjs/testing';
import { BillTypeController } from './bill-type.controller';
import { BillTypeService } from '@/modules/bill/service/bill-type.service';

describe('BillTypeController', () => {
  let controller: BillTypeController;

  const mockBillTypeService = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillTypeController],
      providers: [
        {
          provide: BillTypeService,
          useValue: mockBillTypeService,
        },
      ],
    }).compile();

    controller = module.get<BillTypeController>(BillTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
