import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const SENSITIVE_FIELDS = [
  'costPrice',
  'unitCostAtSale',
  'profitAtSale',
  'marginPctAtSale',
];

@Injectable()
export class ViewerSanitizerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const user = context.switchToHttp().getRequest().user;
    if (user?.role !== 'VIEWER') return next.handle();

    return next.handle().pipe(map((data) => this.sanitize(data)));
  }

  private sanitize(data: any): any {
    if (Array.isArray(data)) return data.map((item) => this.sanitize(item));
    if (data !== null && typeof data === 'object') {
      const cleaned = { ...data };
      for (const field of SENSITIVE_FIELDS) {
        delete cleaned[field];
      }
      for (const key of Object.keys(cleaned)) {
        if (cleaned[key] !== null && typeof cleaned[key] === 'object') {
          cleaned[key] = this.sanitize(cleaned[key]);
        }
      }
      return cleaned;
    }
    return data;
  }
}
