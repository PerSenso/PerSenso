import { ViewerSanitizerInterceptor } from './viewer-sanitizer.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

function makeContext(role: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: { role } }),
    }),
  } as unknown as ExecutionContext;
}

function makeHandler(data: any): CallHandler {
  return { handle: () => of(data) };
}

describe('ViewerSanitizerInterceptor', () => {
  let interceptor: ViewerSanitizerInterceptor;

  beforeEach(() => {
    interceptor = new ViewerSanitizerInterceptor();
  });

  describe('VIEWER role', () => {
    it('removes sensitive fields from a flat object', (done) => {
      const data = {
        id: '1',
        total: 100,
        costPrice: 60,
        unitCostAtSale: 60,
        profitAtSale: 40,
        marginPctAtSale: 40,
      };

      interceptor
        .intercept(makeContext('VIEWER'), makeHandler(data))
        .subscribe((result) => {
          expect(result.id).toBe('1');
          expect(result.total).toBe(100);
          expect(result.costPrice).toBeUndefined();
          expect(result.unitCostAtSale).toBeUndefined();
          expect(result.profitAtSale).toBeUndefined();
          expect(result.marginPctAtSale).toBeUndefined();
          done();
        });
    });

    it('removes sensitive fields from an array of objects', (done) => {
      const data = [
        { id: '1', total: 100, costPrice: 60, profitAtSale: 40 },
        { id: '2', total: 200, costPrice: 80, profitAtSale: 60 },
      ];

      interceptor
        .intercept(makeContext('VIEWER'), makeHandler(data))
        .subscribe((result) => {
          expect(result).toHaveLength(2);
          expect(result[0].costPrice).toBeUndefined();
          expect(result[1].costPrice).toBeUndefined();
          done();
        });
    });

    it('removes sensitive fields from nested objects', (done) => {
      const data = {
        id: '1',
        total: 100,
        product: { id: 'p1', name: 'Sauvage', costPrice: 80 },
      };

      interceptor
        .intercept(makeContext('VIEWER'), makeHandler(data))
        .subscribe((result) => {
          expect(result.product.costPrice).toBeUndefined();
          expect(result.product.name).toBe('Sauvage');
          done();
        });
    });
  });

  describe('ADMIN role', () => {
    it('preserves all fields for ADMIN', (done) => {
      const data = { id: '1', total: 100, costPrice: 60, profitAtSale: 40 };

      interceptor
        .intercept(makeContext('ADMIN'), makeHandler(data))
        .subscribe((result) => {
          expect(result.costPrice).toBe(60);
          expect(result.profitAtSale).toBe(40);
          done();
        });
    });
  });

  describe('OWNER role', () => {
    it('preserves all fields for OWNER', (done) => {
      const data = { id: '1', costPrice: 60, marginPctAtSale: 40 };

      interceptor
        .intercept(makeContext('OWNER'), makeHandler(data))
        .subscribe((result) => {
          expect(result.costPrice).toBe(60);
          expect(result.marginPctAtSale).toBe(40);
          done();
        });
    });
  });
});
