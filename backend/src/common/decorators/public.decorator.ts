import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Shënon një route si publik — JwtAuthGuard e anashkalon. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
