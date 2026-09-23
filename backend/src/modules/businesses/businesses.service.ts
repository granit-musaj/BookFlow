import { Injectable, NotFoundException } from '@nestjs/common';
import { shiftCalendarDate, zonedDateParts, zonedLocalToUtc } from '../../common/time/schedule';
import { AuthUser } from '../../common/types/auth-user.type';
import { BusinessesRepository } from './businesses.repository';

function zonedYmd(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');
  return { year: value('year'), month: value('month'), day: value('day') };
}

@Injectable()
export class BusinessesService {
  constructor(private readonly businesses: BusinessesRepository) {}

  async me(user: AuthUser) {
    const business = await this.businesses.findById(user.businessId);
    if (!business) {
      throw new NotFoundException();
    }

    return {
      id: business.id,
      name: business.name,
      slug: business.slug,
      timezone: business.timezone,
    };
  }

  async stats(user: AuthUser) {
    const business = await this.businesses.findById(user.businessId);
    if (!business) {
      throw new NotFoundException();
    }

    const now = new Date();
    const { year, month, day } = zonedYmd(now, business.timezone);
    const weekday = zonedDateParts(now, business.timezone).dayOfWeek;
    const daysFromMonday = weekday === 0 ? 6 : weekday - 1;

    const monday = shiftCalendarDate(year, month, day, -daysFromMonday);
    const nextMonday = shiftCalendarDate(monday.year, monday.month, monday.day, 7);
    const startOfToday = zonedLocalToUtc(year, month, day, 0, business.timezone);
    const startOfTomorrow = zonedLocalToUtc(year, month, day, 24 * 60, business.timezone);
    const startOfWeek = zonedLocalToUtc(monday.year, monday.month, monday.day, 0, business.timezone);
    const startOfNextWeek = zonedLocalToUtc(
      nextMonday.year,
      nextMonday.month,
      nextMonday.day,
      0,
      business.timezone,
    );

    const [todayRows, weekRows] = await Promise.all([
      this.businesses.listActiveBookingsBetween(user.businessId, startOfToday, startOfTomorrow),
      this.businesses.listActiveBookingsBetween(user.businessId, startOfWeek, startOfNextWeek),
    ]);

    const hourCounts = weekRows.reduce<Record<string, number>>((acc, row) => {
      const minutes = zonedDateParts(row.startAt, business.timezone).minutes;
      const hour = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:00`;
      acc[hour] = (acc[hour] ?? 0) + 1;
      return acc;
    }, {});
    const mostRequestedHour =
      Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      bookingsToday: todayRows.length,
      bookingsThisWeek: weekRows.length,
      estimatedRevenueCents: weekRows.reduce((sum, row) => sum + row.service.priceCents, 0),
      mostRequestedHour,
    };
  }
}
