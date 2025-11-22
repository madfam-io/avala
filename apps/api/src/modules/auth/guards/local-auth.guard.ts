import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * LocalAuthGuard - validates email/password on login
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
