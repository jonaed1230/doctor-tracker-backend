import { Request, Response } from 'express';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getDashboardAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. High-level counts
    const [totalDoctors, totalPatients] = await Promise.all([
      Doctor.countDocuments(),
      Patient.countDocuments(),
    ]);

    // Average patients per doctor
    const averagePatientsPerDoctor =
      totalDoctors > 0 ? parseFloat((totalPatients / totalDoctors).toFixed(2)) : 0;

    // 2. Condition distribution aggregation
    const conditionAggregation = await Patient.aggregate([
      {
        $group: {
          _id: '$condition',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          condition: '$_id',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Guarantee all 4 standard condition categories exist even if count is 0
    const defaultConditions = ['Critical', 'Stable', 'Under Observation', 'Recovered'];
    const conditionMap = new Map(conditionAggregation.map((c) => [c.condition, c.count]));
    const conditionStats = defaultConditions.map((condition) => ({
      condition,
      count: conditionMap.get(condition) || 0,
    }));

    // 3. Specialization distribution aggregation
    const specializationStats = await Doctor.aggregate([
      {
        $group: {
          _id: '$specialization',
          doctorCount: { $sum: 1 },
          patientCount: { $sum: '$patientCount' },
        },
      },
      {
        $project: {
          _id: 0,
          specialization: '$_id',
          doctorCount: 1,
          patientCount: 1,
        },
      },
      { $sort: { patientCount: -1, doctorCount: -1 } },
      { $limit: 8 },
    ]);

    // 4. Patients per Doctor (Top Doctors by Patient Load)
    const topDoctors = await Doctor.find()
      .select('name specialization hospital patientCount')
      .sort({ patientCount: -1 })
      .limit(6)
      .lean();

    // 5. Date-based statistics (admissions over the past 30 days / grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const admissionsByDate = await Patient.aggregate([
      {
        $match: {
          admissionDate: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$admissionDate' },
          },
          admissions: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          admissions: 1,
        },
      },
    ]);

    // Fill missing dates in the 30-day range for smooth charts
    const admissionsMap = new Map(admissionsByDate.map((item) => [item.date, item.admissions]));
    const filledDateStats: { date: string; admissions: number }[] = [];
    const curr = new Date(thirtyDaysAgo);
    const now = new Date();

    while (curr <= now) {
      const dateStr = curr.toISOString().split('T')[0];
      filledDateStats.push({
        date: dateStr,
        admissions: admissionsMap.get(dateStr) || 0,
      });
      curr.setDate(curr.getDate() + 1);
    }

    // 6. Recent Patients list for dashboard quick view
    const recentPatients = await Patient.find()
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // 7. Recent Doctors list
    const recentDoctors = await Doctor.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    sendSuccess(
      res,
      {
        summary: {
          totalDoctors,
          totalPatients,
          averagePatientsPerDoctor,
        },
        conditionStats,
        specializationStats,
        topDoctors,
        dateStats: filledDateStats,
        recentPatients,
        recentDoctors,
      },
      'Dashboard analytics retrieved successfully'
    );
  } catch (error: any) {
    sendError(res, error.message || 'Failed to generate analytics', 500);
  }
};

