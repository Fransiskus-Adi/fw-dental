import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { Patient } from '../bookings/patient.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Booking } from '../bookings/booking.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async getStats(): Promise<any> {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth(); // 0-11
    
    // Fetch all active/non-deleted data to process in memory
    const transactions = await this.transactionRepository.find({
      where: { deleted: 0, enabled: 1 }
    });
    
    const patients = await this.patientRepository.find({
      where: { deleted: 0, enabled: 1 }
    });

    const doctors = await this.doctorRepository.find();
    
    const todayStr = today.toISOString().split('T')[0];
    
    const bookings = await this.bookingRepository.find({
      where: { deleted: 0, enabled: 1 },
      relations: {
        patient: true,
        doctor: true,
        service: true,
      },
      order: { startTime: 'ASC' }
    });

    // Date range configurations
    // 1. Today vs Yesterday
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(endOfToday);
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);

    // 2. This Week (last 7 days) vs Last Week
    const startOfThisWeek = new Date(today);
    startOfThisWeek.setDate(today.getDate() - 6);
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfThisWeek);
    endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);
    endOfLastWeek.setHours(23, 59, 59, 999);

    // 3. This Month (current calendar month) vs Last Month
    const startOfThisMonth = new Date(currentYear, currentMonthIndex, 1, 0, 0, 0, 0);

    const startOfLastMonth = new Date(currentYear, currentMonthIndex - 1, 1, 0, 0, 0, 0);
    const endOfLastMonth = new Date(currentYear, currentMonthIndex, 0, 23, 59, 59, 999);

    // 4. This Year (current calendar year) vs Last Year
    const startOfThisYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);

    const startOfLastYear = new Date(currentYear - 1, 0, 1, 0, 0, 0, 0);
    const endOfLastYear = new Date(currentYear, 0, 0, 23, 59, 59, 999);

    // Compute range stats
    const todayStats = this.getStatsForRange(
      transactions,
      patients,
      startOfToday,
      endOfToday,
      startOfYesterday,
      endOfYesterday,
      false // new customers registered today
    );

    const weekStats = this.getStatsForRange(
      transactions,
      patients,
      startOfThisWeek,
      endOfToday,
      startOfLastWeek,
      endOfLastWeek,
      false // new customers registered this week
    );

    const monthStats = this.getStatsForRange(
      transactions,
      patients,
      startOfThisMonth,
      endOfToday,
      startOfLastMonth,
      endOfLastMonth,
      false // new customers registered this month
    );

    // For Year filter, let's keep the cumulative numbers for total customers (all-time active)
    const yearStats = this.getStatsForRange(
      transactions,
      patients,
      startOfThisYear,
      endOfToday,
      startOfLastYear,
      endOfLastYear,
      true // use cumulative total customers
    );

    // Today's Appointments (bookings on today's date)
    const todayBookings = bookings.filter(b => b.bookingDate === todayStr);

    const upcomingAppointments = todayBookings.map(b => {
      const formatTime = (tStr: string) => {
        if (!tStr) return '';
        const parts = tStr.split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        const displayM = m.toString().padStart(2, '0');
        return `${displayH}:${displayM} ${ampm}`;
      };

      const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

      return {
        id: b.id,
        patient: b.patient?.fullName || 'Unknown Patient',
        doctor: b.doctor?.name || 'Unknown Doctor',
        time: formatTime(b.startTime),
        treatment: b.service?.name || 'General Checkup',
        status: capitalize(b.statusCode),
      };
    });

    // Clinic Activity: Active Dentists & Occupancy Rate
    const activeDoctors = doctors.filter(d => d.status === 'Active');
    const totalDentists = activeDoctors.length;

    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = weekdays[today.getDay()];

    const onDutyDoctors = activeDoctors.filter(d => d.days && d.days.includes(todayDayName));
    const activeDentistsOnDuty = onDutyDoctors.length;

    const timeToMinutes = (timeStr: string) => {
      if (!timeStr) return 0;
      const parts = timeStr.split(':');
      const h = parseInt(parts[0], 10);
      const m = parts.length > 1 ? parseInt(parts[1], 10) : 0;
      return h * 60 + m;
    };

    let totalCapacitySlots = 0;
    onDutyDoctors.forEach(doc => {
      const startMin = timeToMinutes(doc.shiftStart || '09:00');
      const endMin = timeToMinutes(doc.shiftEnd || '17:00');
      const diff = endMin - startMin;
      const slots = Math.max(0, Math.floor(diff / 30));
      totalCapacitySlots += slots;
    });

    const todayActiveBookings = todayBookings.filter(b => b.statusCode !== 'CANCELLED').length;
    let occupancyRate = 0;
    if (totalCapacitySlots > 0) {
      occupancyRate = Math.min(100, Math.round((todayActiveBookings / totalCapacitySlots) * 100));
    } else if (todayActiveBookings > 0) {
      occupancyRate = 100;
    }

    const lastWeekDate = new Date(today);
    lastWeekDate.setDate(today.getDate() - 7);
    const lastWeekStr = lastWeekDate.toISOString().split('T')[0];
    const lastWeekBookings = bookings.filter(b => b.bookingDate === lastWeekStr && b.statusCode !== 'CANCELLED').length;

    let lastWeekOccupancyRate = 0;
    if (totalCapacitySlots > 0) {
      lastWeekOccupancyRate = Math.min(100, Math.round((lastWeekBookings / totalCapacitySlots) * 100));
    } else if (lastWeekBookings > 0) {
      lastWeekOccupancyRate = 100;
    }

    const occupancyRateDiff = occupancyRate - lastWeekOccupancyRate;
    const occupancyRateGrowth = `${occupancyRateDiff >= 0 ? '+' : ''}${occupancyRateDiff}% vs wk`;

    // Chart Data for all tabs (1M, 3M, 6M, 1Y)
    const chartData = {
      '1M': this.get1MChartData(transactions),
      '3M': this.get3MChartData(transactions),
      '6M': this.get6MChartData(transactions),
      '1Y': this.get1YChartData(transactions),
    };

    return {
      today: todayStats,
      week: weekStats,
      month: monthStats,
      year: yearStats,
      upcomingAppointments,
      clinicActivity: {
        activeDentists: activeDentistsOnDuty,
        totalDentists,
        occupancyRate,
        occupancyRateGrowth,
      },
      chartData,
    };
  }

  private getStatsForRange(
    transactions: Transaction[],
    patients: Patient[],
    start: Date,
    end: Date,
    prevStart: Date,
    prevEnd: Date,
    isCumulativeCustomers: boolean
  ) {
    // Filter transactions in range
    const rangeTx = transactions.filter(tx => {
      const date = new Date(tx.createdAt);
      return date >= start && date <= end;
    });

    // Calculate balance (paid amount) in range
    const balance = rangeTx
      .filter(tx => tx.paymentStatus === 'PAID')
      .reduce((sum, tx) => sum + Number(tx.totalAmount), 0);

    // Calculate customers (either cumulative active patients or registered in range)
    const customers = isCumulativeCustomers
      ? patients.length
      : patients.filter(p => {
          const date = new Date(p.createdAt);
          return date >= start && date <= end;
        }).length;

    // Count orders in range
    const orders = rangeTx.length;

    // Calculate growth compared to previous matching range
    let customersGrowth = '0.0%';
    let ordersGrowth = '0.0%';

    const prevTx = transactions.filter(tx => {
      const date = new Date(tx.createdAt);
      return date >= prevStart && date <= prevEnd;
    }).length;

    if (prevTx > 0) {
      const growthVal = ((orders - prevTx) / prevTx) * 100;
      ordersGrowth = `${growthVal >= 0 ? '+' : ''}${growthVal.toFixed(1)}%`;
    } else if (orders > 0) {
      ordersGrowth = `+100.0%`;
    }

    if (isCumulativeCustomers) {
      // For cumulative, growth is new customers in range vs. previous range count
      const prevPatientsTotal = patients.filter(p => new Date(p.createdAt) < start).length;
      const currentPatientsTotal = patients.filter(p => new Date(p.createdAt) <= end).length;
      
      if (prevPatientsTotal > 0) {
        const growthVal = ((currentPatientsTotal - prevPatientsTotal) / prevPatientsTotal) * 100;
        customersGrowth = `${growthVal >= 0 ? '+' : ''}${growthVal.toFixed(1)}%`;
      } else if (customers > 0) {
        customersGrowth = `+100.0%`;
      }
    } else {
      // For non-cumulative, growth is count in range vs. count in prev range
      const prevPatientsCount = patients.filter(p => {
        const date = new Date(p.createdAt);
        return date >= prevStart && date <= prevEnd;
      }).length;

      if (prevPatientsCount > 0) {
        const growthVal = ((customers - prevPatientsCount) / prevPatientsCount) * 100;
        customersGrowth = `${growthVal >= 0 ? '+' : ''}${growthVal.toFixed(1)}%`;
      } else if (customers > 0) {
        customersGrowth = `+100.0%`;
      }
    }

    return {
      balance,
      customers,
      customersGrowth,
      orders,
      ordersGrowth,
      earnings: balance
    };
  }

  private get1MChartData(transactions: Transaction[]): { label: string; earnings: number }[] {
    const data: { label: string; earnings: number }[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayEarnings = transactions
        .filter(tx => tx.paymentStatus === 'PAID' && tx.transactionDate === dateStr)
        .reduce((sum, tx) => sum + Number(tx.totalAmount), 0);
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const label = `${d.getDate()} ${months[d.getMonth()]}`;
      data.push({ label, earnings: dayEarnings });
    }
    
    return data;
  }

  private get3MChartData(transactions: Transaction[]): { label: string; earnings: number }[] {
    const data: { label: string; earnings: number }[] = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - (i * 7) - 6);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() - (i * 7));
      endOfWeek.setHours(23, 59, 59, 999);

      const weekEarnings = transactions
        .filter(tx => {
          const date = new Date(tx.createdAt);
          return tx.paymentStatus === 'PAID' && date >= startOfWeek && date <= endOfWeek;
        })
        .reduce((sum, tx) => sum + Number(tx.totalAmount), 0);

      const label = `W${12 - i}`;
      data.push({ label, earnings: weekEarnings });
    }
    
    return data;
  }

  private get6MChartData(transactions: Transaction[]): { label: string; earnings: number }[] {
    const data: { label: string; earnings: number }[] = [];
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const monthEarnings = transactions
        .filter(tx => {
          const date = new Date(tx.createdAt);
          return tx.paymentStatus === 'PAID' && date >= startOfMonth && date <= endOfMonth;
        })
        .reduce((sum, tx) => sum + Number(tx.totalAmount), 0);

      data.push({ label: months[month], earnings: monthEarnings });
    }
    
    return data;
  }

  private get1YChartData(transactions: Transaction[]): { label: string; earnings: number }[] {
    const data: { label: string; earnings: number }[] = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let month = 0; month < 12; month++) {
      const startOfMonth = new Date(currentYear, month, 1);
      const endOfMonth = new Date(currentYear, month + 1, 0, 23, 59, 59, 999);

      const monthEarnings = transactions
        .filter(tx => {
          const date = new Date(tx.createdAt);
          return tx.paymentStatus === 'PAID' && date >= startOfMonth && date <= endOfMonth;
        })
        .reduce((sum, tx) => sum + Number(tx.totalAmount), 0);

      data.push({ label: months[month], earnings: monthEarnings });
    }
    
    return data;
  }
}
